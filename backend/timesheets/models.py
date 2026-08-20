from django.conf import settings
from django.db import models

from projects.models import Project


class TimeEntry(models.Model):
    # PROTECT (not CASCADE) so deactivating/retiring an employee or project
    # can never silently delete historical time entries.
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='time_entries'
    )
    project = models.ForeignKey(Project, on_delete=models.PROTECT, related_name='time_entries')

    work_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    work_description = models.TextField()

    # Nullable by design; only an ADMIN may set/clear this (enforced in the
    # API layer, not at the model level).
    invoice_number = models.CharField(max_length=50, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-work_date', 'start_time']

    def __str__(self):
        return f'{self.employee_id} {self.work_date} {self.start_time}-{self.end_time}'
