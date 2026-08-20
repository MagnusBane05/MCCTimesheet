import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

os.chdir(BASE_DIR)
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)

import django

django.setup()

from django.core.management import call_command

print("Running Django checks...")
call_command("check")
print("\nApplying migrations...")
call_command(
    "migrate",
    interactive=False,
)
print("\nDeployment tasks completed successfully.")