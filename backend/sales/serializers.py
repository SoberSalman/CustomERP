from rest_framework import serializers
from django.utils import timezone
from decimal import Decimal
from .models import SalesOrder, SalesOrderItem, Invoice, InvoiceItem, Payment
from customers.serializers import CustomerListSerializer
from inventory.serializers import ProductListSerializer


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SalesOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'discount_percent', 'line_total', 'notes'
        ]
        read_only_fields = ['line_total']


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = SalesOrder
        fields = [
            'id', 'order_number', 'reference', 'customer', 'customer_name', 'customer_email',
            'order_date', 'expected_delivery_date', 'status', 'priority',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'notes', 'internal_notes', 'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['order_number', 'subtotal', 'total_amount', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant_membership.tenant
        validated_data['created_by'] = request.user
        
        items_data = validated_data.pop('items', [])
        sales_order = SalesOrder.objects.create(**validated_data)
        
        # Create order items
        for item_data in items_data:
            item_data['tenant'] = sales_order.tenant
            SalesOrderItem.objects.create(sales_order=sales_order, **item_data)
        
        # Recalculate totals
        self._calculate_totals(sales_order)
        return sales_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # Remove existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in items_data:
                item_data['tenant'] = instance.tenant
                SalesOrderItem.objects.create(sales_order=instance, **item_data)
        
        # Recalculate totals
        self._calculate_totals(instance)
        return instance

    def _calculate_totals(self, sales_order):
        items = sales_order.items.all()
        subtotal = sum(item.line_total for item in items)
        
        sales_order.subtotal = subtotal
        sales_order.total_amount = subtotal + sales_order.tax_amount - sales_order.discount_amount
        sales_order.save(update_fields=['subtotal', 'total_amount'])


class SalesOrderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SalesOrder
        fields = [
            'id', 'order_number', 'customer_name', 'order_date',
            'status', 'priority', 'total_amount', 'items_count', 'created_at'
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'discount_percent', 'line_total', 'notes'
        ]
        read_only_fields = ['line_total']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    balance_due = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'reference', 'sales_order', 'sales_order_number',
            'customer', 'customer_name', 'customer_email', 'invoice_date', 'due_date',
            'payment_terms', 'status', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'paid_amount', 'balance_due', 'is_overdue',
            'notes', 'terms_conditions', 'created_by', 'created_by_name',
            'sent_at', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'invoice_number', 'subtotal', 'total_amount', 'balance_due', 'is_overdue',
            'created_by', 'sent_at', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant_membership.tenant
        validated_data['created_by'] = request.user
        
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        
        # Create invoice items
        for item_data in items_data:
            item_data['tenant'] = invoice.tenant
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        # Recalculate totals
        self._calculate_totals(invoice)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # Remove existing items
            instance.items.all().delete()
            
            # Create new items
            for item_data in items_data:
                item_data['tenant'] = instance.tenant
                InvoiceItem.objects.create(invoice=instance, **item_data)
        
        # Recalculate totals
        self._calculate_totals(instance)
        return instance

    def _calculate_totals(self, invoice):
        items = invoice.items.all()
        subtotal = sum(item.line_total for item in items)
        
        invoice.subtotal = subtotal
        invoice.total_amount = subtotal + invoice.tax_amount - invoice.discount_amount
        invoice.save(update_fields=['subtotal', 'total_amount'])


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    balance_due = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'invoice_date', 'due_date',
            'status', 'total_amount', 'paid_amount', 'balance_due', 'is_overdue'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'reference', 'invoice', 'invoice_number',
            'customer', 'customer_name', 'payment_date', 'amount',
            'payment_method', 'status', 'notes', 'transaction_id',
            'created_by', 'created_by_name', 'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['payment_number', 'created_by', 'processed_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['tenant'] = request.user.tenant_membership.tenant
        validated_data['created_by'] = request.user
        
        payment = Payment.objects.create(**validated_data)
        
        # Update invoice paid amount
        self._update_invoice_payment_status(payment.invoice)
        
        return payment

    def update(self, instance, validated_data):
        old_invoice = instance.invoice
        old_amount = instance.amount
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update invoice payment status for both old and new invoice (if changed)
        self._update_invoice_payment_status(old_invoice)
        if instance.invoice != old_invoice:
            self._update_invoice_payment_status(instance.invoice)
        
        return instance

    def _update_invoice_payment_status(self, invoice):
        """Update invoice payment status and paid amount"""
        total_paid = sum(
            payment.amount for payment in invoice.payments.filter(status='completed')
        )
        invoice.paid_amount = total_paid
        
        # Update status based on payment
        if total_paid >= invoice.total_amount:
            invoice.status = 'paid'
        elif total_paid > 0:
            invoice.status = 'partially_paid'
        elif invoice.is_overdue:
            invoice.status = 'overdue'
        
        invoice.save(update_fields=['paid_amount', 'status'])


class SalesStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_invoices = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_orders = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
    recent_orders = SalesOrderListSerializer(many=True)
    recent_invoices = InvoiceListSerializer(many=True)