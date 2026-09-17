from typing import cast, Optional
from django.db.models import QuerySet
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserRole, User
from core.permissions import HasChangedInitialPassword
from .models import TimeEntry
from .serializers import TimeEntrySerializer


class TimeEntryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for time entry management.

    - GET /time-entries/: List entries (filtered by role)
    - GET /time-entries/{id}/: Retrieve entry
    - POST /time-entries/: Create entry (EMPLOYEE creates own, ADMIN creates for anyone)
    - PATCH /time-entries/{id}/: Update entry (with editing window enforcement)
    - DELETE /time-entries/{id}/: Delete entry (with permission enforcement)
    """

    serializer_class = TimeEntrySerializer
    permission_classes = [IsAuthenticated, HasChangedInitialPassword]

    def get_queryset(self) -> QuerySet[TimeEntry]: # type: ignore[override]
        """Filter entries based on user role and query parameters."""
        user = cast(User, self.request.user)

        if user.role == UserRole.ADMIN.value:
            queryset = TimeEntry.objects.all()
        elif user.role == UserRole.VIEWER.value:
            queryset = TimeEntry.objects.all()
        else:  # EMPLOYEE
            queryset = TimeEntry.objects.filter(employee_id=user.id)  # type: ignore[attr-defined]

        date_from: Optional[str] = self.request.query_params.get('from') # type: ignore[assignment]
        date_to: Optional[str] = self.request.query_params.get('to') # type: ignore[assignment]
        employee_id: Optional[str] = self.request.query_params.get('employeeId') # type: ignore[assignment]

        if date_from:
            queryset = queryset.filter(work_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(work_date__lte=date_to)
        # Only allow employee ID filtering for admins
        if employee_id and user.role == UserRole.ADMIN.value:
            queryset = queryset.filter(employee_id=int(employee_id))

        return queryset

    def perform_create(self, serializer: TimeEntrySerializer) -> None:
        """
        Handle creation with role-based logic:
        - EMPLOYEE can only create entries for themselves
        - ADMIN can create entries for anyone
        """
        user = cast(User, self.request.user)
        employee = serializer.validated_data.get('employee')  # type: ignore[attr-defined]

        # Add authorization check
        if user.role == UserRole.EMPLOYEE.value and employee.id != user.id:  # type: ignore[attr-defined]
            raise serializers.ValidationError(
                "Employees can only create entries for themselves."
            )
        if user.role == UserRole.VIEWER.value:
            raise serializers.ValidationError("Viewers cannot create time entries.")

        serializer.save()

    def perform_update(self, serializer: TimeEntrySerializer) -> None:
        """Update entry with authorization checks."""
        user = cast(User, self.request.user)
        entry = cast(TimeEntry, self.get_object())

        if user.role == UserRole.EMPLOYEE.value and entry.employee.id != user.id:  # type: ignore[attr-defined]
            raise serializers.ValidationError(
                "Employees can only edit their own entries."
            )
        if user.role == UserRole.VIEWER.value:
            raise serializers.ValidationError("Viewers cannot modify time entries.")

        serializer.save()

    def perform_destroy(self, instance: TimeEntry) -> None:
        """Delete entry with authorization checks."""
        user = cast(User, self.request.user)

        if user.role == UserRole.EMPLOYEE.value and instance.employee.id != user.id:  # type: ignore[attr-defined]
            raise serializers.ValidationError(
                "Employees can only delete their own entries."
            )
        if user.role == UserRole.VIEWER.value:
            raise serializers.ValidationError("Viewers cannot delete time entries.")

        instance.delete()

