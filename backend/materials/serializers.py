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
            'material_type',
            'description',
            'quantity',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_material_type(self, value: MaterialType) -> MaterialType:
        instance = self.instance
        if value.is_available or (isinstance(instance, MaterialEntry) and instance.material_type_id == value.id):  # pyright: ignore[reportAttributeAccessIssue]
            return value
        raise serializers.ValidationError("This material type has expired.")

class MaterialTypeSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(queryset=MaterialTypeCategory.objects.all())  # pyright: ignore[reportAttributeAccessIssue]

    class Meta:
        model = MaterialType
        fields = [
            'id',
            'category',
            'name',
            'active',
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
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

