from django.urls import path
from .views import (
    TenantListCreateView,
    TenantDetailView,
    TenantUserListView,
    current_tenant,
    user_tenants,
    invite_user,
    accept_invitation,
)

urlpatterns = [
    path('', TenantListCreateView.as_view(), name='tenant-list-create'),
    path('<uuid:pk>/', TenantDetailView.as_view(), name='tenant-detail'),
    path('current/', current_tenant, name='current-tenant'),
    path('user-tenants/', user_tenants, name='user-tenants'),
    path('users/', TenantUserListView.as_view(), name='tenant-users'),
    path('invite/', invite_user, name='invite-user'),
    path('accept-invitation/', accept_invitation, name='accept-invitation'),
]