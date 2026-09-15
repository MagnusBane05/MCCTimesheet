from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from .models import User, UserRole


class AuthEndpointsTests(APITestCase):
    def setUp(self):
        # Default test client disables CSRF enforcement entirely; these tests
        # specifically exercise that behavior, so turn it back on.
        self.client = APIClient(enforce_csrf_checks=True)
        self.user = User.objects.create_user(
            username='employee1', password='correct-password', display_name='Employee One', role=UserRole.EMPLOYEE
        )

    def _get_csrf_token(self):
        self.client.get('/api/auth/csrf/')
        return self.client.cookies['csrftoken'].value

    def test_login_succeeds_with_correct_credentials(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'employee1', 'password': 'correct-password'},
            HTTP_X_CSRFTOKEN=self._get_csrf_token(),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'employee1') # type: ignore[attr-defined]
        self.assertEqual(response.data['role'], UserRole.EMPLOYEE) # type: ignore[attr-defined]
        self.assertNotIn('password', response.data) # type: ignore[attr-defined]

    def test_login_fails_with_wrong_password(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'employee1', 'password': 'wrong'},
            HTTP_X_CSRFTOKEN=self._get_csrf_token(),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Incorrect username or password.') # type: ignore[attr-defined]

    def test_login_fails_for_inactive_user(self):
        self.user.is_active = False
        self.user.save()
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'employee1', 'password': 'correct-password'},
            HTTP_X_CSRFTOKEN=self._get_csrf_token(),
        )
        self.assertEqual(response.status_code, 400)

    def test_login_fails_without_csrf_token(self):
        response = self.client.post('/api/auth/login/', {'username': 'employee1', 'password': 'correct-password'})
        self.assertEqual(response.status_code, 403)

    def test_me_requires_authentication(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 403)

    def test_me_returns_current_user_after_login(self):
        self.client.post(
            '/api/auth/login/',
            {'username': 'employee1', 'password': 'correct-password'},
            HTTP_X_CSRFTOKEN=self._get_csrf_token(),
        )
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'employee1') # type: ignore[attr-defined]

    def test_logout_clears_session(self):
        csrf_token = self._get_csrf_token()
        self.client.post(
            '/api/auth/login/', {'username': 'employee1', 'password': 'correct-password'}, HTTP_X_CSRFTOKEN=csrf_token
        )
        logout_response = self.client.post('/api/auth/logout/', HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value)
        self.assertEqual(logout_response.status_code, 204)

        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, 403)

class EmployeeManagementTests(APITestCase):
    """Test employee management API endpoints."""

    def setUp(self):
        self.client = APIClient()
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

    def test_list_employees_authenticated_user(self):
        """Authenticated users can list employees."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3) # type: ignore[attr-defined]

    def test_list_employees_includes_inactive(self):
        """List includes both active and inactive employees."""
        self.employee.is_active = False
        self.employee.save()
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3) # type: ignore[attr-defined]
        inactive_employee: User = next((e for e in response.data if e['username'] == 'employee'), None) # type: ignore[attr-defined]
        self.assertIsNotNone(inactive_employee)
        self.assertFalse(inactive_employee['active']) # type: ignore[attr-defined]

    def test_list_employees_unauthenticated(self):
        """Unauthenticated users cannot list employees."""
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_employee(self):
        """Can retrieve a single employee."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.get(f'/api/employees/{self.admin.id}/') # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'admin') # type: ignore[attr-defined]
        self.assertEqual(response.data['role'], UserRole.ADMIN) # type: ignore[attr-defined]

    def test_create_employee_admin_only(self):
        """Only admins can create employees."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/employees/',
            {
                'username': 'newemployee',
                'display_name': 'New Employee',
                'role': UserRole.EMPLOYEE,
                'active': True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_employee_admin(self):
        """Admins can create employees."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/employees/',
            {
                'username': 'newemployee',
                'display_name': 'New Employee',
                'role': UserRole.EMPLOYEE,
                'active': True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newemployee') # type: ignore[attr-defined]
        self.assertEqual(response.data['display_name'], 'New Employee') # type: ignore[attr-defined]
        self.assertEqual(response.data['role'], UserRole.EMPLOYEE) # type: ignore[attr-defined]
        self.assertTrue(response.data['active']) # type: ignore[attr-defined]
        # Verify password was set
        new_user = User.objects.get(username='newemployee')
        self.assertTrue(new_user.check_password('ChangeMe123!'))

    def test_update_employee_admin_only(self):
        """Only admins can update employees."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/employees/{self.viewer.id}/', # type: ignore[attr-defined]
            {'display_name': 'Updated Name'},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_employee_admin(self):
        """Admins can update employee details."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/employees/{self.employee.id}/', # type: ignore[attr-defined]
            {'display_name': 'Updated Employee', 'role': UserRole.VIEWER},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_name'], 'Updated Employee') # type: ignore[attr-defined]
        self.assertEqual(response.data['role'], UserRole.VIEWER) # type: ignore[attr-defined]

    def test_delete_employee_not_allowed(self):
        """Employees cannot be deleted (only deactivated)."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.delete(f'/api/employees/{self.employee.id}/') # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertIn('patch', response.data['detail'].lower()) # type: ignore[attr-defined]

    def test_assign_role_admin_only(self):
        """Only admins can assign roles."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/employees/{self.viewer.id}/', # type: ignore[attr-defined]
            {'role': UserRole.ADMIN},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_assign_role(self):
        """Admins can assign roles to employees."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/employees/{self.employee.id}/', # type: ignore[attr-defined]
            {'role': UserRole.ADMIN},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], UserRole.ADMIN) # type: ignore[attr-defined]
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.role, UserRole.ADMIN)

    def test_cannot_deactivate_self_via_patch(self):
        """Admins cannot deactivate their own account via PATCH."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/employees/{self.admin.id}/', # type: ignore[attr-defined]
            {'active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check for error message in response
        error_text = str(response.data).lower() # type: ignore[attr-defined]
        self.assertTrue('deactivate' in error_text or 'account' in error_text or 'error' in error_text)
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_can_deactivate_others(self):
        """Admins can deactivate other employees."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/employees/{self.employee.id}/', # type: ignore[attr-defined]
            {'active': False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['active']) # type: ignore[attr-defined]
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.is_active)
