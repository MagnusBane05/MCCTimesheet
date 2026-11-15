from typing import Any, Optional, cast

from django.db.models import QuerySet
from rest_framework import serializers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from accounts.models import User, UserRole
from core.permissions import HasChangedInitialPassword
from materials.models import MaterialEntry, MaterialType, MaterialTypeCategory
from materials.serializers import MaterialEntrySerializer, MaterialTypeCategorySerializer, MaterialTypeSerializer


class MaterialEntryViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialEntrySerializer
    permission_classes = [IsAuthenticated, HasChangedInitialPassword]

    def get_queryset(self) -> QuerySet[MaterialEntry]:  # pyright: ignore[reportIncompatibleMethodOverride]
        user = cast(User, self.request.user)

        if user.role == UserRole.ADMIN.value:
            queryset = MaterialEntry.objects.all()  # pyright: ignore[reportAttributeAccessIssue]
        elif user.role == UserRole.VIEWER.value:
            queryset = MaterialEntry.objects.all()  # pyright: ignore[reportAttributeAccessIssue]
        else: # EMPLOYEE
            queryset = MaterialEntry.objects.filter(employee_id = user.id)  # pyright: ignore[reportAttributeAccessIssue]

        employee_id: Optional[str] = self.request.query_params.get('employeeId')  # pyright: ignore[reportAssignmentType]
        project_id: Optional[str] = self.request.query_params.get('projectId')  # pyright: ignore[reportAssignmentType]

        if employee_id and user.role == UserRole.ADMIN.value:
            queryset = queryset.filter(employee_id=int(employee_id))
        if project_id:
            queryset = queryset.filter(project_id=int(project_id))

        return queryset

    def perform_create(self, serializer: MaterialEntrySerializer) -> None:
        user = cast(User, self.request.user)
        employee = serializer.validated_data.get('employee')  # pyright: ignore[reportAttributeAccessIssue, reportOptionalMemberAccess]

        if user.role == UserRole.EMPLOYEE.value and employee.id != user.id:  # pyright: ignore[reportOptionalMemberAccess, reportAttributeAccessIssue]
            raise serializers.ValidationError("Employees can only create entries for themselves.")
        if user.role == UserRole.VIEWER.value:
            raise serializers.ValidationError("Viewers cannot create material entries.")

        serializer.save()

    def perform_update(self, serializer: MaterialEntrySerializer) -> None:
        user = cast(User, self.request.user)
        entry = cast(MaterialEntry, self.get_object())

        if user.role == UserRole.EMPLOYEE.value and entry.employee.id != user.id:
            raise serializers.ValidationError("Employees can only edit their own entries.")
        if user.role == UserRole.VIEWER.value:
            raise serializers.ValidationError("Viewers cannot modify material entries.")

        serializer.save()

    def perform_destroy(self, instance: MaterialEntry) -> None:
        user = cast(User, self.request.user)

        if user.role == UserRole.EMPLOYEE.value and instance.employee.id != user.id:  # pyright: ignore[reportAttributeAccessIssue]
            raise serializers.ValidationError("Employees can only delete their own material entries")
        if user.role == UserRole.VIEWER.value:
            raise serializers.ValidationError("Viewers cannot delete material entries.")

        instance.delete()

class MaterialTypeViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialTypeSerializer
    permission_classes = [IsAuthenticated, HasChangedInitialPassword]

    def get_queryset(self) -> QuerySet[MaterialType]:  # pyright: ignore[reportIncompatibleMethodOverride]
        return MaterialType.objects.all()  # pyright: ignore[reportAttributeAccessIssue]

    def perform_create(self, serializer: MaterialTypeSerializer) -> None:
        user = cast(User, self.request.user)

        if user.role == UserRole.VIEWER.value or user.role == UserRole.EMPLOYEE.value:
            raise serializers.ValidationError("Only admins can create material types.")

        serializer.save()

    def perform_update(self, serializer: MaterialTypeSerializer) -> None:
        user = cast(User, self.request.user)

        if user.role == UserRole.VIEWER.value or user.role == UserRole.EMPLOYEE.value:
            raise serializers.ValidationError("Only admins can modify material types.")

        serializer.save()

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:  # type: ignore[override]
        return Response(
            {'detail': 'Material types cannot be deleted. Use PATCH with active: false to expire instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

class MaterialTypeCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialTypeCategorySerializer
    permission_classes = [IsAuthenticated, HasChangedInitialPassword]

    def get_queryset(self) -> QuerySet[MaterialTypeCategory]:  # pyright: ignore[reportIncompatibleMethodOverride]
        return MaterialTypeCategory.objects.all()  # pyright: ignore[reportAttributeAccessIssue]

    def perform_create(self, serializer: MaterialTypeCategorySerializer) -> None:
        user = cast(User, self.request.user)

        if user.role == UserRole.VIEWER.value or user.role == UserRole.EMPLOYEE.value:
            raise serializers.ValidationError("Only admins can create material type categories.")

        serializer.save()

    def perform_update(self, serializer: MaterialTypeCategorySerializer) -> None:
        user = cast(User, self.request.user)

        if user.role == UserRole.VIEWER.value or user.role == UserRole.EMPLOYEE.value:
            raise serializers.ValidationError("Only admins can modify material type categories.")

        serializer.save()

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:  # type: ignore[override]
        return Response(
            {'detail': 'Material type categories cannot be deleted. Use PATCH with active: false to expire instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

