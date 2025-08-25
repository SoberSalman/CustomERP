from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from customers.models import Customer
from inventory.models import Product
from tenants.models import Tenant


class SalesOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('partially_delivered', 'Partially Delivered'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Tenant relationship
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sales_orders')
    
    # Order identification
    order_number = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Customer information
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales_orders')
    
    # Order details
    order_date = models.DateTimeField()
    expected_delivery_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Financial information
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Additional information
    notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_sales_orders')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_sales_orders')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['tenant', 'order_number']]
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['order_date']),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.customer.name}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number
            last_order = SalesOrder.objects.filter(tenant=self.tenant).order_by('-id').first()
            if last_order:
                last_num = int(last_order.order_number.split('-')[-1])
                self.order_number = f"SO-{last_num + 1:06d}"
            else:
                self.order_number = "SO-000001"
        super().save(*args, **kwargs)


class SalesOrderItem(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sales_order_items')
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.sales_order.order_number} - {self.product.name}"

    def save(self, *args, **kwargs):
        # Calculate line total
        discount_amount = (self.unit_price * self.quantity * self.discount_percent) / 100
        self.line_total = (self.unit_price * self.quantity) - discount_amount
        super().save(*args, **kwargs)


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_TERMS_CHOICES = [
        ('immediate', 'Immediate'),
        ('net_15', 'Net 15'),
        ('net_30', 'Net 30'),
        ('net_45', 'Net 45'),
        ('net_60', 'Net 60'),
    ]

    # Tenant relationship
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoices')
    
    # Invoice identification
    invoice_number = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Related order
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    
    # Invoice details
    invoice_date = models.DateTimeField()
    due_date = models.DateTimeField()
    payment_terms = models.CharField(max_length=20, choices=PAYMENT_TERMS_CHOICES, default='net_30')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Financial information
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Additional information
    notes = models.TextField(blank=True, null=True)
    terms_conditions = models.TextField(blank=True, null=True)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_invoices')
    sent_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['tenant', 'invoice_number']]
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['invoice_date']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"

    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount

    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.due_date < timezone.now() and self.balance_due > 0

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate invoice number
            last_invoice = Invoice.objects.filter(tenant=self.tenant).order_by('-id').first()
            if last_invoice:
                last_num = int(last_invoice.invoice_number.split('-')[-1])
                self.invoice_number = f"INV-{last_num + 1:06d}"
            else:
                self.invoice_number = "INV-000001"
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoice_items')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.product.name}"

    def save(self, *args, **kwargs):
        # Calculate line total
        discount_amount = (self.unit_price * self.quantity * self.discount_percent) / 100
        self.line_total = (self.unit_price * self.quantity) - discount_amount
        super().save(*args, **kwargs)


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit_card', 'Credit Card'),
        ('check', 'Check'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    # Tenant relationship
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    
    # Payment identification
    payment_number = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Related records
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    payment_date = models.DateTimeField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Additional information
    notes = models.TextField(blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_payments')
    processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [['tenant', 'payment_number']]
        indexes = [
            models.Index(fields=['payment_number']),
            models.Index(fields=['invoice']),
            models.Index(fields=['customer']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.payment_number} - {self.customer.name} - Rs. {self.amount}"

    def save(self, *args, **kwargs):
        if not self.payment_number:
            # Generate payment number
            last_payment = Payment.objects.filter(tenant=self.tenant).order_by('-id').first()
            if last_payment:
                last_num = int(last_payment.payment_number.split('-')[-1])
                self.payment_number = f"PAY-{last_num + 1:06d}"
            else:
                self.payment_number = "PAY-000001"
        super().save(*args, **kwargs)