"""
URL configuration for custom_erp project.
Multi-tenant ERP API endpoints.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'version': '1.0.0',
        'environment': 'development'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('authentication.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/sales/', include('sales.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
