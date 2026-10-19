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
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'material_type': types_by_name['Plywood'], 'name': '3/4" Maple Plywood', 'description': '12 sheets for ICU cabinet boxes'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'material_type': types_by_name['Edge Banding'], 'name': 'Maple Edge Banding 15/16"', 'description': '2 rolls'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-101'], 'material_type': types_by_name['Hinges'], 'name': 'Concealed Soft-Close Hinges', 'description': '48 hinges for upper and lower doors'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'material_type': types_by_name['White Oak'], 'name': '8/4 Rift White Oak', 'description': 'Library shelf nosing, 60 bd ft'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-103'], 'material_type': types_by_name['Stain'], 'name': 'Natural Oak Stain', 'description': '2 gallons'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'material_type': types_by_name['Melamine'], 'name': '3/4" White Melamine', 'description': 'Workstation carcasses, 20 sheets'},
            {'employee': alice, 'project': projects_by_number['MCC-2024-112'], 'material_type': types_by_name['Drawer Slides'], 'name': '22" Full-Extension Slides', 'description': '36 pairs'},

            # Bob
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'material_type': types_by_name['MDF'], 'name': '3/4" MDF', 'description': 'Reception desk substrate, 8 sheets'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-102'], 'material_type': types_by_name['High-Pressure Laminate'], 'name': 'Matte Charcoal HPL', 'description': 'Desk transaction top, 4 sheets'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-105'], 'material_type': types_by_name['Walnut'], 'name': 'Walnut Veneer Panels', 'description': 'Executive suite wall panels'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-105'], 'material_type': types_by_name['Lacquer'], 'name': 'Satin Pre-Cat Lacquer', 'description': '5 gallons'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-106'], 'material_type': types_by_name['Walnut'], 'name': '8/4 Black Walnut', 'description': 'Boardroom table top, 120 bd ft'},
            {'employee': bob, 'project': projects_by_number['MCC-2024-106'], 'material_type': types_by_name['Fasteners'], 'name': 'Table Top Fasteners', 'description': '1 box of 100'},
        ]

        for entry_data in material_entries:
            if not MaterialEntry.objects.filter(
                employee=entry_data['employee'],
                project=entry_data['project'],
                name=entry_data['name'],
            ).exists():
                MaterialEntry.objects.create(**entry_data)
                emp = entry_data['employee']
                self.stdout.write(f"  Created material entry: {emp.username} {entry_data['project'].project_number} {entry_data['name']}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded materials data'))
