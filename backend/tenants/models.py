from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
import uuid


class Tenant(models.Model):
    """
    Tenant model representing an organization/company.
    Each user can create only ONE organization and becomes its admin.
    Multiple users can be invited to join one organization.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    domain = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    # Company Information
    legal_name = models.CharField(max_length=200, blank=True)
    tax_number = models.CharField(max_length=50, null=True, blank=True)
    registration_number = models.CharField(max_length=50, null=True, blank=True)
    
    # Contact Information
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField()
    website = models.URLField(null=True, blank=True)
    
    # Branding
    logo = models.ImageField(upload_to='tenant_logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#1976d2')  # Hex color
    secondary_color = models.CharField(max_length=7, default='#dc004e')
    
    # Configuration
    timezone = models.CharField(max_length=50, default='UTC')
    currency = models.CharField(max_length=3, default='PKR')
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY')
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Admin user (creator of the organization) - ONE TO ONE relationship
    admin = models.OneToOneField(User, on_delete=models.CASCADE, related_name='owned_tenant')
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            # Ensure slug uniqueness
            original_slug = self.slug
            counter = 1
            while Tenant.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
        super().save(*args, **kwargs)


class TenantUser(models.Model):
    """
    Relationship between User and Tenant with role.
    Multiple users can belong to one organization.
    Each user can belong to only ONE organization.
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
        ('viewer', 'Viewer'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tenant_membership')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.tenant.name} ({self.role})"


class TenantInvitation(models.Model):
    """Invitations to join a tenant"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=TenantUser.ROLE_CHOICES, default='employee')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('tenant', 'email')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invite {self.email} to {self.tenant.name}"