"""
Seed the development database with representative test data.

Usage:
    python manage.py seed_dev_data

This command creates:
- Test users (employee, viewer, admin)
- Representative projects with various states
- Time entries with various scenarios (current week, overtime, etc.)
"""
from datetime import timedelta, time, date
from typing import Any

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import UserRole
from projects.models import Project, ProductionStatus
from timesheets.models import TimeEntry

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the development database with representative test data'

    def handle(self, *args: Any, **options: Any) -> None:
        self.stdout.write(self.style.SUCCESS('Seeding development data...'))

        # Create test users if they don't exist
        users_data: list[dict[str, Any]] = [
            {'username': 'admin', 'display_name': 'Admin User', 'role': UserRole.ADMIN},
            {'username': 'viewer', 'display_name': 'Viewer User', 'role': UserRole.VIEWER},
            {'username': 'alice', 'display_name': 'Alice Employee', 'role': UserRole.EMPLOYEE},
            {'username': 'bob', 'display_name': 'Bob Employee', 'role': UserRole.EMPLOYEE},
        ]

        users_by_username: dict[str, Any] = {}
        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    password='password123',
                    display_name=user_data['display_name'],
                    role=user_data['role'],
                    is_active=True,
                )
                users_by_username[user_data['username']] = user
                self.stdout.write(f"  Created user: {user_data['username']}")
            else:
                users_by_username[user_data['username']] = User.objects.get(username=user_data['username'])
                self.stdout.write(f"  User already exists: {user_data['username']}")

        # Create all projects from seed
        all_projects_data: list[dict[str, Any]] = [
            {'customer': 'Harborview Medical Center', 'name': 'ICU Wing Millwork', 'project_number': 'MCC-2024-101', 'active': True, 'production_status': ProductionStatus.IN_PROGRESS},
            {'customer': 'Harborview Medical Center', 'name': 'Lobby Reception Desk', 'project_number': 'MCC-2024-102', 'active': True, 'production_status': ProductionStatus.READY_FOR_INSTALL},
            {'customer': 'Cascade Public Schools', 'name': 'Library Casework', 'project_number': 'MCC-2024-103', 'active': True, 'production_status': ProductionStatus.ON_DECK},
            {'customer': 'Cascade Public Schools', 'name': 'Science Wing Cabinets', 'project_number': 'MCC-2024-104', 'active': True, 'production_status': ProductionStatus.COMPLETE},
            {'customer': 'Redwood Financial Group', 'name': 'Executive Suite Paneling', 'project_number': 'MCC-2024-105', 'active': True, 'production_status': ProductionStatus.READY_FOR_FINISHING},
            {'customer': 'Redwood Financial Group', 'name': 'Boardroom Table', 'project_number': 'MCC-2024-106', 'active': True, 'production_status': ProductionStatus.IN_PROGRESS},
            {'customer': 'Summit Hotel Group', 'name': 'Guest Room Vanities', 'project_number': 'MCC-2024-107', 'active': True, 'production_status': ProductionStatus.IN_PROGRESS},
            {'customer': 'Summit Hotel Group', 'name': 'Rooftop Bar Millwork', 'project_number': 'MCC-2024-108', 'active': False, 'production_status': ProductionStatus.COMPLETE},
            {'customer': 'Bluewater Credit Union', 'name': 'Teller Line Casework', 'project_number': 'MCC-2024-109', 'active': True, 'production_status': ProductionStatus.READY_FOR_INSTALL},
            {'customer': 'Pinecrest Senior Living', 'name': 'Dining Hall Built-ins', 'project_number': 'MCC-2024-110', 'active': True, 'production_status': ProductionStatus.ON_DECK},
            {'customer': 'Pinecrest Senior Living', 'name': 'Activity Room Cabinets', 'project_number': 'MCC-2024-111', 'active': False, 'production_status': ProductionStatus.ON_DECK},
            {'customer': 'Meridian Tech Campus', 'name': 'Open Office Workstations', 'project_number': 'MCC-2024-112', 'active': True, 'production_status': ProductionStatus.IN_PROGRESS},
            {'customer': 'Meridian Tech Campus', 'name': 'Cafeteria Servery Counters', 'project_number': 'MCC-2024-113', 'active': True, 'production_status': ProductionStatus.READY_FOR_FINISHING},
            {'customer': 'Cedar Ridge Winery', 'name': 'Tasting Room Bar', 'project_number': 'MCC-2024-114', 'active': True, 'production_status': ProductionStatus.COMPLETE},
        ]

        for project_data in all_projects_data:
            if not Project.objects.filter(project_number=project_data['project_number']).exists():
                Project.objects.create(**project_data)
                self.stdout.write(f"  Created project: {project_data['project_number']} - {project_data['name']}")

        # Repopulate project dict with all projects
        all_projects = Project.objects.all()
        projects_by_number: dict[str, Project] = {p.project_number: p for p in all_projects}

        # Time entries for Alice and Bob (employees) - current and previous week
        alice = users_by_username['alice']
        bob = users_by_username['bob']
        today: date = timezone.now().date()
        current_weekday = today.weekday()
        days_since_monday = current_weekday

        monday_this_week = today - timedelta(days=days_since_monday)
        monday_last_week = monday_this_week - timedelta(days=7)

        time_entries: list[dict[str, Any]] = [
            # Alice - This week (Mon-Today)
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'work_date': monday_this_week, 'start_time': time(8, 0), 'end_time': time(12, 0), 'work_description': 'Installed base millwork'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'work_date': monday_this_week, 'start_time': time(13, 0), 'end_time': time(17, 0), 'work_description': 'Finishing work'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'work_date': monday_this_week + timedelta(days=1), 'start_time': time(8, 30), 'end_time': time(12, 30), 'work_description': 'Casework layout'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'work_date': monday_this_week + timedelta(days=1), 'start_time': time(13, 30), 'end_time': time(17, 30), 'work_description': 'Workstation assembly'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'work_date': monday_this_week + timedelta(days=2), 'start_time': time(8, 0), 'end_time': time(12, 45), 'work_description': 'Trim installation'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'work_date': monday_this_week + timedelta(days=2), 'start_time': time(13, 45), 'end_time': time(18, 0), 'work_description': 'Final touches'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'work_date': monday_this_week + timedelta(days=3), 'start_time': time(8, 0), 'end_time': time(12, 15), 'work_description': 'Door hanging'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'work_date': monday_this_week + timedelta(days=3), 'start_time': time(13, 15), 'end_time': time(17, 0), 'work_description': 'Hardware installation'},

            # Alice - Previous week (for read-only testing)
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'work_date': monday_last_week, 'start_time': time(8, 0), 'end_time': time(12, 0), 'work_description': 'Prep work'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'work_date': monday_last_week, 'start_time': time(13, 0), 'end_time': time(17, 0), 'work_description': 'Assembly'},

            # Bob - This week
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'work_date': monday_this_week, 'start_time': time(8, 0), 'end_time': time(12, 0), 'work_description': 'Desk assembly'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'work_date': monday_this_week, 'start_time': time(13, 0), 'end_time': time(16, 30), 'work_description': 'Finishing and polishing'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-105'], 'work_date': monday_this_week + timedelta(days=1), 'start_time': time(8, 0), 'end_time': time(12, 30), 'work_description': 'Paneling preparation'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-105'], 'work_date': monday_this_week + timedelta(days=1), 'start_time': time(13, 30), 'end_time': time(17, 0), 'work_description': 'Panel installation'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-106'], 'work_date': monday_this_week + timedelta(days=2), 'start_time': time(8, 30), 'end_time': time(12, 30), 'work_description': 'Table construction'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-106'], 'work_date': monday_this_week + timedelta(days=2), 'start_time': time(13, 30), 'end_time': time(17, 30), 'work_description': 'Hardware and finishing'},

            # Bob - Previous week
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'work_date': monday_last_week, 'start_time': time(8, 0), 'end_time': time(12, 0), 'work_description': 'Initial measurements'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'work_date': monday_last_week, 'start_time': time(13, 0), 'end_time': time(17, 0), 'work_description': 'Material prep'},
        ]

        for entry_data in time_entries:
            # Check if entry already exists
            if not TimeEntry.objects.filter(
                employee=entry_data['employee'],
                work_date=entry_data['work_date'],
                start_time=entry_data['start_time'],
                end_time=entry_data['end_time']
            ).exists():
                TimeEntry.objects.create(**entry_data)
                emp = entry_data['employee']
                self.stdout.write(f"  Created time entry: {emp.username} {entry_data['work_date']} {entry_data['start_time']}-{entry_data['end_time']}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded development data'))
