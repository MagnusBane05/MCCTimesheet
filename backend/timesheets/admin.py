from django.contrib import admin

from .models import TimeEntry


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ('employee', 'project', 'work_date', 'start_time', 'end_time', 'invoice_number')
    list_filter = ('work_date', 'project')
    search_fields = ('employee__username', 'work_description', 'invoice_number')
