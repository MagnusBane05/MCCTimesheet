"""
Production (BlackSun/cPanel/Passenger) entrypoint. Passenger is configured
with this file as the startup file and `application` as the entry point;
everything else lives in config/wsgi.py so this stays a one-liner.
"""
from config.wsgi import application  # noqa: F401
