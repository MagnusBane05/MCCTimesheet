from rest_framework import serializers  # type: ignore[attr-defined]

from .models import User


class UserSerializer(serializers.ModelSerializer):  # type: ignore[misc]
    active = serializers.BooleanField(source='is_active')  # type: ignore[attr-defined]

    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'role', 'active']
        read_only_fields = ['id']

    def create(self, validated_data):  # type: ignore[no-untyped-def]
        """Create user with password. Admin creates with a default password."""
        is_active = validated_data.pop('is_active', True)
        user = User.objects.create_user(
            username=validated_data['username'],
            password='ChangeMe123!',  # Default password that admin must change
            display_name=validated_data['display_name'],
            role=validated_data['role'],
            is_active=is_active,
        )
        return user

    def update(self, instance: User, validated_data: dict):  # type: ignore[no-untyped-def]
        """Update user fields (password changes require separate endpoint)."""
        request = self.context.get('request')

        # Prevent admins from deactivating themselves
        if 'is_active' in validated_data and not validated_data['is_active']:
            if request and request.user.id == instance.id:  # type: ignore[attr-defined]
                raise serializers.ValidationError(
                    'You cannot deactivate your own account.'
                )

        instance.username = validated_data.get('username', instance.username)
        instance.display_name = validated_data.get('display_name', instance.display_name)
        instance.role = validated_data.get('role', instance.role)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        instance.save()
        return instance

