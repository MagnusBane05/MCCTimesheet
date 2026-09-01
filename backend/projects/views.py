from typing import Any

from rest_framework import status, viewsets  # type: ignore[attr-defined]
from rest_framework.decorators import action  # type: ignore[attr-defined]
from rest_framework.permissions import IsAuthenticated  # type: ignore[attr-defined]
from rest_framework.request import Request  # type: ignore[attr-defined]
from rest_framework.response import Response  # type: ignore[attr-defined]

from core.permissions import IsAdmin
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
            permission_classes = [IsAuthenticated]
        elif self.action in ('create', 'update', 'partial_update', 'destroy', 'activate', 'deactivate'):  # type: ignore[attr-defined]
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:  # type: ignore[override,no-untyped-def]
        """Prevent deletion through the API; use activate/deactivate instead."""
        return Response(
            {'detail': 'Projects cannot be deleted. Use activate/deactivate instead.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])  # type: ignore[misc]
    def activate(self, request: Request, pk: int | None = None) -> Response:  # type: ignore[no-untyped-def]
        """Activate an inactive project."""
        project = self.get_object()  # type: ignore[attr-defined]
        project.active = True
        project.save()
        return Response(ProjectSerializer(project).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])  # type: ignore[misc]
    def deactivate(self, request: Request, pk: int | None = None) -> Response:  # type: ignore[no-untyped-def]
        """Deactivate an active project."""
        project = self.get_object()  # type: ignore[attr-defined]
        project.active = False
        project.save()
        return Response(ProjectSerializer(project).data)
