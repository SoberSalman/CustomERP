"""
Vercel serverless function entry point
"""
import os
import django
from django.core.wsgi import get_wsgi_application
from django.core.management import execute_from_command_line

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'custom_erp.settings_production')

# Initialize Django
django.setup()

# Ensure database is set up
def ensure_db():
    """Run migrations if needed"""
    try:
        from django.core.management import call_command
        call_command('migrate', '--run-syncdb', verbosity=0, interactive=False)
    except Exception as e:
        print(f"Migration error: {e}")

# Get the WSGI application
application = get_wsgi_application()

# Initialize database on first import
ensure_db()

# This is the handler that Vercel will call
def handler(event, context):
    return application(event, context)