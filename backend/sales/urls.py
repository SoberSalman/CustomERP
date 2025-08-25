from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesOrderViewSet, InvoiceViewSet, PaymentViewSet, SalesStatsViewSet

router = DefaultRouter()
router.register(r'orders', SalesOrderViewSet, basename='salesorder')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'stats', SalesStatsViewSet, basename='sales-stats')

urlpatterns = [
    path('', include(router.urls)),
]