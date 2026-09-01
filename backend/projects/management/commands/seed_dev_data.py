"""
Seed the development database with representative test data.

Usage:
    python manage.py seed_dev_data

This command creates:
- Test users (employee, viewer, admin)
- Representative projects with various states
- Time entries (added in phase D when timesheets app is integrated)
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from accounts.models import UserRole
from projects.models import Project, ProductionStatus

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the development database with representative test data'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding development data...'))

        # Clear existing data (optional; comment out to preserve)
        # User.objects.filter(is_superuser=False).delete()
        # Project.objects.all().delete()

        # Create test users if they don't exist
        users_data = [
            {'username': 'admin', 'display_name': 'Admin User', 'role': UserRole.ADMIN},
            {'username': 'viewer', 'display_name': 'Viewer User', 'role': UserRole.VIEWER},
            {'username': 'alice', 'display_name': 'Alice Employee', 'role': UserRole.EMPLOYEE},
            {'username': 'bob', 'display_name': 'Bob Employee', 'role': UserRole.EMPLOYEE},
        ]

        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                User.objects.create_user(
                    username=user_data['username'],
                    password='password123',  # Use the same password for all test accounts
                    display_name=user_data['display_name'],
                    role=user_data['role'],
                    is_active=True,
                )
                self.stdout.write(f"  Created user: {user_data['username']}")
            else:
                self.stdout.write(f"  User already exists: {user_data['username']}")

        # Create representative projects
        projects_data = [
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

        for project_data in projects_data:
            if not Project.objects.filter(project_number=project_data['project_number']).exists():
                Project.objects.create(**project_data)
                self.stdout.write(f"  Created project: {project_data['project_number']} - {project_data['name']}")
            else:
                self.stdout.write(f"  Project already exists: {project_data['project_number']}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded development data'))
