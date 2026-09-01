"""
Role-based permission classes for DRF views. All views should use at least
IsAuthenticated; specific operations (create/update/delete) check for ADMIN
or other relevant roles.
"""
from rest_framework.permissions import BasePermission  # type: ignore[attr-defined]
from rest_framework.request import Request  # type: ignore[attr-defined]
from rest_framework.views import APIView  # type: ignore[attr-defined]

from accounts.models import UserRole


class IsAdmin(BasePermission):  # type: ignore[misc]
    def has_permission(self, request: Request, _view: APIView) -> bool:  # type: ignore[override,no-untyped-def]
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN)  # type: ignore[union-attr,attr-defined]


class IsAdminOrReadOnly(BasePermission):  # type: ignore[misc]
    def has_permission(self, request: Request, _view: APIView) -> bool:  # type: ignore[override,no-untyped-def]
        if not (request.user and request.user.is_authenticated):  # type: ignore[union-attr,attr-defined]
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):  # type: ignore[attr-defined]
            return True
        return bool(request.user.role == UserRole.ADMIN)  # type: ignore[union-attr,attr-defined]


class IsEmployeeOrAdmin(BasePermission):  # type: ignore[misc]
    def has_permission(self, request: Request, _view: APIView) -> bool:  # type: ignore[override,no-untyped-def]
        if not (request.user and request.user.is_authenticated):  # type: ignore[union-attr,attr-defined]
            return False
        return bool(request.user.role in (UserRole.EMPLOYEE, UserRole.ADMIN))  # type: ignore[union-attr,attr-defined]
