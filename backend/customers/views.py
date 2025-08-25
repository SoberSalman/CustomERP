from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, Sum, F, Q, Avg
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta

from tenants.middleware import RequireTenantMixin, TenantQuerySetMixin
from .models import Customer, CustomerContact, CustomerCategory, CustomerInteraction
from .serializers import (
    CustomerCategorySerializer, CustomerContactSerializer, CustomerListSerializer,
    CustomerDetailSerializer, CustomerCreateUpdateSerializer, CustomerInteractionSerializer,
    CustomerStatsSerializer, CustomerImportSerializer
)


class CustomerCategoryListCreateView(RequireTenantMixin, TenantQuerySetMixin, generics.ListCreateAPIView):
    serializer_class = CustomerCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CustomerCategory.objects.filter(tenant=self.request.tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, created_by=self.request.user)


class CustomerCategoryDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return CustomerCategory.objects.filter(tenant=self.request.tenant)


class CustomerListCreateView(RequireTenantMixin, TenantQuerySetMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CustomerCreateUpdateSerializer
        return CustomerListSerializer
    
    def get_queryset(self):
        queryset = Customer.objects.filter(tenant=self.request.tenant).select_related('assigned_to')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by customer type
        customer_type = self.request.query_params.get('customer_type')
        if customer_type:
            queryset = queryset.filter(customer_type=customer_type)
        
        # Filter by VIP status
        vip_only = self.request.query_params.get('vip_only')
        if vip_only and vip_only.lower() == 'true':
            queryset = queryset.filter(total_spent__gte=Decimal('100000.00'))
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(customer_code__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(contact_person__icontains=search)
            )
        
        # Filter by assigned user
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            if assigned_to == 'me':
                queryset = queryset.filter(assigned_to=self.request.user)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Sort by
        sort_by = self.request.query_params.get('sort_by', 'name')
        if sort_by in ['name', 'created_at', 'total_spent', 'last_order_date']:
            sort_direction = self.request.query_params.get('sort_direction', 'asc')
            if sort_direction == 'desc':
                sort_by = f'-{sort_by}'
            queryset = queryset.order_by(sort_by)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, created_by=self.request.user)


class CustomerDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer
    
    def get_queryset(self):
        return Customer.objects.filter(tenant=self.request.tenant).select_related(
            'created_by', 'assigned_to'
        ).prefetch_related('contacts', 'interactions')


class CustomerContactListCreateView(RequireTenantMixin, generics.ListCreateAPIView):
    serializer_class = CustomerContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return CustomerContact.objects.filter(customer_id=customer_id)
    
    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_id')
        customer = Customer.objects.get(id=customer_id, tenant=self.request.tenant)
        serializer.save(customer=customer)


class CustomerContactDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return CustomerContact.objects.filter(customer_id=customer_id)


class CustomerInteractionListCreateView(RequireTenantMixin, generics.ListCreateAPIView):
    serializer_class = CustomerInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return CustomerInteraction.objects.filter(
            customer_id=customer_id
        ).select_related('customer', 'created_by')
    
    def perform_create(self, serializer):
        customer_id = self.kwargs.get('customer_id')
        customer = Customer.objects.get(id=customer_id, tenant=self.request.tenant)
        serializer.save(customer=customer, created_by=self.request.user)


class CustomerInteractionDetailView(RequireTenantMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CustomerInteractionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        customer_id = self.kwargs.get('customer_id')
        return CustomerInteraction.objects.filter(customer_id=customer_id)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_stats(request):
    """Get customer statistics for dashboard"""
    tenant = request.tenant
    
    # Get date filters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    queryset = Customer.objects.filter(tenant=tenant)
    
    if start_date and end_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        queryset = queryset.filter(created_at__date__range=[start_date, end_date])
    
    # Calculate statistics
    stats = {
        'total_customers': queryset.count(),
        'active_customers': queryset.filter(status='active').count(),
        'leads': queryset.filter(status='lead').count(),
        'prospects': queryset.filter(status='prospect').count(),
        'vip_customers': queryset.filter(total_spent__gte=Decimal('100000.00')).count(),
        'total_customer_value': queryset.aggregate(
            total=Sum('total_spent')
        )['total'] or Decimal('0.00'),
        'average_order_value': queryset.aggregate(
            avg=Avg('total_spent')
        )['avg'] or Decimal('0.00'),
        'this_month_new_customers': queryset.filter(
            created_at__month=timezone.now().month,
            created_at__year=timezone.now().year
        ).count()
    }
    
    serializer = CustomerStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_customer_actions(request):
    """Bulk actions for customers (update status, assign, etc.)"""
    action = request.data.get('action')
    customer_ids = request.data.get('customer_ids', [])
    
    if not action or not customer_ids:
        return Response(
            {'error': 'Action and customer_ids are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    customers = Customer.objects.filter(
        tenant=request.tenant,
        id__in=customer_ids
    )
    
    if not customers.exists():
        return Response(
            {'error': 'No customers found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    updated_count = 0
    
    with transaction.atomic():
        if action == 'update_status':
            new_status = request.data.get('new_status')
            if new_status in dict(Customer.STATUS_CHOICES):
                updated_count = customers.update(status=new_status)
        
        elif action == 'assign_to':
            user_id = request.data.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    updated_count = customers.update(assigned_to=user)
                except User.DoesNotExist:
                    return Response(
                        {'error': 'User not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        elif action == 'activate':
            updated_count = customers.update(is_active=True)
        
        elif action == 'deactivate':
            updated_count = customers.update(is_active=False)
        
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response({
        'message': f'Successfully updated {updated_count} customers',
        'updated_count': updated_count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def customer_follow_ups(request):
    """Get customers with pending follow-ups"""
    tenant = request.tenant
    
    # Get interactions that need follow-up
    interactions = CustomerInteraction.objects.filter(
        customer__tenant=tenant,
        follow_up_required=True,
        follow_up_date__lte=timezone.now().date()
    ).select_related('customer')
    
    # Group by customer
    follow_up_data = {}
    for interaction in interactions:
        customer_id = str(interaction.customer.id)
        if customer_id not in follow_up_data:
            follow_up_data[customer_id] = {
                'customer': CustomerListSerializer(interaction.customer).data,
                'interactions': []
            }
        follow_up_data[customer_id]['interactions'].append(
            CustomerInteractionSerializer(interaction).data
        )
    
    return Response(list(follow_up_data.values()))


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def convert_lead_to_customer(request, customer_id):
    """Convert a lead to an active customer"""
    try:
        customer = Customer.objects.get(
            id=customer_id,
            tenant=request.tenant,
            status='lead'
        )
        
        customer.status = 'active'
        customer.save()
        
        return Response({
            'message': 'Lead successfully converted to customer',
            'customer': CustomerDetailSerializer(customer).data
        })
        
    except Customer.DoesNotExist:
        return Response(
            {'error': 'Lead not found'},
            status=status.HTTP_404_NOT_FOUND
        )
