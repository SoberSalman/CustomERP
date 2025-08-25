from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Customer, CustomerContact, CustomerCategory, CustomerInteraction


class CustomerCategorySerializer(serializers.ModelSerializer):
    customer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerCategory
        fields = [
            'id', 'name', 'description', 'color', 'is_active', 
            'created_at', 'customer_count'
        ]
        read_only_fields = ['id', 'created_at', 'customer_count']
    
    def get_customer_count(self, obj):
        return obj.customers.filter(is_active=True).count()


class CustomerContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerContact
        fields = [
            'id', 'name', 'designation', 'department', 'email', 
            'phone', 'mobile', 'is_primary', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CustomerListSerializer(serializers.ModelSerializer):
    """Serializer for customer list view (lighter)"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer_type_display = serializers.CharField(source='get_customer_type_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    is_vip = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'customer_code', 'customer_type', 'customer_type_display',
            'status', 'status_display', 'email', 'phone', 'total_orders',
            'total_spent', 'outstanding_balance', 'is_vip', 'assigned_to_name',
            'last_order_date', 'created_at'
        ]


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed customer view"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    is_vip = serializers.BooleanField(read_only=True)
    full_address = serializers.CharField(read_only=True)
    contacts = CustomerContactSerializer(many=True, read_only=True)
    interactions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'customer_code', 'customer_type', 'status',
            'contact_person', 'email', 'phone', 'mobile', 'website',
            'billing_address', 'billing_city', 'billing_state', 'billing_country',
            'billing_postal_code', 'shipping_address', 'shipping_city',
            'shipping_state', 'shipping_country', 'shipping_postal_code',
            'use_billing_as_shipping', 'tax_number', 'registration_number',
            'payment_terms', 'credit_limit', 'total_orders', 'total_spent',
            'outstanding_balance', 'last_order_date', 'notes', 'tags',
            'is_active', 'assigned_to', 'full_address', 'is_vip',
            'contacts', 'interactions_count', 'created_by_name', 
            'assigned_to_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer_code', 'total_orders', 'total_spent',
            'outstanding_balance', 'last_order_date', 'full_address',
            'is_vip', 'created_at', 'updated_at'
        ]
    
    def get_interactions_count(self, obj):
        return obj.interactions.count()


class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating customers"""
    
    class Meta:
        model = Customer
        fields = [
            'name', 'customer_type', 'status', 'contact_person', 'email',
            'phone', 'mobile', 'website', 'billing_address', 'billing_city',
            'billing_state', 'billing_country', 'billing_postal_code',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_country', 'shipping_postal_code', 'use_billing_as_shipping',
            'tax_number', 'registration_number', 'payment_terms', 'credit_limit',
            'notes', 'tags', 'is_active', 'assigned_to'
        ]
    
    def validate_email(self, value):
        if value:
            # Check if email is unique within tenant
            tenant = self.context['request'].tenant
            existing = Customer.objects.filter(
                tenant=tenant, 
                email=value
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError("A customer with this email already exists.")
        return value
    
    def validate_credit_limit(self, value):
        if value and value < 0:
            raise serializers.ValidationError("Credit limit cannot be negative.")
        return value


class CustomerInteractionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    interaction_type_display = serializers.CharField(source='get_interaction_type_display', read_only=True)
    
    class Meta:
        model = CustomerInteraction
        fields = [
            'id', 'customer', 'customer_name', 'interaction_type',
            'interaction_type_display', 'subject', 'description',
            'interaction_date', 'duration_minutes', 'follow_up_required',
            'follow_up_date', 'follow_up_notes', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_follow_up_date(self, value):
        if value and self.validated_data.get('follow_up_required') and value < timezone.now().date():
            raise serializers.ValidationError("Follow-up date cannot be in the past.")
        return value


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer for customer statistics"""
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    leads = serializers.IntegerField()
    prospects = serializers.IntegerField()
    vip_customers = serializers.IntegerField()
    total_customer_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month_new_customers = serializers.IntegerField()


class CustomerImportSerializer(serializers.Serializer):
    """Serializer for bulk customer import"""
    file = serializers.FileField()
    
    def validate_file(self, value):
        if not value.name.endswith(('.csv', '.xlsx')):
            raise serializers.ValidationError("Only CSV and Excel files are supported.")
        return value