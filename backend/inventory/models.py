from django.db import models
from django.contrib.auth.models import User
from tenants.models import Tenant
import uuid
from decimal import Decimal


class Category(models.Model):
    """Product categories for organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#1976d2')  # Hex color for UI
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ('tenant', 'name')
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Products/Services offered by the organization"""
    PRODUCT_TYPE_CHOICES = [
        ('product', 'Physical Product'),
        ('service', 'Service'),
        ('digital', 'Digital Product'),
    ]
    
    STOCK_STATUS_CHOICES = [
        ('in_stock', 'In Stock'),
        ('low_stock', 'Low Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('discontinued', 'Discontinued'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='products')
    
    # Basic Information
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=100, blank=True)  # Stock Keeping Unit
    barcode = models.CharField(max_length=100, blank=True)
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, default='product')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    # Pricing
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Inventory Management
    track_inventory = models.BooleanField(default=True)
    current_stock = models.IntegerField(default=0)
    minimum_stock = models.IntegerField(default=0)
    maximum_stock = models.IntegerField(null=True, blank=True)
    stock_status = models.CharField(max_length=20, choices=STOCK_STATUS_CHOICES, default='in_stock')
    
    # Physical Properties
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # in kg
    dimensions = models.CharField(max_length=100, blank=True)  # e.g., "10x5x3 cm"
    
    # Media
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    
    # Status and Metadata
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ('tenant', 'sku')
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate SKU if not provided
        if not self.sku:
            # Simple SKU generation: first 3 letters of name + UUID suffix
            base_sku = ''.join(self.name.split())[:3].upper()
            self.sku = f"{base_sku}-{str(self.id)[:8].upper()}"
        
        # Calculate margin percentage
        if self.cost_price > 0 and self.selling_price > 0:
            self.margin_percentage = ((self.selling_price - self.cost_price) / self.cost_price) * 100
        
        # Update stock status based on current stock
        if self.track_inventory:
            if self.current_stock <= 0:
                self.stock_status = 'out_of_stock'
            elif self.current_stock <= self.minimum_stock:
                self.stock_status = 'low_stock'
            else:
                self.stock_status = 'in_stock'
        
        super().save(*args, **kwargs)
    
    @property
    def profit_margin(self):
        """Calculate profit margin in currency"""
        if self.selling_price and self.cost_price:
            return self.selling_price - self.cost_price
        return Decimal('0.00')
    
    @property
    def is_low_stock(self):
        """Check if product is low on stock"""
        return self.track_inventory and self.current_stock <= self.minimum_stock
    
    @property
    def is_out_of_stock(self):
        """Check if product is out of stock"""
        return self.track_inventory and self.current_stock <= 0


class StockMovement(models.Model):
    """Track all stock movements for products"""
    MOVEMENT_TYPE_CHOICES = [
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('adjustment', 'Stock Adjustment'),
        ('return', 'Return'),
        ('damaged', 'Damaged/Lost'),
        ('transfer', 'Transfer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='stock_movements')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField()  # Positive for stock in, negative for stock out
    previous_stock = models.IntegerField()
    new_stock = models.IntegerField()
    
    # Reference to related records (optional)
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stock_movements')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name} - {self.movement_type} - {self.quantity}"


class Supplier(models.Model):
    """Suppliers for products"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='suppliers')
    
    # Basic Information
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Business Information
    tax_number = models.CharField(max_length=50, blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)  # e.g., "Net 30"
    
    # Status
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_suppliers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ProductSupplier(models.Model):
    """Many-to-many relationship between products and suppliers with additional info"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_suppliers')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='supplier_products')
    
    # Supplier-specific product information
    supplier_sku = models.CharField(max_length=100, blank=True)
    supplier_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_order_quantity = models.IntegerField(default=1)
    lead_time_days = models.IntegerField(null=True, blank=True)
    
    is_primary = models.BooleanField(default=False)  # Primary supplier for this product
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('product', 'supplier')
    
    def __str__(self):
        return f"{self.product.name} - {self.supplier.name}"