from django.conf import settings
from django.db import models

from projects.models import Project

class MaterialTypeCategory(models.Model):
    name = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name}'


class MaterialType(models.Model):
    category = models.ForeignKey(MaterialTypeCategory, on_delete=models.PROTECT, related_name='material_types')
    name = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.name}'

class MaterialEntry(models.Model):
    project = models.ForeignKey(Project, on_delete=models.PROTECT, 
                                related_name='material_entries')
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                 related_name='material_entries')

    name = models.TextField()
    material_type = models.ForeignKey(MaterialType, on_delete=models.PROTECT, related_name='material_entries')
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['material_type', 'name']

    def __str__(self):
        return f'{self.name}'
