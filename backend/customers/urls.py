from django.urls import path
from .views import (
    CustomerCategoryListCreateView,
    CustomerCategoryDetailView,
    CustomerListCreateView,
    CustomerDetailView,
    CustomerContactListCreateView,
    CustomerContactDetailView,
    CustomerInteractionListCreateView,
    CustomerInteractionDetailView,
    customer_stats,
    bulk_customer_actions,
    customer_follow_ups,
    convert_lead_to_customer,
)

urlpatterns = [
    # Customer Categories
    path('categories/', CustomerCategoryListCreateView.as_view(), name='customer-category-list-create'),
    path('categories/<uuid:pk>/', CustomerCategoryDetailView.as_view(), name='customer-category-detail'),
    
    # Customers
    path('', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('<uuid:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path('stats/', customer_stats, name='customer-stats'),
    path('bulk-actions/', bulk_customer_actions, name='bulk-customer-actions'),
    path('follow-ups/', customer_follow_ups, name='customer-follow-ups'),
    path('<uuid:customer_id>/convert-to-customer/', convert_lead_to_customer, name='convert-lead-to-customer'),
    
    # Customer Contacts
    path('<uuid:customer_id>/contacts/', CustomerContactListCreateView.as_view(), name='customer-contact-list-create'),
    path('<uuid:customer_id>/contacts/<uuid:pk>/', CustomerContactDetailView.as_view(), name='customer-contact-detail'),
    
    # Customer Interactions
    path('<uuid:customer_id>/interactions/', CustomerInteractionListCreateView.as_view(), name='customer-interaction-list-create'),
    path('<uuid:customer_id>/interactions/<uuid:pk>/', CustomerInteractionDetailView.as_view(), name='customer-interaction-detail'),
]