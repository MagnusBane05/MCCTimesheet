from django.contrib.auth.admin import UserAdmin
from django.contrib import admin

from .models import User


@admin.register(User)
class MccUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('display_name', 'role')}),
    )
    list_display = ('username', 'display_name', 'role', 'is_active', 'is_staff')
    list_filter = UserAdmin.list_filter + ('role',)
