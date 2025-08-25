from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Tenant, TenantUser, TenantInvitation


class TenantSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True)
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'domain', 'legal_name', 'tax_number', 'registration_number',
            'address', 'city', 'country', 'phone', 'email', 'website',
            'logo', 'primary_color', 'secondary_color', 'timezone', 'currency', 'date_format',
            'is_active', 'created_at', 'updated_at', 'owner_email'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'owner_email']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'date_joined']


class TenantUserSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TenantUser
        fields = ['id', 'user', 'tenant_name', 'role', 'is_active', 'joined_at']


class TenantInvitationSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)
    
    class Meta:
        model = TenantInvitation
        fields = [
            'id', 'tenant_name', 'email', 'role', 'invited_by_email',
            'created_at', 'expires_at', 'is_accepted', 'accepted_at'
        ]
        read_only_fields = ['id', 'created_at', 'invited_by_email', 'is_accepted', 'accepted_at']


class CreateTenantSerializer(serializers.ModelSerializer):
    """Serializer for creating new tenants"""
    class Meta:
        model = Tenant
        fields = [
            'name', 'legal_name', 'tax_number', 'address', 'city', 'country',
            'phone', 'email', 'website', 'primary_color', 'secondary_color',
            'timezone', 'currency'
        ]