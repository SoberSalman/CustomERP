from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Product, StockMovement, Supplier, ProductSupplier


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'color', 'is_active', 
            'created_at', 'updated_at', 'product_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'product_count']
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list view (lighter)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    stock_status_display = serializers.CharField(source='get_stock_status_display', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'product_type', 'category_name', 'category_color',
            'selling_price', 'current_stock', 'minimum_stock', 'stock_status', 
            'stock_status_display', 'is_active', 'is_featured', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed product view"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    profit_margin = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    stock_movements_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'barcode', 'product_type', 
            'category', 'category_name', 'cost_price', 'selling_price', 
            'margin_percentage', 'profit_margin', 'track_inventory', 
            'current_stock', 'minimum_stock', 'maximum_stock', 'stock_status',
            'weight', 'dimensions', 'image', 'is_active', 'is_featured',
            'is_low_stock', 'is_out_of_stock', 'stock_movements_count',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sku', 'margin_percentage', 'stock_status', 'profit_margin',
            'is_low_stock', 'is_out_of_stock', 'created_at', 'updated_at'
        ]
    
    def get_stock_movements_count(self, obj):
        return obj.stock_movements.count()


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'barcode', 'product_type', 'category',
            'cost_price', 'selling_price', 'track_inventory', 'current_stock',
            'minimum_stock', 'maximum_stock', 'weight', 'dimensions',
            'image', 'is_active', 'is_featured'
        ]
    
    def validate(self, data):
        if data.get('cost_price', 0) < 0:
            raise serializers.ValidationError("Cost price cannot be negative")
        
        if data.get('selling_price', 0) < 0:
            raise serializers.ValidationError("Selling price cannot be negative")
        
        if data.get('current_stock', 0) < 0:
            raise serializers.ValidationError("Current stock cannot be negative")
        
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'movement_type',
            'movement_type_display', 'quantity', 'previous_stock', 'new_stock',
            'reference_number', 'notes', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for manual stock adjustments"""
    product_id = serializers.UUIDField()
    new_quantity = serializers.IntegerField(min_value=0)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_new_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative")
        return value


class SupplierSerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone', 'address',
            'city', 'country', 'postal_code', 'tax_number', 'payment_terms',
            'is_active', 'products_count', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'products_count', 'created_at', 'updated_at']
    
    def get_products_count(self, obj):
        return obj.supplier_products.filter(is_active=True).count()


class ProductSupplierSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = ProductSupplier
        fields = [
            'id', 'product', 'product_name', 'supplier', 'supplier_name',
            'supplier_sku', 'supplier_price', 'minimum_order_quantity',
            'lead_time_days', 'is_primary', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if data.get('supplier_price') and data['supplier_price'] < 0:
            raise serializers.ValidationError("Supplier price cannot be negative")
        
        if data.get('minimum_order_quantity', 0) <= 0:
            raise serializers.ValidationError("Minimum order quantity must be greater than 0")
        
        return data


class ProductStatsSerializer(serializers.Serializer):
    """Serializer for product statistics"""
    total_products = serializers.IntegerField()
    active_products = serializers.IntegerField()
    low_stock_products = serializers.IntegerField()
    out_of_stock_products = serializers.IntegerField()
    total_inventory_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    categories_count = serializers.IntegerField()
    suppliers_count = serializers.IntegerField()