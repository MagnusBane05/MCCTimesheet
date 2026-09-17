from django.contrib.auth import authenticate, login as django_login, logout as django_logout, update_session_auth_hash
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import viewsets, status  # type: ignore[attr-defined]
from rest_framework.decorators import api_view, permission_classes, action  # type: ignore[attr-defined]
from rest_framework.permissions import AllowAny, IsAuthenticated  # type: ignore[attr-defined]
from rest_framework.request import Request  # type: ignore[attr-defined]
from rest_framework.response import Response  # type: ignore[attr-defined]
from rest_framework.status import HTTP_204_NO_CONTENT, HTTP_400_BAD_REQUEST  # type: ignore[attr-defined]
from typing import Any

from core.permissions import IsAdmin, HasChangedInitialPassword
from .models import User
from .serializers import UserSerializer, ChangePasswordSerializer, ResetPasswordSerializer


def _auth_error(detail: str) -> Response:  # type: ignore[no-untyped-def]
    # Matches core.exceptions.api_exception_handler's {detail, errors} shape
    # directly, rather than relying on DRF's ValidationError (which wraps a
    # plain string detail into a bare list, not {'detail': ...}).
    return Response({'detail': detail, 'errors': None}, status=HTTP_400_BAD_REQUEST)


@api_view(['GET'])  # type: ignore[misc]
@permission_classes([AllowAny])  # type: ignore[misc]
@ensure_csrf_cookie
def csrf(request):  # type: ignore[no-untyped-def]
    """
    An AJAX-only SPA never triggers Django's normal CSRF-cookie-setting
    paths, so the frontend must hit this once (on load, before login) to
    get the `csrftoken` cookie apiClient.ts then echoes back as X-CSRFToken.
    """
    return Response({'detail': 'CSRF cookie set.'})


@api_view(['POST'])  # type: ignore[misc]
@permission_classes([AllowAny])  # type: ignore[misc]
def login_view(request):  # type: ignore[no-untyped-def]
    username = request.data.get('username', '')  # type: ignore[attr-defined]
    password = request.data.get('password', '')  # type: ignore[attr-defined]
    if not username or not password:
        return _auth_error('Username and password are required.')

    # authenticate() already refuses inactive users (ModelBackend checks is_active).
    user = authenticate(request, username=username, password=password)
    if user is None:
        return _auth_error('Incorrect username or password.')

    django_login(request, user)
    serializer = UserSerializer(user)
    return Response(serializer.data)


# DRF's APIView.as_view() marks every view csrf_exempt by default (relying on
# SessionAuthentication to re-enable CSRF, which only kicks in once a session
# already exists). Login is exactly the anonymous-request case that misses,
# so un-exempt it explicitly and let the already-active CsrfViewMiddleware
# enforce it normally ("login CSRF" is a real, distinct attack from the usual
# authenticated-session CSRF threat model).
login_view.csrf_exempt = False  # type: ignore[attr-defined]


@api_view(['POST'])  # type: ignore[misc]
@permission_classes([AllowAny])  # type: ignore[misc]
def logout_view(request):  # type: ignore[no-untyped-def]
    django_logout(request)
    return Response(status=HTTP_204_NO_CONTENT)


@api_view(['GET'])  # type: ignore[misc]
@permission_classes([IsAuthenticated])  # type: ignore[misc]
def me_view(request):  # type: ignore[no-untyped-def]
    serializer = UserSerializer(request.user)  # type: ignore[attr-defined]
    return Response(serializer.data)


@api_view(['POST'])  # type: ignore[misc]
@permission_classes([IsAuthenticated])  # type: ignore[misc]
def change_password_view(request):  # type: ignore[no-untyped-def]
    """Allow user to change their password (or set it for the first time if must_change_password=True)."""
    serializer = ChangePasswordSerializer(
        data=request.data,  # type: ignore[attr-defined]
        context={'user': request.user}  # type: ignore[attr-defined]
    )
    if serializer.is_valid():
        user = serializer.save()
        update_session_auth_hash(request, user)  # type: ignore[arg-type]
        return Response(
            {'detail': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )
    # Format validation errors into a user-friendly detail message
    error_messages = []
    for errors in serializer.errors.values():  # type: ignore[attr-defined]
        for message in errors:
            error_messages.append(str(message))
    detail = ' '.join(error_messages) if error_messages else 'Password validation failed.'

    return Response(
        {'detail': detail, 'errors': serializer.errors},  # type: ignore[attr-defined]
        status=status.HTTP_400_BAD_REQUEST
    )


class EmployeeViewSet(viewsets.ModelViewSet):  # type: ignore[misc]
    """
    API endpoint for employee management.

    - GET /employees/: List employees
    - GET /employees/{id}/: Retrieve employee
    - POST /employees/: Create employee (ADMIN only)
    - PATCH /employees/{id}/: Update employee (ADMIN only)
    - DELETE /employees/{id}/: Not allowed (use PATCH with active: false to deactivate)
    - POST /employees/{id}/reset-password/: Reset employee password (ADMIN only)
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):  # type: ignore[no-untyped-def]
        return User.objects.all().order_by('display_name')

    def get_permissions(self) -> list[Any]:  # type: ignore[no-untyped-def]
        """Override permission_classes based on the action."""
        if self.action in ('list', 'retrieve'):
            permission_classes = [IsAuthenticated, HasChangedInitialPassword]
        elif self.action in ('create', 'update', 'partial_update', 'destroy', 'reset_password'):
            permission_classes = [IsAdmin, HasChangedInitialPassword]
        else:
            permission_classes = [IsAuthenticated, HasChangedInitialPassword]
        return [permission() for permission in permission_classes]

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Prevent deletion through the API; use PATCH to deactivate instead."""
        return Response(
            {'detail': 'Employees cannot be deleted. Use PATCH with active: false to deactivate instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['post'], url_path='reset-password')  # type: ignore[misc]
    def reset_password(self, request: Request, pk: Any = None) -> Response:  # type: ignore[no-untyped-def]
        """Admin endpoint to reset an employee's password."""
        user = self.get_object()
        serializer = ResetPasswordSerializer()
        result = serializer.save(user)
        return Response(result, status=status.HTTP_200_OK)

