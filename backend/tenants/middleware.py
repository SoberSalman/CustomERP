from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from .models import Tenant, TenantUser
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to identify and set the current tenant based on the user's single organization.
    Each user can only belong to one organization (either as owner or member).
    """
    
    def process_request(self, request):
        # Skip tenant resolution for certain paths
        skip_paths = [
            '/admin/',
            '/auth/',
            '/api/auth/',
            '/api/health/',
            '/static/',
            '/media/',
            '/favicon.ico',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            request.tenant = None
            request.tenant_user = None
            return None
        
        tenant = None
        tenant_user = None
        
        # Try to authenticate user manually if not already authenticated (for API Token auth)
        if not hasattr(request, 'user') or isinstance(request.user, AnonymousUser) or not request.user.is_authenticated:
            auth_header = request.META.get('HTTP_AUTHORIZATION')
            if auth_header and auth_header.startswith('Token '):
                from rest_framework.authtoken.models import Token
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.select_related('user').get(key=token_key)
                    request.user = token.user
                except Token.DoesNotExist:
                    pass  # Invalid token, keep user as anonymous
        
        # Only resolve tenant if user is authenticated
        if request.user and not isinstance(request.user, AnonymousUser) and request.user.is_authenticated:
            try:
                # Check if user owns a tenant
                if hasattr(request.user, 'owned_tenant'):
                    tenant = request.user.owned_tenant
                    # Create a pseudo TenantUser object for consistency
                    class AdminTenantUser:
                        def __init__(self, user, tenant):
                            self.user = user
                            self.tenant = tenant
                            self.role = 'admin'
                            self.is_active = True
                    tenant_user = AdminTenantUser(request.user, tenant)
                
                # Check if user is a member of a tenant
                elif hasattr(request.user, 'tenant_membership'):
                    tenant_membership = request.user.tenant_membership
                    if tenant_membership.is_active and tenant_membership.tenant.is_active:
                        tenant = tenant_membership.tenant
                        tenant_user = tenant_membership
                
            except Exception as e:
                logger.error(f"Error getting user's tenant: {e}")
        
        # Set tenant in request
        request.tenant = tenant
        request.tenant_user = tenant_user
        
        return None


class RequireTenantMixin:
    """
    Mixin for views that require a tenant context
    """
    
    def dispatch(self, request, *args, **kwargs):
        if not hasattr(request, 'tenant') or request.tenant is None:
            if request.path.startswith('/api/'):
                from django.http import JsonResponse
                return JsonResponse({'error': 'No organization found. Create one or accept an invitation.'}, status=404)
            else:
                return HttpResponse('Organization required', status=400)
        return super().dispatch(request, *args, **kwargs)


class TenantQuerySetMixin:
    """
    Mixin to automatically filter querysets by tenant
    """
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if hasattr(self.request, 'tenant') and self.request.tenant:
            return queryset.filter(tenant=self.request.tenant)
        return queryset.none()  # Return empty queryset if no tenant