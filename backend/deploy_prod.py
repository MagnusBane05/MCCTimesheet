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

from django.conf import settings
from django.core.management import call_command


if settings.DEBUG:
    raise RuntimeError(
        "Refusing production deployment because DEBUG=True."
    )

print("Running Django checks...")
call_command("check")

print("\nRunning Django deployment security checks...")
call_command("check", deploy=True)

print("\nApplying migrations...")
call_command(
    "migrate",
    interactive=False,
)

print("\nCollecting static files...")
call_command(
    "collectstatic",
    interactive=False,
)

print("\nProduction deployment tasks completed successfully.")