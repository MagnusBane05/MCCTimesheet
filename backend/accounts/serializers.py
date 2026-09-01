from rest_framework import serializers  # type: ignore[attr-defined]

from .models import User


class UserSerializer(serializers.ModelSerializer):  # type: ignore[misc]
    active = serializers.BooleanField(source='is_active')  # type: ignore[attr-defined]

    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'role', 'active']
        read_only_fields = fields

