"""
Vercel serverless function for Django
"""
import os
import sys
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'custom_erp.settings_production')

# Initialize Django
import django
django.setup()

# Run migrations on cold start
def setup_database():
    try:
        from django.core.management import call_command
        call_command('migrate', '--run-syncdb', verbosity=0, interactive=False)
    except Exception as e:
        print(f"Migration error: {e}")

# Setup database
setup_database()

# Get WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# Vercel handler
def handler(request):
    return application(request)