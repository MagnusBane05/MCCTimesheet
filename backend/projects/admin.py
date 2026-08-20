from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('project_number', 'name', 'customer', 'active', 'production_status')
    list_filter = ('active', 'production_status')
    search_fields = ('name', 'customer', 'project_number')
