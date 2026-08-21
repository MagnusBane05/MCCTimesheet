from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source='is_active')

    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'role', 'active']
        read_only_fields = fields
