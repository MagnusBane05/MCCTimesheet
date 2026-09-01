from rest_framework import serializers  # type: ignore[attr-defined]

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):  # type: ignore[misc]
    production_status = serializers.CharField()  # type: ignore[attr-defined]

    class Meta:
        model = Project
        fields = ['id', 'customer', 'name', 'project_number', 'active', 'production_status']
        read_only_fields = ['id']


