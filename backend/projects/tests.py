"""
Tests for the Projects API.

Covers:
- Permission enforcement (ADMIN-only modifications)
- List/retrieve operations
- Create/update/delete operations
- Activate/deactivate endpoints
- Production status handling
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import UserRole
from projects.models import Project, ProductionStatus

User = get_user_model()


class ProjectAPITestCase(TestCase):
    """Test the Projects REST API."""

    def setUp(self):
        """Create test users and projects."""
        self.client = APIClient()

        # Create users with different roles
        self.admin = User.objects.create_user(
            username='admin',
            password='password123',
            display_name='Admin User',
            role=UserRole.ADMIN,
            is_active=True,
        )
        self.employee = User.objects.create_user(
            username='employee',
            password='password123',
            display_name='Employee User',
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        self.viewer = User.objects.create_user(
            username='viewer',
            password='password123',
            display_name='Viewer User',
            role=UserRole.VIEWER,
            is_active=True,
        )

        # Create test projects
        self.project1 = Project.objects.create(
            customer='Acme Corp',
            name='Project 1',
            project_number='PRJ-001',
            active=True,
            production_status=ProductionStatus.IN_PROGRESS,
        )
        self.project2 = Project.objects.create(
            customer='Beta Inc',
            name='Project 2',
            project_number='PRJ-002',
            active=False,
            production_status=ProductionStatus.COMPLETE,
        )

    def test_list_projects_unauthenticated(self):
        """Unauthenticated users cannot list projects."""
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_projects_authenticated(self):
        """Authenticated users can list projects."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # type: ignore[attr-defined]

    def test_list_projects_as_admin(self):
        """Admin can list projects."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_projects_as_viewer(self):
        """Viewer can list projects."""
        self.client.force_authenticate(user=self.viewer) # type: ignore[attr-defined]
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_project_authenticated(self):
        """Authenticated users can retrieve a project."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.get(f'/api/projects/{self.project1.id}/') # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.project1.id) # type: ignore[attr-defined]
        self.assertEqual(response.data['name'], 'Project 1') # type: ignore[attr-defined]

    def test_create_project_as_employee_fails(self):
        """Employees cannot create projects."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/projects/',
            {
                'customer': 'New Corp',
                'name': 'New Project',
                'project_number': 'PRJ-003',
                'active': True,
                'production_status': ProductionStatus.ON_DECK,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_as_viewer_fails(self):
        """Viewers cannot create projects."""
        self.client.force_authenticate(user=self.viewer) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/projects/',
            {
                'customer': 'New Corp',
                'name': 'New Project',
                'project_number': 'PRJ-003',
                'active': True,
                'production_status': ProductionStatus.ON_DECK,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_project_as_admin(self):
        """Admin can create projects."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/projects/',
            {
                'customer': 'New Corp',
                'name': 'New Project',
                'project_number': 'PRJ-003',
                'active': True,
                'production_status': ProductionStatus.ON_DECK,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['project_number'], 'PRJ-003') # type: ignore[attr-defined]
        self.assertTrue(Project.objects.filter(project_number='PRJ-003').exists())

    def test_create_project_without_project_number(self):
        """Creating a project without a project number should succeed."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/projects/',
            {
                'customer': 'New Corp',
                'name': 'New Project',
                'active': True,
                'production_status': ProductionStatus.ON_DECK,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['project_number'], '') # type: ignore[attr-defined]
        self.assertTrue(Project.objects.filter(name='New Project').exists())

    def test_update_project_as_employee_fails(self):
        """Employees cannot update projects."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/projects/{self.project1.id}/', # type: ignore[attr-defined]
            {'name': 'Updated Name'},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_project_as_admin(self):
        """Admin can update projects."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/projects/{self.project1.id}/', # type: ignore[attr-defined]
            {
                'name': 'Updated Project 1',
                'production_status': ProductionStatus.READY_FOR_FINISHING,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project1.refresh_from_db()
        self.assertEqual(self.project1.name, 'Updated Project 1')
        self.assertEqual(self.project1.production_status, ProductionStatus.READY_FOR_FINISHING)

    def test_delete_project_endpoint_not_allowed(self):
        """DELETE endpoint is not allowed; use deactivate instead."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.delete(f'/api/projects/{self.project1.id}/') # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        # Project should still exist
        self.assertTrue(Project.objects.filter(id=self.project1.id).exists()) # type: ignore[attr-defined]

    def test_project_response_format(self):
        """Project responses use snake_case field names (Django convention)."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.get(f'/api/projects/{self.project1.id}/') # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that response contains snake_case fields
        self.assertIn('project_number', response.data) # type: ignore[attr-defined]
        self.assertIn('production_status', response.data) # type: ignore[attr-defined]
        # Frontend's ApiTimesheetService handles conversion to camelCase
        self.assertEqual(response.data['project_number'], 'PRJ-001') # type: ignore[attr-defined]
