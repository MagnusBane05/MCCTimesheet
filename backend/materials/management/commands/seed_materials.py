"""
Seed the development database with material types, categories and entries.

Usage:
    python manage.py seed_dev_data   # users and projects must exist first
    python manage.py seed_materials

This command creates:
- Material type categories and the material types within them
- Material entries for the seeded employees across several projects

Safe to run more than once; existing rows are left alone.
"""
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from materials.models import MaterialEntry, MaterialType, MaterialTypeCategory
from projects.models import Project

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the development database with material types, categories and entries'

    def handle(self, *args: Any, **options: Any) -> None:
        if not settings.DEBUG:
            raise CommandError('seed_materials cannot be run in production (DEBUG=False)')

        self.stdout.write(self.style.SUCCESS('Seeding materials data...'))

        # Categories and the material types within each
        types_by_category: dict[str, list[str]] = {
            'Sheet Goods': ['Plywood', 'MDF', 'Melamine', 'Particleboard'],
            'Solid Wood': ['Maple', 'Walnut', 'White Oak', 'Cherry'],
            'Laminates': ['High-Pressure Laminate', 'Edge Banding'],
            'Hardware': ['Hinges', 'Drawer Slides', 'Pulls & Knobs', 'Fasteners'],
            'Finishes': ['Lacquer', 'Stain', 'Primer'],
        }

        types_by_name: dict[str, MaterialType] = {}
        for category_name, type_names in types_by_category.items():
            category, created = MaterialTypeCategory.objects.get_or_create(name=category_name)
            if created:
                self.stdout.write(f'  Created category: {category_name}')

            for type_name in type_names:
                material_type, created = MaterialType.objects.get_or_create(category=category, name=type_name)
                types_by_name[type_name] = material_type
                if created:
                    self.stdout.write(f'  Created material type: {category_name} / {type_name}')

        # Entries depend on the users and projects from seed_dev_data
        users_by_username: dict[str, Any] = {u.username: u for u in User.objects.filter(username__in=['alice', 'bob'])}
        projects_by_number: dict[str, Project] = {p.project_number: p for p in Project.objects.all()}
        required_projects = ['MCC-2024-101', 'MCC-2024-102', 'MCC-2024-103', 'MCC-2024-105', 'MCC-2024-106', 'MCC-2024-112']

        if len(users_by_username) < 2 or any(n not in projects_by_number for n in required_projects):
            raise CommandError('Users and projects are missing. Run `python manage.py seed_dev_data` first.')

        alice = users_by_username['alice']
        bob = users_by_username['bob']

        material_entries: list[dict[str, Any]] = [
            # Alice
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'material_type': types_by_name['Plywood'], 'description': '3/4" Maple Plywood - sheets for ICU cabinet boxes', 'quantity': 12},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'material_type': types_by_name['Edge Banding'], 'description': 'Maple Edge Banding 15/16" - rolls', 'quantity': 2},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'material_type': types_by_name['Hinges'], 'description': 'Concealed Soft-Close Hinges - hinges for upper and lower doors', 'quantity': 48},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'material_type': types_by_name['White Oak'], 'description': '8/4 Rift White Oak - library shelf nosing, bd ft', 'quantity': 60},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'material_type': types_by_name['Stain'], 'description': 'Natural Oak Stain - gallons', 'quantity': 2},
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'material_type': types_by_name['Melamine'], 'description': '3/4" White Melamine - workstation carcasses, sheets', 'quantity': 20},
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'material_type': types_by_name['Drawer Slides'], 'description': '22" Full-Extension Slides - pairs', 'quantity': 36},

            # Bob
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'material_type': types_by_name['MDF'], 'description': '3/4" MDF - reception desk substrate, sheets', 'quantity': 8},
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'material_type': types_by_name['High-Pressure Laminate'], 'description': 'Matte Charcoal HPL - desk transaction top, sheets', 'quantity': 4},
            {'employee': bob, 'project': projects_by_number['MCC-2024-105'], 'material_type': types_by_name['Walnut'], 'description': 'Walnut Veneer Panels - executive suite wall panels', 'quantity': 1},
            {'employee': bob, 'project': projects_by_number['MCC-2024-105'], 'material_type': types_by_name['Lacquer'], 'description': 'Satin Pre-Cat Lacquer - gallons', 'quantity': 5},
            {'employee': bob, 'project': projects_by_number['MCC-2024-106'], 'material_type': types_by_name['Walnut'], 'description': '8/4 Black Walnut - boardroom table top, bd ft', 'quantity': 120},
            {'employee': bob, 'project': projects_by_number['MCC-2024-106'], 'material_type': types_by_name['Fasteners'], 'description': 'Table Top Fasteners - box of 100', 'quantity': 1},
        ]

        for entry_data in material_entries:
            if not MaterialEntry.objects.filter(
                employee=entry_data['employee'],
                project=entry_data['project'],
                material_type=entry_data['material_type'],
                description=entry_data['description'],
            ).exists():
                MaterialEntry.objects.create(**entry_data)
                emp = entry_data['employee']
                self.stdout.write(f"  Created material entry: {emp.username} {entry_data['project'].project_number} {entry_data['material_type'].name}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded materials data'))
