"""
Tests for the materials API.

Covers:
- Role-based visibility and permissions for material entries
- Admin-only management of material types and categories
- Name validation
- Query param filtering
- Types/categories cannot be deleted, only expired
- Entries cannot use expired types
"""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient  # type: ignore[attr-defined]

from accounts.models import UserRole
from projects.models import Project, ProductionStatus
from materials.models import MaterialEntry, MaterialType, MaterialTypeCategory

User = get_user_model()


class MaterialsAPITestCase(TestCase):
    """Shared fixtures for the materials API tests."""

    def setUp(self) -> None:
        """Create test users, projects, material types and an entry."""
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username='admin',
            password='password123',
            display_name='Admin User',
            role=UserRole.ADMIN,
            is_active=True,
        )
        self.employee_alice = User.objects.create_user(
            username='alice',
            password='password123',
            display_name='Alice Employee',
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        self.employee_bob = User.objects.create_user(
            username='bob',
            password='password123',
            display_name='Bob Employee',
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

        self.project = Project.objects.create(
            customer='Test Corp',
            name='Test Project',
            project_number='TEST-001',
            active=True,
            production_status=ProductionStatus.IN_PROGRESS,
        )
        self.other_project = Project.objects.create(
            customer='Other Corp',
            name='Other Project',
            project_number='TEST-002',
            active=True,
            production_status=ProductionStatus.IN_PROGRESS,
        )

        self.category = MaterialTypeCategory.objects.create(name='Sheet Goods')
        self.material_type = MaterialType.objects.create(category=self.category, name='Plywood')

        self.entry1 = MaterialEntry.objects.create(
            project=self.project,
            employee=self.employee_alice,
            material_type=self.material_type,
            description='Cabinet boxes',
            quantity=1,
        )

    def entry_payload(self, employee_id: int, **overrides: object) -> dict[str, object]:
        """Build a valid POST body for a material entry."""
        payload: dict[str, object] = {
            'project': self.project.id,  # type: ignore[attr-defined]
            'employee': employee_id,
            'material_type': self.material_type.id,  # type: ignore[attr-defined]
            'description': 'Drawer bottoms',
            'quantity': 4,
        }
        payload.update(overrides)
        return payload


class MaterialEntryAPITestCase(MaterialsAPITestCase):
    """Test the MaterialEntry REST API."""

    def test_list_entries_unauthenticated(self) -> None:
        """Unauthenticated users cannot list entries."""
        response = self.client.get('/api/material-entries/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_entries_employee_sees_only_own(self) -> None:
        """Employees can only see their own entries."""
        MaterialEntry.objects.create(
            project=self.project,
            employee=self.employee_bob,
            material_type=self.material_type,
            description='Bob work',
            quantity=1,
        )

        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get('/api/material-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_list_entries_viewer_sees_all(self) -> None:
        """Viewers can list all entries."""
        MaterialEntry.objects.create(
            project=self.project,
            employee=self.employee_bob,
            material_type=self.material_type,
            description='Bob work',
            quantity=1,
        )

        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.get('/api/material-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # type: ignore[attr-defined]

    def test_list_entries_admin_sees_all(self) -> None:
        """Admins can list all entries."""
        MaterialEntry.objects.create(
            project=self.project,
            employee=self.employee_bob,
            material_type=self.material_type,
            description='Bob work',
            quantity=1,
        )

        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.get('/api/material-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # type: ignore[attr-defined]

    def test_create_entry_employee_own_entry(self) -> None:
        """Employees can create entries for themselves."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['employee'], self.employee_alice.id)  # type: ignore[attr-defined]

    def test_create_entry_employee_cannot_create_for_others(self) -> None:
        """Employees cannot create entries for other employees."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_bob.id),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_viewer_cannot_create(self) -> None:
        """Viewers cannot create entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('viewer', str(response.data).lower())  # type: ignore[attr-defined]

    def test_create_entry_admin_can_create_for_anyone(self) -> None:
        """Admins can create entries for any employee."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_bob.id),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['employee'], self.employee_bob.id)  # type: ignore[attr-defined]

    def test_create_entry_whitespace_description_rejected(self) -> None:
        """Entry descriptions cannot be only whitespace."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id, description='   '),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_invalid_material_type_rejected(self) -> None:
        """Entries must reference an existing material type."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id, material_type=99999),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_saves_quantity(self) -> None:
        """Quantity is stored and returned as an integer."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id, quantity=12),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 12)  # type: ignore[attr-defined]

    def test_create_entry_missing_quantity_rejected(self) -> None:
        """Quantity is required."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        payload = self.entry_payload(self.employee_alice.id)  # type: ignore[attr-defined]
        del payload['quantity']
        response = self.client.post('/api/material-entries/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_invalid_quantity_rejected(self) -> None:
        """Quantity must be a whole number greater than zero."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        for quantity in (0, -1, '1.5'):
            with self.subTest(quantity=quantity):
                response = self.client.post(
                    '/api/material-entries/',
                    self.entry_payload(self.employee_alice.id, quantity=quantity),  # type: ignore[attr-defined]
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_entry_employee_own_entry(self) -> None:
        """Employees can update their own entries."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'description': 'Updated description'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Updated description')  # type: ignore[attr-defined]

    def test_update_entry_employee_cannot_update_others(self) -> None:
        """Employees cannot update other employees' entries."""
        self.client.force_authenticate(user=self.employee_bob)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'description': 'Hacked description'},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_entry_viewer_cannot_update(self) -> None:
        """Viewers cannot update entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'description': 'Hacked description'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('viewer', str(response.data).lower())  # type: ignore[attr-defined]

    def test_delete_entry_employee_own(self) -> None:
        """Employees can delete their own entries."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/material-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MaterialEntry.objects.filter(id=self.entry1.id).exists())  # type: ignore[attr-defined]

    def test_delete_entry_employee_cannot_delete_others(self) -> None:
        """Employees cannot delete other employees' entries."""
        self.client.force_authenticate(user=self.employee_bob)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/material-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_entry_viewer_cannot_delete(self) -> None:
        """Viewers cannot delete entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/material-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(MaterialEntry.objects.filter(id=self.entry1.id).exists())  # type: ignore[attr-defined]

    def test_admin_can_delete_any_entry(self) -> None:
        """Admins can delete any entry."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/material-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_by_employee_id(self) -> None:
        """Admins can filter entries by employee ID."""
        MaterialEntry.objects.create(
            project=self.project,
            employee=self.employee_bob,
            material_type=self.material_type,
            description='Bob work',
            quantity=1,
        )

        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/material-entries/?employeeId={self.employee_alice.id}')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_filter_by_employee_id_employee_can_only_see_own(self) -> None:
        """Employees cannot use the employee ID filter to see others' entries."""
        MaterialEntry.objects.create(
            project=self.project,
            employee=self.employee_bob,
            material_type=self.material_type,
            description='Bob work',
            quantity=1,
        )

        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/material-entries/?employeeId={self.employee_bob.id}')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_filter_by_project_id(self) -> None:
        """Entries can be filtered by project ID."""
        MaterialEntry.objects.create(
            project=self.other_project,
            employee=self.employee_alice,
            material_type=self.material_type,
            description='Other work',
            quantity=1,
        )

        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/material-entries/?projectId={self.other_project.id}')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['project'], self.other_project.id)  # type: ignore[attr-defined,index]

    def test_response_format_snake_case(self) -> None:
        """Response uses snake_case field names."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/material-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('material_type', response.data)  # type: ignore[attr-defined]
        self.assertIn('created_at', response.data)  # type: ignore[attr-defined]
        self.assertIn('updated_at', response.data)  # type: ignore[attr-defined]


class MaterialTypeAPITestCase(MaterialsAPITestCase):
    """Test the MaterialType REST API."""

    def test_list_types_unauthenticated(self) -> None:
        """Unauthenticated users cannot list material types."""
        response = self.client.get('/api/material-types/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_types_employee(self) -> None:
        """Employees can list material types (needed for the entry form)."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get('/api/material-types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['category'], self.category.id)  # type: ignore[attr-defined,index]

    def test_create_type_admin(self) -> None:
        """Admins can create material types."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-types/',
            {'category': self.category.id, 'name': 'MDF'},  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'MDF')  # type: ignore[attr-defined]

    def test_create_type_employee_forbidden(self) -> None:
        """Employees cannot create material types."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-types/',
            {'category': self.category.id, 'name': 'MDF'},  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('admin', str(response.data).lower())  # type: ignore[attr-defined]

    def test_create_type_viewer_forbidden(self) -> None:
        """Viewers cannot create material types."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-types/',
            {'category': self.category.id, 'name': 'MDF'},  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_type_whitespace_name_rejected(self) -> None:
        """Material type names cannot be only whitespace."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.post(
            '/api/material-types/',
            {'category': self.category.id, 'name': '   '},  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_type_admin(self) -> None:
        """Admins can update material types."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-types/{self.material_type.id}/',  # type: ignore[attr-defined]
            {'name': 'Hardwood Plywood'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Hardwood Plywood')  # type: ignore[attr-defined]

    def test_update_type_employee_forbidden(self) -> None:
        """Employees cannot update material types."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-types/{self.material_type.id}/',  # type: ignore[attr-defined]
            {'name': 'Hacked'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_type_not_allowed(self) -> None:
        """Material types cannot be deleted, even unused ones."""
        unused = MaterialType.objects.create(category=self.category, name='Unused')
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/material-types/{unused.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(MaterialType.objects.filter(id=unused.id).exists())  # type: ignore[attr-defined]

    def test_expire_type_admin(self) -> None:
        """Admins can expire a material type that is in use."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-types/{self.material_type.id}/',  # type: ignore[attr-defined]
            {'active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['active'])  # type: ignore[attr-defined]

    def test_expire_type_employee_forbidden(self) -> None:
        """Employees cannot expire material types."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-types/{self.material_type.id}/',  # type: ignore[attr-defined]
            {'active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.material_type.refresh_from_db()
        self.assertTrue(self.material_type.active)

    def test_list_types_includes_expired(self) -> None:
        """Expired types are still listed so existing entries can display them."""
        self.material_type.active = False
        self.material_type.save()
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get('/api/material-types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertFalse(response.data[0]['active'])  # type: ignore[attr-defined,index]

class MaterialTypeCategoryAPITestCase(MaterialsAPITestCase):
    """Test the MaterialTypeCategory REST API."""

    def test_list_categories_employee(self) -> None:
        """Employees can list categories."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get('/api/material-type-categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['name'], 'Sheet Goods')  # type: ignore[attr-defined,index]

    def test_create_category_admin(self) -> None:
        """Admins can create categories."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.post('/api/material-type-categories/', {'name': 'Hardware'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Hardware')  # type: ignore[attr-defined]

    def test_create_category_employee_forbidden(self) -> None:
        """Employees cannot create categories."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.post('/api/material-type-categories/', {'name': 'Hardware'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_category_viewer_forbidden(self) -> None:
        """Viewers cannot create categories."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.post('/api/material-type-categories/', {'name': 'Hardware'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_category_whitespace_name_rejected(self) -> None:
        """Category names cannot be only whitespace."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.post('/api/material-type-categories/', {'name': '   '})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_category_admin(self) -> None:
        """Admins can update categories."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-type-categories/{self.category.id}/',  # type: ignore[attr-defined]
            {'name': 'Panels'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Panels')  # type: ignore[attr-defined]

    def test_update_category_employee_forbidden(self) -> None:
        """Employees cannot update categories."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-type-categories/{self.category.id}/',  # type: ignore[attr-defined]
            {'name': 'Hacked'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_category_not_allowed(self) -> None:
        """Categories cannot be deleted, even empty ones."""
        empty = MaterialTypeCategory.objects.create(name='Empty')
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/material-type-categories/{empty.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(MaterialTypeCategory.objects.filter(id=empty.id).exists())  # type: ignore[attr-defined]

    def test_expire_category_admin(self) -> None:
        """Expiring a category leaves its types' own active flags unchanged."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-type-categories/{self.category.id}/',  # type: ignore[attr-defined]
            {'active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['active'])  # type: ignore[attr-defined]
        self.material_type.refresh_from_db()
        self.assertTrue(self.material_type.active)

    def test_expire_category_employee_forbidden(self) -> None:
        """Employees cannot expire categories."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/material-type-categories/{self.category.id}/',  # type: ignore[attr-defined]
            {'active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.category.refresh_from_db()
        self.assertTrue(self.category.active)


class ExpiredMaterialTypeEntryTestCase(MaterialsAPITestCase):
    """Entries cannot newly reference an expired type, but existing ones keep theirs."""

    def setUp(self) -> None:
        super().setUp()
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]

    def test_create_entry_with_expired_type_rejected(self) -> None:
        self.material_type.active = False
        self.material_type.save()
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_with_type_in_expired_category_rejected(self) -> None:
        self.category.active = False
        self.category.save()
        response = self.client.post(
            '/api/material-entries/',
            self.entry_payload(self.employee_alice.id),  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_entry_keeping_expired_type_allowed(self) -> None:
        self.material_type.active = False
        self.material_type.save()
        response = self.client.patch(
            f'/api/material-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'material_type': self.material_type.id, 'quantity': 3},  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 3)  # type: ignore[attr-defined]

    def test_update_entry_switching_to_expired_type_rejected(self) -> None:
        expired = MaterialType.objects.create(category=self.category, name='Old', active=False)
        response = self.client.patch(
            f'/api/material-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'material_type': expired.id},  # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
