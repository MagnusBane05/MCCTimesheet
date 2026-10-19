from rest_framework import serializers

from accounts.models import User 
from projects.models import Project
from .models import MaterialEntry, MaterialType, MaterialTypeCategory


class MaterialEntrySerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())  # pyright: ignore[reportAttributeAccessIssue]
    material_type = serializers.PrimaryKeyRelatedField(queryset=MaterialType.objects.all())  # pyright: ignore[reportAttributeAccessIssue]

    class Meta:
        model = MaterialEntry
        fields = [
            'id',
            'project',
            'employee',
            'name',
            'material_type',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class MaterialTypeSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=MaterialTypeCategory.objects.all())  # pyright: ignore[reportAttributeAccessIssue]

    class Meta:
        model = MaterialType
        fields = [
            'id',
            'category',
            'name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class MaterialTypeCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = MaterialTypeCategory
        fields = [
            'id',
            'name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

