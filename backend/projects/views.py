from typing import Any

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.permissions import IsAdmin, HasChangedInitialPassword
from .models import Project
from .serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):  # type: ignore[misc]
    """
    API endpoint for project management.

    - GET /projects/: List projects (all authenticated users see all projects)
    - GET /projects/{id}/: Retrieve a project
    - POST /projects/: Create project (ADMIN only)
    - PATCH /projects/{id}/: Update project (ADMIN only)
    - DELETE /projects/{id}/: Not allowed through normal API
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self) -> list[Any]:  # type: ignore[no-untyped-def]
        """Override permission_classes based on the action."""
        if self.action in ('list', 'retrieve'):  # type: ignore[attr-defined]
            permission_classes = [IsAuthenticated, HasChangedInitialPassword]
        elif self.action in ('create', 'update', 'partial_update', 'destroy'):  # type: ignore[attr-defined]
            permission_classes = [IsAdmin, HasChangedInitialPassword]
        else:
            permission_classes = [IsAuthenticated, HasChangedInitialPassword]
        return [permission() for permission in permission_classes]

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:  # type: ignore[override,no-untyped-def]
        """Prevent deletion through the API; use PATCH to deactivate instead."""
        return Response(
            {'detail': 'Projects cannot be deleted. Use PATCH with active: false to deactivate instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
