"""
Tests for the TimeEntry API.

Covers:
- Time validation (15-min increments, order, no overnight)
- Overlap detection
- Employee editing window enforcement
- Permission enforcement
- CRUD operations
- Invoice number access control
"""
from datetime import time
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient  # type: ignore[attr-defined]

from accounts.models import UserRole
from projects.models import Project, ProductionStatus
from timesheets.models import TimeEntry

User = get_user_model()


class TimeEntryAPITestCase(TestCase):
    """Test the TimeEntry REST API."""

    def setUp(self) -> None:
        """Create test users, projects, and time entries."""
        self.client = APIClient()

        # Create users
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

        # Create project
        self.project = Project.objects.create(
            customer='Test Corp',
            name='Test Project',
            project_number='TEST-001',
            active=True,
            production_status=ProductionStatus.IN_PROGRESS,
        )

        # Create time entries
        today = timezone.now().date()
        self.entry1 = TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=today,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Morning work',
        )

    def test_list_entries_unauthenticated(self) -> None:
        """Unauthenticated users cannot list entries."""
        response = self.client.get('/api/time-entries/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_entries_employee_sees_only_own(self) -> None:
        """Employees can only see their own entries."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get('/api/time-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_list_entries_employee_cannot_see_others(self) -> None:
        """Employees cannot see other employees' entries."""
        # Create entry for Bob
        today = timezone.now().date()
        TimeEntry.objects.create(
            employee=self.employee_bob,
            project=self.project,
            work_date=today,
            start_time=time(14, 0),
            end_time=time(17, 0),
            work_description='Bob work',
        )

        # Alice tries to list
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get('/api/time-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_list_entries_viewer_sees_all(self) -> None:
        """Viewers can list all entries for reporting."""
        # Create entry for Bob so we have multiple entries
        today = timezone.now().date()
        TimeEntry.objects.create(
            employee=self.employee_bob,
            project=self.project,
            work_date=today,
            start_time=time(14, 0),
            end_time=time(17, 0),
            work_description='Bob work',
        )

        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.get('/api/time-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # type: ignore[attr-defined]

    def test_list_entries_admin_sees_all(self) -> None:
        """Admins can see all entries."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.get('/api/time-entries/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)  # type: ignore[attr-defined]

    def test_create_entry_employee_own_entry(self) -> None:
        """Employees can create entries for themselves."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Afternoon work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['employee'], self.employee_alice.id)  # type: ignore[attr-defined]

    def test_create_entry_employee_cannot_create_for_others(self) -> None:
        """Employees cannot create entries for other employees."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_bob.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Bob work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_viewer_cannot_create(self) -> None:
        """Viewers cannot create entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_entry_admin_can_create_for_anyone(self) -> None:
        """Admins can create entries for any employee."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_bob.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Admin created for Bob',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['employee'], self.employee_bob.id)  # type: ignore[attr-defined]

    def test_validate_quarter_hour_increments(self) -> None:
        """Times must be on 15-minute boundaries."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '08:37',  # Not on 15-min boundary
                'end_time': '12:00',
                'work_description': 'Work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('15-minute', str(response.data).lower())  # type: ignore[attr-defined]

    def test_validate_end_after_start(self) -> None:
        """End time must be after start time."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '12:00',
                'end_time': '08:00',  # Before start
                'work_description': 'Work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_no_overlap(self) -> None:
        """Entries cannot overlap on the same day."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        today = timezone.now().date()
        # Create overlapping entry
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '10:00',  # Overlaps with 8:00-12:00
                'end_time': '14:00',
                'work_description': 'Overlapping work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overlap', str(response.data).lower())  # type: ignore[attr-defined]

    def test_adjacent_entries_allowed(self) -> None:
        """Adjacent entries (touching times) are allowed."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '12:00',  # Starts exactly when entry1 ends
                'end_time': '16:00',
                'work_description': 'Adjacent work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_entry_employee_own_entry(self) -> None:
        """Employees can update their own entries within editing window."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/time-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {
                'work_description': 'Updated morning work',
                'start_time': '8:15',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['work_description'], 'Updated morning work')  # type: ignore[attr-defined]

    def test_update_entry_employee_cannot_update_others(self) -> None:
        """Employees cannot update other employees' entries."""
        self.client.force_authenticate(user=self.employee_bob)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/time-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'work_description': 'Hacked work'},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_entry_employee_own(self) -> None:
        """Employees can delete their own entries."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/time-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_entry_employee_cannot_delete_others(self) -> None:
        """Employees cannot delete other employees' entries."""
        self.client.force_authenticate(user=self.employee_bob)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/time-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_delete_any_entry(self) -> None:
        """Admins can delete any entry."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/time-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_invoice_number_admin_only(self) -> None:
        """Only admins can set invoice numbers."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Work',
                'invoice_number': 'INV-123',  # Try to set as employee
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('admin', str(response.data).lower())  # type: ignore[attr-defined]

    def test_admin_can_set_invoice_number(self) -> None:
        """Admins can set invoice numbers."""
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Work',
                'invoice_number': 'INV-123',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['invoice_number'], 'INV-123')  # type: ignore[attr-defined]

    def test_response_format_snake_case(self) -> None:
        """Response uses snake_case field names."""
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/time-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('work_date', response.data)  # type: ignore[attr-defined]
        self.assertIn('start_time', response.data)  # type: ignore[attr-defined]
        self.assertIn('end_time', response.data)  # type: ignore[attr-defined]
        self.assertIn('work_description', response.data)  # type: ignore[attr-defined]
        self.assertIn('invoice_number', response.data)  # type: ignore[attr-defined]
        self.assertIn('created_at', response.data)  # type: ignore[attr-defined]
        self.assertIn('updated_at', response.data)  # type: ignore[attr-defined]

    def test_filter_by_date_from(self) -> None:
        """Time entries can be filtered by from date."""
        from datetime import timedelta

        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)

        # Create entries on different dates
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=yesterday,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Yesterday work',
        )
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=tomorrow,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Tomorrow work',
        )

        # Filter from today onwards
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/time-entries/?from={today.isoformat()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should get today and tomorrow entries
        self.assertEqual(len(response.data), 2)  # type: ignore[attr-defined]
        self.assertNotIn(yesterday.isoformat(), [e['work_date'] for e in response.data])  # type: ignore[attr-defined]

    def test_filter_by_date_to(self) -> None:
        """Time entries can be filtered by to date."""
        from datetime import timedelta

        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)

        # Create entries on different dates
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=yesterday,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Yesterday work',
        )
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=tomorrow,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Tomorrow work',
        )

        # Filter up to today
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/time-entries/?to={today.isoformat()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should get yesterday and today entries
        self.assertEqual(len(response.data), 2)  # type: ignore[attr-defined]
        self.assertNotIn(tomorrow.isoformat(), [e['work_date'] for e in response.data])  # type: ignore[attr-defined]

    def test_filter_by_date_range(self) -> None:
        """Time entries can be filtered by date range."""
        from datetime import timedelta

        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)

        # Create entries on different dates
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=two_days_ago,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Two days ago',
        )
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=yesterday,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Yesterday work',
        )
        TimeEntry.objects.create(
            employee=self.employee_alice,
            project=self.project,
            work_date=tomorrow,
            start_time=time(8, 0),
            end_time=time(12, 0),
            work_description='Tomorrow work',
        )

        # Filter from yesterday to tomorrow (should exclude two_days_ago)
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/time-entries/?from={yesterday.isoformat()}&to={tomorrow.isoformat()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should get yesterday, today, and tomorrow entries (3)
        self.assertEqual(len(response.data), 3)  # type: ignore[attr-defined]
        dates = [e['work_date'] for e in response.data]  # type: ignore[attr-defined]
        self.assertNotIn(two_days_ago.isoformat(), dates)

    def test_filter_by_employee_id(self) -> None:
        """Time entries can be filtered by employee ID."""
        today = timezone.now().date()

        # Create entry for Bob
        TimeEntry.objects.create(
            employee=self.employee_bob,
            project=self.project,
            work_date=today,
            start_time=time(14, 0),
            end_time=time(17, 0),
            work_description='Bob work',
        )

        # Admin filters by employee ID
        self.client.force_authenticate(user=self.admin)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/time-entries/?employeeId={self.employee_alice.id}')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should get only Alice's entry
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_filter_by_employee_id_employee_can_only_see_own(self) -> None:
        """Employees cannot use employee ID filter to see others' entries."""
        today = timezone.now().date()

        # Create entry for Bob
        TimeEntry.objects.create(
            employee=self.employee_bob,
            project=self.project,
            work_date=today,
            start_time=time(14, 0),
            end_time=time(17, 0),
            work_description='Bob work',
        )

        # Alice tries to filter by Bob's ID (should be ignored by queryset filter)
        self.client.force_authenticate(user=self.employee_alice)  # type: ignore[attr-defined]
        response = self.client.get(f'/api/time-entries/?employeeId={self.employee_bob.id}')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should still get only Alice's entry (her queryset filters to her only)
        self.assertEqual(len(response.data), 1)  # type: ignore[attr-defined]
        self.assertEqual(response.data[0]['employee'], self.employee_alice.id)  # type: ignore[attr-defined,index]

    def test_viewer_cannot_create_time_entries(self) -> None:
        """Viewers cannot create time entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        today = timezone.now().date()
        response = self.client.post(
            '/api/time-entries/',
            {
                'employee': self.employee_alice.id,  # type: ignore[attr-defined]
                'project': self.project.id,  # type: ignore[attr-defined]
                'work_date': today.isoformat(),
                'start_time': '13:00',
                'end_time': '17:00',
                'work_description': 'Work',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('viewer', str(response.data).lower())  # type: ignore[attr-defined]

    def test_viewer_cannot_update_time_entries(self) -> None:
        """Viewers cannot update time entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.patch(
            f'/api/time-entries/{self.entry1.id}/',  # type: ignore[attr-defined]
            {'work_description': 'Hacked description'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('viewer', str(response.data).lower())  # type: ignore[attr-defined]

    def test_viewer_cannot_delete_time_entries(self) -> None:
        """Viewers cannot delete time entries."""
        self.client.force_authenticate(user=self.viewer)  # type: ignore[attr-defined]
        response = self.client.delete(f'/api/time-entries/{self.entry1.id}/')  # type: ignore[attr-defined]
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('viewer', str(response.data).lower())  # type: ignore[attr-defined]
