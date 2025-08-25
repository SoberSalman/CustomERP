from django.contrib import admin
from .models import Customer, CustomerContact, CustomerCategory, CustomerInteraction


@admin.register(CustomerCategory)
class CustomerCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'is_active', 'created_at']
    list_filter = ['tenant', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


class CustomerContactInline(admin.TabularInline):
    model = CustomerContact
    extra = 0
    fields = ['name', 'designation', 'email', 'phone', 'is_primary', 'is_active']


class CustomerInteractionInline(admin.TabularInline):
    model = CustomerInteraction
    extra = 0
    fields = ['interaction_type', 'subject', 'interaction_date', 'follow_up_required']
    readonly_fields = ['created_at']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'customer_code', 'customer_type', 'status', 'email', 
        'phone', 'total_spent', 'is_active', 'created_at'
    ]
    list_filter = [
        'tenant', 'customer_type', 'status', 'is_active', 
        'created_at', 'last_order_date'
    ]
    search_fields = [
        'name', 'customer_code', 'email', 'phone', 
        'contact_person', 'tax_number'
    ]
    readonly_fields = [
        'customer_code', 'total_orders', 'total_spent', 
        'outstanding_balance', 'last_order_date', 'full_address', 
        'is_vip', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'name', 'customer_code', 'customer_type', 'status',
                'contact_person', 'assigned_to'
            )
        }),
        ('Contact Information', {
            'fields': (
                'email', 'phone', 'mobile', 'website'
            )
        }),
        ('Billing Address', {
            'fields': (
                'billing_address', 'billing_city', 'billing_state',
                'billing_country', 'billing_postal_code'
            )
        }),
        ('Shipping Address', {
            'fields': (
                'use_billing_as_shipping', 'shipping_address', 'shipping_city',
                'shipping_state', 'shipping_country', 'shipping_postal_code'
            )
        }),
        ('Business Information', {
            'fields': (
                'tax_number', 'registration_number', 'payment_terms', 'credit_limit'
            )
        }),
        ('Financial Summary', {
            'fields': (
                'total_orders', 'total_spent', 'outstanding_balance',
                'last_order_date', 'is_vip'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': (
                'notes', 'tags', 'is_active'
            )
        }),
        ('Metadata', {
            'fields': (
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    inlines = [CustomerContactInline, CustomerInteractionInline]
    ordering = ['name']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('tenant', 'assigned_to')


@admin.register(CustomerContact)
class CustomerContactAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'customer', 'designation', 'email', 
        'phone', 'is_primary', 'is_active'
    ]
    list_filter = ['is_primary', 'is_active', 'created_at']
    search_fields = ['name', 'email', 'phone', 'customer__name']
    ordering = ['customer__name', 'name']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer')


@admin.register(CustomerInteraction)
class CustomerInteractionAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'interaction_type', 'subject', 
        'interaction_date', 'follow_up_required', 'created_by'
    ]
    list_filter = [
        'interaction_type', 'follow_up_required', 'interaction_date', 'created_at'
    ]
    search_fields = ['customer__name', 'subject', 'description']
    readonly_fields = ['created_at']
    date_hierarchy = 'interaction_date'
    ordering = ['-interaction_date']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'created_by')
