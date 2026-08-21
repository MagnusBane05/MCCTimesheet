from rest_framework.test import APIClient, APITestCase

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
        self.assertEqual(response.data['username'], 'employee1')
        self.assertEqual(response.data['role'], UserRole.EMPLOYEE)
        self.assertNotIn('password', response.data)

    def test_login_fails_with_wrong_password(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'employee1', 'password': 'wrong'},
            HTTP_X_CSRFTOKEN=self._get_csrf_token(),
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['detail'], 'Incorrect username or password.')

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
        self.assertEqual(response.data['username'], 'employee1')

    def test_logout_clears_session(self):
        csrf_token = self._get_csrf_token()
        self.client.post(
            '/api/auth/login/', {'username': 'employee1', 'password': 'correct-password'}, HTTP_X_CSRFTOKEN=csrf_token
        )
        logout_response = self.client.post('/api/auth/logout/', HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value)
        self.assertEqual(logout_response.status_code, 204)

        me_response = self.client.get('/api/auth/me/')
        self.assertEqual(me_response.status_code, 403)
