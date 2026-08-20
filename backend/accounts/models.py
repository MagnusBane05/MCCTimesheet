from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    EMPLOYEE = 'EMPLOYEE', 'Employee'
    VIEWER = 'VIEWER', 'Viewer'
    ADMIN = 'ADMIN', 'Admin'


class User(AbstractUser):
    """
    Custom user model (required before the first migration). `is_active`
    from AbstractUser is used directly as the app's "active" concept rather
    than introducing a competing field.
    """

    display_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.EMPLOYEE)

    def __str__(self):
        return self.username
