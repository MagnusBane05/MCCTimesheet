from typing import Any
from rest_framework import serializers

from accounts.models import UserRole, User
from .models import TimeEntry
from .validators import (
    validate_quarter_hour_times,
    validate_time_order_and_duration,
    validate_no_overlap,
    validate_employee_edit_date,
    validate_invoice_number_access,
)


class TimeEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for TimeEntry with field mapping and business rule validation.
    Frontend uses camelCase; API uses snake_case (converted by ApiTimesheetService).
    """

    employee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    project = serializers.IntegerField(write_only=True)

    class Meta:
        model = TimeEntry
        fields = [
            'id',
            'employee',
            'project',
            'work_date',
            'start_time',
            'end_time',
            'work_description',
            'invoice_number',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance: TimeEntry) -> dict[str, Any]:
        """Convert to output format (project as ID)."""
        ret = super().to_representation(instance)
        ret['project'] = instance.project.id  # type: ignore[attr-defined]
        return ret

    def create(self, validated_data: dict[str, Any]) -> TimeEntry:
        """Create entry, converting project ID to actual object."""
        from projects.models import Project
        project_id = validated_data.pop('project')
        project = Project.objects.get(id=project_id)
        return TimeEntry.objects.create(project=project, **validated_data)

    def update(self, instance: TimeEntry, validated_data: dict[str, Any]) -> TimeEntry:
        """Update entry, handling project conversion."""
        from projects.models import Project
        if 'project' in validated_data:
            project_id = validated_data.pop('project')
            instance.project = Project.objects.get(id=project_id)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Run all business rule validators."""
        data = attrs
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        work_date = data.get('work_date')
        employee = data.get('employee')
        invoice_number = data.get('invoice_number')

        if start_time and end_time:
            validate_quarter_hour_times(start_time, end_time)
            validate_time_order_and_duration(start_time, end_time)

        if employee and work_date and start_time and end_time:
            exclude_id = self.instance.id if self.instance else None  # type: ignore[attr-defined]
            validate_no_overlap(employee.id, work_date, start_time, end_time, exclude_id)

        # Validate employee can edit this date
        if work_date:
            request = self.context.get('request')
            user = getattr(request, 'user', None) if request else None
            is_admin = user is not None and user.role == UserRole.ADMIN
            validate_employee_edit_date(work_date, is_admin=is_admin)

        # Validate invoice number access
        if self.context.get('request'):
            user = self.context['request'].user  # type: ignore[attr-defined]
            original_invoice = self.instance.invoice_number if self.instance else None  # type: ignore[attr-defined]
            validate_invoice_number_access(user, invoice_number, original_invoice)

        return data



