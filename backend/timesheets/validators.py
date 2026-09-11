"""
Business rule validators for time entries.
Centralized here so rules are enforced consistently across the API.
"""
from datetime import datetime, time, timedelta, date

from django.utils import timezone
from rest_framework import serializers

from accounts.models import UserRole, User

# Mirrors frontend/src/utils/overtime.ts
WEEKLY_OVERTIME_THRESHOLD = 44


def validate_quarter_hour_times(start_time: time, end_time: time) -> None:
    """Validate that times are on 15-minute boundaries."""
    for t in (start_time, end_time):
        if t.minute % 15 != 0:
            raise serializers.ValidationError(
                f"Times must use 15-minute increments (00, 15, 30, 45). Got {t.strftime('%H:%M')}."
            )


def validate_time_order_and_duration(start_time: time, end_time: time) -> None:
    """Validate that end time is after start time and not equal."""
    if end_time <= start_time:
        raise serializers.ValidationError("End time must be after start time.")


def validate_no_overlap(
    employee_id: int, work_date: date, start_time: time, end_time: time, exclude_id: int | None = None
) -> None:
    """
    Validate that this entry doesn't overlap with others for the same employee on the same date.
    Adjacent entries (touching at exact times) are allowed.
    """
    from .models import TimeEntry

    query = TimeEntry.objects.filter(employee_id=employee_id, work_date=work_date)
    if exclude_id:
        query = query.exclude(id=exclude_id)

    for entry in query:
        if start_time < entry.end_time and end_time > entry.start_time:
            raise serializers.ValidationError(
                f"Time entries cannot overlap. Conflicts with {entry.start_time.strftime('%H:%M')}-{entry.end_time.strftime('%H:%M')}."
            )


def get_employee_editable_date_range(today: str | None = None) -> tuple[str, str]:
    """
    Returns the date range an employee can edit entries for.
    - Current week (Mon-Sun) through today
    - Previous week (Mon-Sun)

    Args:
        today: YYYY-MM-DD string, defaults to today

    Returns:
        Tuple of (start_date, end_date) both in YYYY-MM-DD format
    """
    if today is None:
        today_date = timezone.now().date()
    else:
        today_date = datetime.strptime(today, "%Y-%m-%d").date()

    # Monday = 0, Sunday = 6
    current_weekday = today_date.weekday()
    days_since_monday = current_weekday

    # Current week starts on Monday
    current_week_start = today_date - timedelta(days=days_since_monday)
    current_week_end = today_date

    # Previous week
    previous_week_end = current_week_start - timedelta(days=1)  # Sunday of previous week
    previous_week_start = previous_week_end - timedelta(days=6)  # Monday of previous week

    # Return earliest start (previous Monday) through today
    return previous_week_start.strftime("%Y-%m-%d"), current_week_end.strftime("%Y-%m-%d")


def validate_employee_edit_date(work_date_str: str | date, today: str | None = None, is_admin: bool = False) -> None:
    """
    Validate that a non-admin employee can only edit entries within their allowed date window.
    Admins can edit any date.
    """
    if is_admin:
        return

    if isinstance(work_date_str, str):
        work_date = datetime.strptime(work_date_str, "%Y-%m-%d").date()
    else:
        work_date = work_date_str

    editable_start_str, editable_end_str = get_employee_editable_date_range(today)
    editable_start = datetime.strptime(editable_start_str, "%Y-%m-%d").date()
    editable_end = datetime.strptime(editable_end_str, "%Y-%m-%d").date()

    if not (editable_start <= work_date <= editable_end):
        raise serializers.ValidationError(
            f"You can only edit entries from {editable_start_str} through {editable_end_str}."
        )


def validate_invoice_number_access(user: User, invoice_number: str | None, original_invoice: str | None = None) -> None:
    """
    Only ADMIN can set or modify invoiceNumber.
    EMPLOYEE/VIEWER requests trying to set it should fail.
    """
    if user.role != UserRole.ADMIN.value:
        # Check if they're trying to set a new invoice number
        if invoice_number and invoice_number != original_invoice:
            raise serializers.ValidationError(
                "Only administrators can set or modify invoice numbers."
            )
