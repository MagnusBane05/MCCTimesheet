from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from projects.models import Project

class MaterialTypeCategory(models.Model):
    name = models.TextField()
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name}'


class MaterialType(models.Model):
    category = models.ForeignKey(MaterialTypeCategory, on_delete=models.PROTECT, related_name='material_types')
    name = models.TextField()
    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name}'

    @property
    def is_available(self) -> bool:
        return self.active and self.category.active

class MaterialEntry(models.Model):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, 
                                related_name='material_entries')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                 related_name='material_entries')

    material_type = models.ForeignKey(MaterialType, on_delete=models.PROTECT, related_name='material_entries')
    description = models.TextField()
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['material_type', 'created_at']

    def __str__(self):
        return f'{self.material_type} x{self.quantity}'
