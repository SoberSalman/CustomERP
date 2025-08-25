from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, Sum, F
from django.db import transaction
from decimal import Decimal

from tenants.middleware import RequireTenantMixin, TenantQuerySetMixin
from .models import Category, Product, StockMovement, Supplier, ProductSupplier
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer, StockMovementSerializer, StockAdjustmentSerializer,
    SupplierSerializer, ProductSupplierSerializer, ProductStatsSerializer
)


class CategoryListCreateView(RequireTenantMixin, TenantQuerySetMixin, generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.filter(tenant=self.request.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, created_by=self.request.user)


class CategoryDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.filter(tenant=self.request.tenant)


class ProductListCreateView(RequireTenantMixin, TenantQuerySetMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateUpdateSerializer
        return ProductListSerializer
    
    def get_queryset(self):
        queryset = Product.objects.filter(tenant=self.request.tenant).select_related('category')
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by product type
        product_type = self.request.query_params.get('type')
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status:
            queryset = queryset.filter(stock_status=stock_status)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ).union(
                queryset.filter(sku__icontains=search)
            ).union(
                queryset.filter(description__icontains=search)
            )
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, created_by=self.request.user)


class ProductDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer
    
    def get_queryset(self):
        return Product.objects.filter(tenant=self.request.tenant)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def adjust_stock(request):
    """Manually adjust product stock"""
    serializer = StockAdjustmentSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                product_id = serializer.validated_data['product_id']
                new_quantity = serializer.validated_data['new_quantity']
                notes = serializer.validated_data.get('notes', '')
                
                # Get the product
                product = Product.objects.select_for_update().get(
                    id=product_id,
                    tenant=request.tenant
                )
                
                if not product.track_inventory:
                    return Response(
                        {'error': 'Cannot adjust stock for non-inventory products'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                previous_stock = product.current_stock
                adjustment = new_quantity - previous_stock
                
                # Create stock movement record
                StockMovement.objects.create(
                    tenant=request.tenant,
                    product=product,
                    movement_type='adjustment',
                    quantity=adjustment,
                    previous_stock=previous_stock,
                    new_stock=new_quantity,
                    notes=notes,
                    created_by=request.user
                )
                
                # Update product stock
                product.current_stock = new_quantity
                product.save()
                
                return Response({
                    'message': 'Stock adjusted successfully',
                    'product_id': str(product.id),
                    'previous_stock': previous_stock,
                    'new_stock': new_quantity,
                    'adjustment': adjustment
                })
                
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockMovementListView(RequireTenantMixin, TenantQuerySetMixin, generics.ListAPIView):
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = StockMovement.objects.filter(tenant=self.request.tenant).select_related(
            'product', 'created_by'
        )
        
        # Filter by product
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by movement type
        movement_type = self.request.query_params.get('type')
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        
        return queryset


class SupplierListCreateView(RequireTenantMixin, TenantQuerySetMixin, generics.ListCreateAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Supplier.objects.filter(tenant=self.request.tenant)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, created_by=self.request.user)


class SupplierDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Supplier.objects.filter(tenant=self.request.tenant)


class ProductSupplierListCreateView(RequireTenantMixin, TenantQuerySetMixin, generics.ListCreateAPIView):
    serializer_class = ProductSupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ProductSupplier.objects.filter(tenant=self.request.tenant).select_related(
            'product', 'supplier'
        )
        
        # Filter by product
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by supplier
        supplier_id = self.request.query_params.get('supplier')
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)


class ProductSupplierDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProductSupplier.objects.filter(tenant=self.request.tenant)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def product_stats(request):
    """Get product and inventory statistics"""
    tenant = request.tenant
    
    if not tenant:
        return Response({'error': 'Tenant required'}, status=400)
    
    # Get basic counts
    total_products = Product.objects.filter(tenant=tenant).count()
    active_products = Product.objects.filter(tenant=tenant, is_active=True).count()
    low_stock_products = Product.objects.filter(
        tenant=tenant, 
        is_active=True,
        track_inventory=True,
        current_stock__lte=F('minimum_stock'),
        current_stock__gt=0
    ).count()
    out_of_stock_products = Product.objects.filter(
        tenant=tenant, 
        is_active=True,
        track_inventory=True,
        current_stock=0
    ).count()
    
    # Calculate total inventory value
    inventory_value = Product.objects.filter(
        tenant=tenant, 
        is_active=True,
        track_inventory=True
    ).aggregate(
        total_value=Sum(F('current_stock') * F('cost_price'))
    )['total_value'] or Decimal('0.00')
    
    # Get categories and suppliers count
    categories_count = Category.objects.filter(tenant=tenant, is_active=True).count()
    suppliers_count = Supplier.objects.filter(tenant=tenant, is_active=True).count()
    
    stats_data = {
        'total_products': total_products,
        'active_products': active_products,
        'low_stock_products': low_stock_products,
        'out_of_stock_products': out_of_stock_products,
        'total_inventory_value': inventory_value,
        'categories_count': categories_count,
        'suppliers_count': suppliers_count,
    }
    
    serializer = ProductStatsSerializer(stats_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def low_stock_products(request):
    """Get products with low stock levels"""
    tenant = request.tenant
    
    if not tenant:
        return Response({'error': 'Tenant required'}, status=400)
    
    low_stock_products = Product.objects.filter(
        tenant=tenant,
        is_active=True,
        track_inventory=True,
        current_stock__lte=F('minimum_stock')
    ).select_related('category')
    
    serializer = ProductListSerializer(low_stock_products, many=True)
    return Response(serializer.data)