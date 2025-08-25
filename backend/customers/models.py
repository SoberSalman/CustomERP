from django.db import models
from django.contrib.auth.models import User
from tenants.models import Tenant
import uuid
from decimal import Decimal


class Customer(models.Model):
    """Customer/Client management"""
    CUSTOMER_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('business', 'Business'),
        ('government', 'Government'),
    ]
    
    STATUS_CHOICES = [
        ('lead', 'Lead'),
        ('prospect', 'Prospect'),
        ('active', 'Active Customer'),
        ('inactive', 'Inactive'),
        ('blocked', 'Blocked'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='customers')
    
    # Basic Information
    name = models.CharField(max_length=200)
    customer_code = models.CharField(max_length=50, blank=True)
    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='individual')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='lead')
    
    # Contact Information
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address Information
    billing_address = models.TextField(blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_state = models.CharField(max_length=100, blank=True)
    billing_country = models.CharField(max_length=100, default='Pakistan')
    billing_postal_code = models.CharField(max_length=20, blank=True)
    
    shipping_address = models.TextField(blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_country = models.CharField(max_length=100, blank=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True)
    use_billing_as_shipping = models.BooleanField(default=True)
    
    # Business Information
    tax_number = models.CharField(max_length=50, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)
    payment_terms = models.CharField(max_length=100, default='Net 30')  # e.g., "Net 30", "COD", "Advance"
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Financial Summary (calculated fields)
    total_orders = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    last_order_date = models.DateField(null=True, blank=True)
    
    # Notes and Tags
    notes = models.TextField(blank=True)
    tags = models.CharField(max_length=500, blank=True)  # Comma-separated tags
    
    # Status and Metadata
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_customers')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ('tenant', 'customer_code')
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate customer code if not provided
        if not self.customer_code:
            # Simple code generation: CUST + tenant prefix + sequential number
            tenant_prefix = self.tenant.name[:3].upper()
            existing_count = Customer.objects.filter(tenant=self.tenant).count()
            self.customer_code = f"CUST-{tenant_prefix}-{existing_count + 1:04d}"
        
        # Copy billing address to shipping if use_billing_as_shipping is True
        if self.use_billing_as_shipping:
            self.shipping_address = self.billing_address
            self.shipping_city = self.billing_city
            self.shipping_state = self.billing_state
            self.shipping_country = self.billing_country
            self.shipping_postal_code = self.billing_postal_code
        
        super().save(*args, **kwargs)
    
    @property
    def full_address(self):
        """Get formatted billing address"""
        parts = [
            self.billing_address,
            self.billing_city,
            self.billing_state,
            self.billing_country,
            self.billing_postal_code
        ]
        return ', '.join(filter(None, parts))
    
    @property
    def is_vip(self):
        """Determine if customer is VIP based on total spent"""
        vip_threshold = Decimal('100000.00')  # 100K threshold
        return self.total_spent >= vip_threshold


class CustomerContact(models.Model):
    """Additional contacts for business customers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_primary', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.customer.name})"


class CustomerCategory(models.Model):
    """Customer categories for segmentation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='customer_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#2e7d32')  # Hex color for UI
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_customer_categories')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ('tenant', 'name')
        verbose_name_plural = 'Customer Categories'
    
    def __str__(self):
        return self.name


class CustomerInteraction(models.Model):
    """Track interactions/communications with customers"""
    INTERACTION_TYPE_CHOICES = [
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('visit', 'Site Visit'),
        ('demo', 'Product Demo'),
        ('support', 'Support'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='interactions')
    
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPE_CHOICES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    interaction_date = models.DateTimeField()
    duration_minutes = models.IntegerField(null=True, blank=True)
    
    # Follow-up
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateField(null=True, blank=True)
    follow_up_notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_interactions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-interaction_date']
    
    def __str__(self):
        return f"{self.customer.name} - {self.subject}"
