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


class EmployeeCreationPasswordTests(APITestCase):
    """Test employee creation with temporary password flow."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            password='password123',
            display_name='Admin User',
            role=UserRole.ADMIN,
            is_active=True,
        )

    def test_create_employee_generates_temporary_password(self):
        """When admin creates employee, temporary password is returned."""
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
        self.assertIn('temporary_password', response.data)  # type: ignore[attr-defined]
        self.assertIsNotNone(response.data['temporary_password'])  # type: ignore[attr-defined]
        self.assertGreater(len(response.data['temporary_password']), 10)  # type: ignore[attr-defined]

    def test_created_employee_must_change_password_flag_set(self):
        """Newly created employee has must_change_password=True."""
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
        self.assertTrue(response.data['must_change_password'])  # type: ignore[attr-defined]

        # Verify in database
        new_user = User.objects.get(username='newemployee')
        self.assertTrue(new_user.must_change_password)

    def test_employee_can_login_with_temporary_password(self):
        """Employee can login with temporary password from creation."""
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
        temp_password = response.data['temporary_password']  # type: ignore[attr-defined]

        # Logout and try to login with temporary password
        self.client.logout()
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'newemployee', 'password': temp_password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['must_change_password'])  # type: ignore[attr-defined]

    def test_temporary_password_not_returned_on_list(self):
        """Temporary password is only returned on creation, not on list/retrieve."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        # Create employee
        _ = self.client.post(
            '/api/employees/',
            {
                'username': 'newemployee',
                'display_name': 'New Employee',
                'role': UserRole.EMPLOYEE,
                'active': True,
            },
        )

        # List employees
        list_response = self.client.get('/api/employees/')
        new_employee = next((e for e in list_response.data if e['username'] == 'newemployee'), None)  # type: ignore[attr-defined]
        self.assertIsNotNone(new_employee)
        # temporary_password should be None in list response (not the creation response)
        self.assertIsNone(new_employee.get('temporary_password'))  # type: ignore[attr-defined]

        # Retrieve single employee
        user = User.objects.get(username='newemployee')
        retrieve_response = self.client.get(f'/api/employees/{user.id}/') # type: ignore[attr-defined]
        self.assertIsNone(retrieve_response.data.get('temporary_password'))  # type: ignore[attr-defined]


class ChangePasswordTests(APITestCase):
    """Test password change flow."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            password='password123',
            display_name='Admin User',
            role=UserRole.ADMIN,
            is_active=True,
        )
        # Create employee with must_change_password=True
        self.employee = User.objects.create_user(
            username='employee',
            password='temp_password_123',
            display_name='Employee User',
            role=UserRole.EMPLOYEE,
            is_active=True,
        )
        self.employee.must_change_password = True
        self.employee.save()

    def test_change_password_without_old_password_when_must_change(self):
        """User with must_change_password=True can change without old password."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/auth/change-password/',
            {'new_password': 'new_secure_password_123'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Password changed successfully.')  # type: ignore[attr-defined]

        # Verify must_change_password is now False
        self.employee.refresh_from_db()
        self.assertFalse(self.employee.must_change_password)

        # Verify new password works
        user = User.objects.get(username='employee')
        self.assertTrue(user.check_password('new_secure_password_123'))

    def test_change_password_with_old_password_when_not_must_change(self):
        """User without must_change_password flag needs old password."""
        self.employee.must_change_password = False
        self.employee.save()

        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'temp_password_123',
                'new_password': 'new_secure_password_123',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_session_preserved_after_password_change(self):
        """Session remains valid after password change (tests update_session_auth_hash)."""
        test_user = User.objects.create_user(
            username='session_test',
            password='temp_password_123',
            display_name='Session Test',
            role=UserRole.EMPLOYEE,
            must_change_password=True,
        )

        client = APIClient()

        # Establish a real Django session
        response = client.post(
            '/api/auth/login/',
            {
                'username': 'session_test',
                'password': 'temp_password_123',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK) # pyright: ignore[reportAttributeAccessIssue]

        # Change the password using that session
        response = client.post(
            '/api/auth/change-password/',
            {'new_password': 'NewSecurePassword123!'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK) # pyright: ignore[reportAttributeAccessIssue]

        # Same session should still be authenticated
        response = client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK) # pyright: ignore[reportAttributeAccessIssue]
        self.assertEqual(response.data['username'], 'session_test')  # type: ignore[attr-defined]

        # Normal API access should now be allowed too
        response = client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK) # pyright: ignore[reportAttributeAccessIssue]

        test_user.refresh_from_db()
        self.assertFalse(test_user.must_change_password)


    def test_change_password_fails_with_same_password(self):
        """User cannot change password to their current password."""
        self.employee.must_change_password = False
        self.employee.set_password('temp_password_123')
        self.employee.save()

        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'temp_password_123',
                'new_password': 'temp_password_123',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('different', str(response.data).lower())  # type: ignore[attr-defined]

    def test_change_password_fails_with_wrong_old_password(self):
        """Change password fails with wrong old password when not must_change."""
        self.employee.must_change_password = False
        self.employee.save()

        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'wrong_password',
                'new_password': 'new_secure_password_123',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('incorrect', str(response.data).lower())  # type: ignore[attr-defined]

    def test_change_password_requires_authentication(self):
        """Change password endpoint requires authentication."""
        response = self.client.post(
            '/api/auth/change-password/',
            {'new_password': 'new_secure_password_123'},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_change_password_validates_minimum_length(self):
        """New password must meet minimum length requirements."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            '/api/auth/change-password/',
            {'new_password': 'short'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('8', str(response.data))  # type: ignore[attr-defined]


class ResetPasswordTests(APITestCase):
    """Test admin password reset flow."""

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
        self.employee.must_change_password = False
        self.employee.save()

    def test_admin_can_reset_employee_password(self):
        """Admin can reset an employee's password and get temporary password."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.post(
            f'/api/employees/{self.employee.id}/reset-password/', # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('temporary_password', response.data) # type: ignore[attr-defined]
        self.assertIsNotNone(response.data['temporary_password']) # type: ignore[attr-defined]

    def test_reset_password_sets_must_change_password_flag(self):
        """After password reset, employee must_change_password is set to True."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.post(
            f'/api/employees/{self.employee.id}/reset-password/', # type: ignore[attr-defined]
        )
        temp_password = response.data['temporary_password']  # type: ignore[attr-defined]

        # Verify flag is set
        self.employee.refresh_from_db()
        self.assertTrue(self.employee.must_change_password)

        # Verify password was changed
        self.assertTrue(self.employee.check_password(temp_password))

    def test_non_admin_cannot_reset_password(self):
        """Non-admin users cannot reset passwords."""
        self.client.force_authenticate(user=self.employee) # type: ignore[attr-defined]
        response = self.client.post(
            f'/api/employees/{self.employee.id}/reset-password/', # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reset_password_requires_authentication(self):
        """Reset password endpoint requires authentication."""
        response = self.client.post(
            f'/api/employees/{self.employee.id}/reset-password/', # type: ignore[attr-defined]
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_employee_can_login_with_reset_password(self):
        """Employee can login with the reset temporary password."""
        self.client.force_authenticate(user=self.admin) # type: ignore[attr-defined]
        response = self.client.post(
            f'/api/employees/{self.employee.id}/reset-password/', # type: ignore[attr-defined]
        )
        temp_password = response.data['temporary_password']  # type: ignore[attr-defined]

        # Logout and login with reset password
        self.client.logout()
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'employee', 'password': temp_password},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['must_change_password'])  # type: ignore[attr-defined]


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


class MustChangePasswordEnforcementTests(APITestCase):
    """Test that must_change_password enforcement blocks API access."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='employee1', password='temp-password', display_name='Employee One', role=UserRole.EMPLOYEE, must_change_password=True
        )
        self.admin = User.objects.create_user(
            username='admin1', password='admin-password', display_name='Admin One', role=UserRole.ADMIN
        )
        self.client = APIClient()

    def test_user_with_must_change_password_cannot_list_employees(self):
        """Users with must_change_password=True cannot list employees."""
        self.client.force_authenticate(user=self.user) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_with_must_change_password_cannot_retrieve_employee(self):
        """Users with must_change_password=True cannot retrieve an employee."""
        self.client.force_authenticate(user=self.user) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.get(f'/api/employees/{self.admin.id}/') # pyright: ignore[reportAttributeAccessIssue]
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_with_must_change_password_can_access_auth_me(self):
        """Users with must_change_password=True can access /auth/me/."""
        self.client.force_authenticate(user=self.user) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'employee1')  # type: ignore[attr-defined]

    def test_user_with_must_change_password_can_access_change_password(self):
        """Users with must_change_password=True can access /auth/change-password/."""
        self.client.force_authenticate(user=self.user) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.post(
            '/api/auth/change-password/',
            {'new_password': 'NewSecurePassword123!'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.must_change_password)

    def test_user_with_must_change_password_can_access_logout(self):
        """Users with must_change_password=True can access /auth/logout/."""
        self.client.force_authenticate(user=self.user) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_user_without_must_change_password_can_list_employees(self):
        """Users without must_change_password can list employees normally."""
        self.user.must_change_password = False
        self.user.save()
        self.client.force_authenticate(user=self.user) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.get('/api/employees/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_with_must_change_password_cannot_create_employee(self):
        """Even admins with must_change_password=True cannot perform admin operations."""
        self.admin.must_change_password = True
        self.admin.save()
        self.client.force_authenticate(user=self.admin) # pyright: ignore[reportAttributeAccessIssue]
        response = self.client.post(
            '/api/employees/',
            {'username': 'newuser', 'display_name': 'New User', 'role': UserRole.EMPLOYEE}
        )
        # Admin operations are also blocked by must_change_password
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


