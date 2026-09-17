import secrets
import string
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import User


def generate_temporary_password(length: int = 16) -> str:
    """Generate a strong temporary password."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class UserSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source='is_active')
    temporary_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'role', 'active', 'must_change_password', 'temporary_password']
        read_only_fields = ['id', 'must_change_password', 'temporary_password']

    def get_temporary_password(self, obj: User) -> str | None:  # type: ignore[no-untyped-def]
        """Return temporary password only during creation (stored in context)."""
        return self.context.get('temporary_password')

    def create(self, validated_data):  # type: ignore[no-untyped-def]
        """Create user with temporary password that must be changed on first login."""
        is_active = validated_data.pop('is_active', True)
        temp_password = generate_temporary_password()
        user = User.objects.create_user(
            username=validated_data['username'],
            password=temp_password,
            display_name=validated_data['display_name'],
            role=validated_data['role'],
            is_active=is_active,
            must_change_password=True,
        )
        # Store temp password in context so it's included in the response
        self.context['temporary_password'] = temp_password
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


class ChangePasswordSerializer(serializers.Serializer):  # type: ignore[misc]
    """Serializer for changing user password."""
    old_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value: str) -> str:  # type: ignore[no-untyped-def]
        """Validate that new password meets minimum requirements."""
        user = self.context.get('user')
        try:
            validate_password(value, user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages)
        return value

    def validate(self, data: dict) -> dict:  # type: ignore[no-untyped-def]
        user = self.context.get('user')

        # If user must change password (initial login), don't require old password
        if not user.must_change_password: # type: ignore[attr-defined]
            old_password = data.get('old_password')
            if not old_password:
                raise serializers.ValidationError('Old password is required.')
            if not user.check_password(old_password):  # type: ignore[attr-defined]
                raise serializers.ValidationError('Old password is incorrect.')

        return data

    def save(self) -> User:  # type: ignore[no-untyped-def]
        user: User = self.context['user']
        new_password = self.validated_data.get('new_password')  # type: ignore[attr-defined]
        user.set_password(new_password)  # type: ignore[attr-defined]
        user.must_change_password = False  # type: ignore[attr-defined]
        user.save() # type: ignore[attr-defined]
        return user


class ResetPasswordSerializer(serializers.Serializer):  # type: ignore[misc]
    """Serializer for admin to reset a user's password (returns temporary password)."""
    temporary_password = serializers.SerializerMethodField()

    def get_temporary_password(self, obj: dict) -> str | None:  # type: ignore[no-untyped-def]
        return obj.get('temporary_password')

    def save(self, user: User) -> dict:  # type: ignore[no-untyped-def]
        temp_password = generate_temporary_password()
        user.set_password(temp_password)
        user.must_change_password = True
        user.save()
        return {'temporary_password': temp_password}

