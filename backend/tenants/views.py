from rest_framework import generics, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta
from .models import Tenant, TenantUser, TenantInvitation
from .serializers import TenantSerializer, TenantUserSerializer, TenantInvitationSerializer, CreateTenantSerializer
from .middleware import RequireTenantMixin, TenantQuerySetMixin


class TenantListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateTenantSerializer
        return TenantSerializer
    
    def get_queryset(self):
        # User can only see their own organization (if they created one)
        # or the organization they belong to (if they were invited)
        user_tenant = None
        
        # Check if user owns a tenant
        if hasattr(self.request.user, 'owned_tenant'):
            user_tenant = self.request.user.owned_tenant
        # Check if user is a member of a tenant
        elif hasattr(self.request.user, 'tenant_membership'):
            user_tenant = self.request.user.tenant_membership.tenant
        
        if user_tenant:
            return Tenant.objects.filter(id=user_tenant.id)
        else:
            return Tenant.objects.none()
    
    def perform_create(self, serializer):
        # Check if user already has a tenant (owns one or is member of one)
        if (hasattr(self.request.user, 'owned_tenant') or 
            hasattr(self.request.user, 'tenant_membership')):
            raise serializers.ValidationError("You can only create one organization or belong to one organization")
        
        # Create tenant with current user as admin
        tenant = serializer.save(admin=self.request.user)
        
        # Generate slug if not provided
        if not tenant.slug:
            tenant.slug = slugify(tenant.name)
            tenant.save()
        
        # Create TenantUser relationship for admin
        TenantUser.objects.create(
            user=self.request.user,
            tenant=tenant,
            role='admin'
        )


class TenantDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Tenant.objects.filter(id=self.request.tenant.id)


class TenantUserListView(RequireTenantMixin, TenantQuerySetMixin, generics.ListAPIView):
    serializer_class = TenantUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TenantUser.objects.filter(
            tenant=self.request.tenant,
            is_active=True
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_tenant(request):
    """Get current tenant information"""
    user_tenant = None
    user_role = None
    
    # Check if user owns a tenant
    if hasattr(request.user, 'owned_tenant'):
        user_tenant = request.user.owned_tenant
        user_role = 'admin'
    # Check if user is a member of a tenant
    elif hasattr(request.user, 'tenant_membership'):
        user_tenant = request.user.tenant_membership.tenant
        user_role = request.user.tenant_membership.role
    
    if user_tenant:
        serializer = TenantSerializer(user_tenant)
        tenant_data = serializer.data
        tenant_data['user_role'] = user_role
        return Response(tenant_data)
    else:
        return Response({'error': 'No organization found. Create one or accept an invitation.'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_tenants(request):
    """Get user's organization (only one possible)"""
    user_tenant = None
    user_role = None
    
    # Check if user owns a tenant
    if hasattr(request.user, 'owned_tenant'):
        user_tenant = request.user.owned_tenant
        user_role = 'admin'
    # Check if user is a member of a tenant
    elif hasattr(request.user, 'tenant_membership'):
        user_tenant = request.user.tenant_membership.tenant
        user_role = request.user.tenant_membership.role
    
    if user_tenant:
        tenant_data = TenantSerializer(user_tenant).data
        tenant_data['user_role'] = user_role
        return Response([tenant_data])  # Return as array for frontend compatibility
    else:
        return Response([])


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def invite_user(request):
    """Invite a user to join the organization (admin only)"""
    # Check if current user is admin of their tenant
    if not (hasattr(request.user, 'owned_tenant') or 
            (hasattr(request.user, 'tenant_membership') and 
             request.user.tenant_membership.role == 'admin')):
        return Response({'error': 'Only administrators can invite users'}, status=403)
    
    user_tenant = (request.user.owned_tenant if hasattr(request.user, 'owned_tenant')
                   else request.user.tenant_membership.tenant)
    
    email = request.data.get('email')
    role = request.data.get('role', 'employee')
    
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    # Check if user is already in the organization
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        if (hasattr(user, 'owned_tenant') or hasattr(user, 'tenant_membership')):
            return Response({'error': 'User already belongs to an organization'}, status=400)
    
    # Create invitation
    expires_at = timezone.now() + timedelta(days=7)
    invitation = TenantInvitation.objects.create(
        tenant=user_tenant,
        email=email,
        role=role,
        invited_by=request.user,
        expires_at=expires_at
    )
    
    # TODO: Send invitation email
    
    return Response({
        'message': 'Invitation sent successfully',
        'invitation': TenantInvitationSerializer(invitation).data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_invitation(request):
    """Accept an invitation to join an organization"""
    token = request.data.get('token')
    
    if not token:
        return Response({'error': 'Invitation token is required'}, status=400)
    
    # Check if user already belongs to an organization
    if (hasattr(request.user, 'owned_tenant') or 
        hasattr(request.user, 'tenant_membership')):
        return Response({'error': 'You already belong to an organization'}, status=400)
    
    try:
        invitation = TenantInvitation.objects.get(
            token=token,
            email=request.user.email,
            is_accepted=False,
            expires_at__gt=timezone.now()
        )
        
        # Create TenantUser relationship
        TenantUser.objects.create(
            user=request.user,
            tenant=invitation.tenant,
            role=invitation.role
        )
        
        # Mark invitation as accepted
        invitation.is_accepted = True
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        return Response({
            'message': 'Invitation accepted successfully',
            'tenant': TenantSerializer(invitation.tenant).data
        })
        
    except TenantInvitation.DoesNotExist:
        return Response({'error': 'Invalid or expired invitation'}, status=404)