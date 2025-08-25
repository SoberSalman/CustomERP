import api from './api';
import {
  SalesOrder,
  SalesOrderListItem,
  SalesOrderCreateUpdate,
  SalesFilters,
  Invoice,
  InvoiceListItem,
  InvoiceCreateUpdate,
  InvoiceFilters,
  Payment,
  PaymentCreateUpdate,
  PaymentFilters,
  SalesStats
} from '../types/sales';

export const salesOrderApi = {
  // Sales Orders
  list: (filters?: SalesFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return api.get<{
      count: number;
      next: string | null;
      previous: string | null;
      results: SalesOrderListItem[];
    }>(`/sales/orders/${queryString ? `?${queryString}` : ''}`);
  },

  get: (id: string | number) => 
    api.get<SalesOrder>(`/sales/orders/${id}/`),

  create: (data: SalesOrderCreateUpdate) => 
    api.post<SalesOrder>('/sales/orders/', data),

  update: (id: string | number, data: Partial<SalesOrderCreateUpdate>) => 
    api.patch<SalesOrder>(`/sales/orders/${id}/`, data),

  delete: (id: string | number) => 
    api.delete(`/sales/orders/${id}/`),

  // Sales Order Actions
  confirm: (id: string | number) => 
    api.post<{ message: string }>(`/sales/orders/${id}/confirm/`),

  cancel: (id: string | number) => 
    api.post<{ message: string }>(`/sales/orders/${id}/cancel/`),

  createInvoice: (id: string | number) => 
    api.post<Invoice>(`/sales/orders/${id}/create_invoice/`),
};

export const invoiceApi = {
  // Invoices
  list: (filters?: InvoiceFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return api.get<{
      count: number;
      next: string | null;
      previous: string | null;
      results: InvoiceListItem[];
    }>(`/sales/invoices/${queryString ? `?${queryString}` : ''}`);
  },

  get: (id: string | number) => 
    api.get<Invoice>(`/sales/invoices/${id}/`),

  create: (data: InvoiceCreateUpdate) => 
    api.post<Invoice>('/sales/invoices/', data),

  update: (id: string | number, data: Partial<InvoiceCreateUpdate>) => 
    api.patch<Invoice>(`/sales/invoices/${id}/`, data),

  delete: (id: string | number) => 
    api.delete(`/sales/invoices/${id}/`),

  // Invoice Actions
  send: (id: string | number) => 
    api.post<{ message: string }>(`/sales/invoices/${id}/send/`),

  markPaid: (id: string | number) => 
    api.post<{ message: string }>(`/sales/invoices/${id}/mark_paid/`),

  getPayments: (id: string | number) => 
    api.get<Payment[]>(`/sales/invoices/${id}/payments/`),
};

export const paymentApi = {
  // Payments
  list: (filters?: PaymentFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return api.get<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Payment[];
    }>(`/sales/payments/${queryString ? `?${queryString}` : ''}`);
  },

  get: (id: string | number) => 
    api.get<Payment>(`/sales/payments/${id}/`),

  create: (data: PaymentCreateUpdate) => 
    api.post<Payment>('/sales/payments/', data),

  update: (id: string | number, data: Partial<PaymentCreateUpdate>) => 
    api.patch<Payment>(`/sales/payments/${id}/`, data),

  delete: (id: string | number) => 
    api.delete(`/sales/payments/${id}/`),

  // Payment Actions
  process: (id: string | number) => 
    api.post<{ message: string }>(`/sales/payments/${id}/process/`),
};

export const salesStatsApi = {
  get: () => api.get<SalesStats>('/sales/stats/'),
};

// Default export for convenience
const salesApi = {
  orders: salesOrderApi,
  invoices: invoiceApi,
  payments: paymentApi,
  stats: salesStatsApi,
};

export default salesApi;