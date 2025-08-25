from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
    adjust_stock,
    StockMovementListView,
    SupplierListCreateView,
    SupplierDetailView,
    ProductSupplierListCreateView,
    ProductSupplierDetailView,
    product_stats,
    low_stock_products,
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<uuid:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Products
    path('products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<uuid:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/stats/', product_stats, name='product-stats'),
    path('products/low-stock/', low_stock_products, name='low-stock-products'),
    
    # Stock Management
    path('stock/adjust/', adjust_stock, name='adjust-stock'),
    path('stock/movements/', StockMovementListView.as_view(), name='stock-movements'),
    
    # Suppliers
    path('suppliers/', SupplierListCreateView.as_view(), name='supplier-list-create'),
    path('suppliers/<uuid:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    
    # Product-Supplier Relationships
    path('product-suppliers/', ProductSupplierListCreateView.as_view(), name='product-supplier-list-create'),
    path('product-suppliers/<uuid:pk>/', ProductSupplierDetailView.as_view(), name='product-supplier-detail'),
]