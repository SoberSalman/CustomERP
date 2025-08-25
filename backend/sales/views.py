from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Sum, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import django_filters
from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML
import io

from .models import SalesOrder, Invoice, Payment
from .serializers import (
    SalesOrderSerializer, SalesOrderListSerializer,
    InvoiceSerializer, InvoiceListSerializer,
    PaymentSerializer, SalesStatsSerializer
)


class SalesOrderFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=SalesOrder.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=SalesOrder.PRIORITY_CHOICES)
    customer = django_filters.UUIDFilter(field_name='customer__id')
    order_date_from = django_filters.DateTimeFilter(field_name='order_date', lookup_expr='gte')
    order_date_to = django_filters.DateTimeFilter(field_name='order_date', lookup_expr='lte')
    total_amount_min = django_filters.NumberFilter(field_name='total_amount', lookup_expr='gte')
    total_amount_max = django_filters.NumberFilter(field_name='total_amount', lookup_expr='lte')

    class Meta:
        model = SalesOrder
        fields = ['status', 'priority', 'customer']


class SalesOrderViewSet(viewsets.ModelViewSet):
    serializer_class = SalesOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = SalesOrderFilter
    search_fields = ['order_number', 'reference', 'customer__name', 'notes']
    ordering_fields = ['order_date', 'total_amount', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return SalesOrder.objects.filter(
            tenant=self.request.user.tenant_membership.tenant
        ).select_related('customer', 'created_by', 'assigned_to').prefetch_related('items__product')

    def get_serializer_class(self):
        if self.action == 'list':
            return SalesOrderListSerializer
        return SalesOrderSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a sales order"""
        order = self.get_object()
        if order.status == 'draft':
            order.status = 'confirmed'
            order.save(update_fields=['status'])
            return Response({'message': 'Sales order confirmed successfully'})
        return Response(
            {'error': 'Only draft orders can be confirmed'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a sales order"""
        order = self.get_object()
        if order.status not in ['delivered', 'cancelled']:
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            return Response({'message': 'Sales order cancelled successfully'})
        return Response(
            {'error': 'Cannot cancel delivered or already cancelled orders'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def create_invoice(self, request, pk=None):
        """Create invoice from sales order"""
        order = self.get_object()
        
        # Check if invoice already exists
        if order.invoices.exists():
            return Response(
                {'error': 'Invoice already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create invoice
        invoice_data = {
            'sales_order': order.id,
            'customer': order.customer.id,
            'invoice_date': timezone.now(),
            'due_date': timezone.now() + timezone.timedelta(days=30),
            'payment_terms': 'net_30',
            'subtotal': order.subtotal,
            'tax_amount': order.tax_amount,
            'discount_amount': order.discount_amount,
            'total_amount': order.total_amount,
            'notes': order.notes,
            'items': []
        }
        
        # Copy items from order to invoice
        for item in order.items.all():
            invoice_data['items'].append({
                'product': item.product.id,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'discount_percent': item.discount_percent,
                'notes': item.notes
            })
        
        serializer = InvoiceSerializer(data=invoice_data, context={'request': request})
        if serializer.is_valid():
            invoice = serializer.save()
            return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvoiceFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Invoice.STATUS_CHOICES)
    customer = django_filters.UUIDFilter(field_name='customer__id')
    sales_order = django_filters.UUIDFilter(field_name='sales_order__id')
    invoice_date_from = django_filters.DateTimeFilter(field_name='invoice_date', lookup_expr='gte')
    invoice_date_to = django_filters.DateTimeFilter(field_name='invoice_date', lookup_expr='lte')
    due_date_from = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')
    due_date_to = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    class Meta:
        model = Invoice
        fields = ['status', 'customer', 'sales_order']

    def filter_overdue(self, queryset, name, value):
        if value:
            return queryset.filter(due_date__lt=timezone.now(), status__in=['sent', 'partially_paid'])
        return queryset


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = InvoiceFilter
    search_fields = ['invoice_number', 'reference', 'customer__name', 'notes']
    ordering_fields = ['invoice_date', 'due_date', 'total_amount', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Invoice.objects.filter(
            tenant=self.request.user.tenant_membership.tenant
        ).select_related('customer', 'sales_order', 'created_by').prefetch_related('items__product')

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Mark invoice as sent"""
        invoice = self.get_object()
        if invoice.status == 'draft':
            invoice.status = 'sent'
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=['status', 'sent_at'])
            return Response({'message': 'Invoice marked as sent'})
        return Response(
            {'error': 'Only draft invoices can be sent'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as fully paid"""
        invoice = self.get_object()
        if invoice.status not in ['paid', 'cancelled']:
            invoice.status = 'paid'
            invoice.paid_amount = invoice.total_amount
            invoice.save(update_fields=['status', 'paid_amount'])
            return Response({'message': 'Invoice marked as paid'})
        return Response(
            {'error': 'Cannot mark paid/cancelled invoices as paid'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get payments for this invoice"""
        invoice = self.get_object()
        payments = invoice.payments.all()
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download invoice as PDF"""
        invoice = self.get_object()
        tenant = request.user.tenant_membership.tenant
        
        # Render the HTML template
        html_content = render_to_string('invoice_template.html', {
            'invoice': invoice,
            'tenant': tenant,
        })
        
        # Create PDF from HTML
        html = HTML(string=html_content)
        pdf_file = io.BytesIO()
        html.write_pdf(target=pdf_file)
        pdf_file.seek(0)
        
        # Prepare response
        response = HttpResponse(pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Invoice-{invoice.invoice_number}.pdf"'
        
        return response


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['payment_number', 'reference', 'transaction_id', 'customer__name']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Payment.objects.filter(
            tenant=self.request.user.tenant_membership.tenant
        ).select_related('invoice', 'customer', 'created_by')

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Mark payment as processed/completed"""
        payment = self.get_object()
        if payment.status == 'pending':
            payment.status = 'completed'
            payment.processed_at = timezone.now()
            payment.save(update_fields=['status', 'processed_at'])
            
            # Update invoice payment status
            serializer = PaymentSerializer(payment)
            serializer._update_invoice_payment_status(payment.invoice)
            
            return Response({'message': 'Payment processed successfully'})
        return Response(
            {'error': 'Only pending payments can be processed'},
            status=status.HTTP_400_BAD_REQUEST
        )


class SalesStatsViewSet(viewsets.ViewSet):
    """Sales statistics and dashboard data"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        tenant = request.user.tenant_membership.tenant
        
        # Get statistics
        total_orders = SalesOrder.objects.filter(tenant=tenant).count()
        total_invoices = Invoice.objects.filter(tenant=tenant).count()
        total_revenue = Invoice.objects.filter(
            tenant=tenant, 
            status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        pending_orders = SalesOrder.objects.filter(
            tenant=tenant, 
            status__in=['draft', 'confirmed']
        ).count()
        
        overdue_invoices = Invoice.objects.filter(
            tenant=tenant,
            due_date__lt=timezone.now(),
            status__in=['sent', 'partially_paid']
        ).count()
        
        # Get recent data
        recent_orders = SalesOrder.objects.filter(tenant=tenant)[:5]
        recent_invoices = Invoice.objects.filter(tenant=tenant)[:5]
        
        data = {
            'total_orders': total_orders,
            'total_invoices': total_invoices,
            'total_revenue': total_revenue,
            'pending_orders': pending_orders,
            'overdue_invoices': overdue_invoices,
            'recent_orders': recent_orders,
            'recent_invoices': recent_invoices,
        }
        
        serializer = SalesStatsSerializer(data)
        return Response(serializer.data)