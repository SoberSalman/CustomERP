// Customer Management API Service

import api from './api';
import {
  Customer,
  CustomerListItem,
  CustomerCreateUpdate,
  CustomerContact,
  CustomerCategory,
  CustomerInteraction,
  CustomerStats,
  CustomerFilters,
  PaginatedResponse,
} from '../types/customer';

// Customer APIs
export const customerApi = {
  // List customers with filters
  list: (filters?: CustomerFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customer_type) params.append('customer_type', filters.customer_type);
    if (filters?.vip_only) params.append('vip_only', 'true');
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_direction) params.append('sort_direction', filters.sort_direction);

    const queryString = params.toString();
    return api.get<PaginatedResponse<CustomerListItem>>(
      `/customers/${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get customer details
  get: (id: string) => api.get<Customer>(`/customers/${id}/`),

  // Create customer
  create: (data: CustomerCreateUpdate) => api.post<Customer>('/customers/', data),

  // Update customer
  update: (id: string, data: Partial<CustomerCreateUpdate>) =>
    api.patch<Customer>(`/customers/${id}/`, data),

  // Delete customer
  delete: (id: string) => api.delete(`/customers/${id}/`),

  // Get customer statistics
  stats: () => api.get<CustomerStats>('/customers/stats/'),

  // Bulk actions
  bulkAction: (action: string, customer_ids: string[], data?: any) =>
    api.post('/customers/bulk-actions/', { action, customer_ids, ...data }),

  // Convert lead to customer
  convertLead: (id: string) => api.post(`/customers/${id}/convert-to-customer/`),

  // Get follow-ups
  followUps: () => api.get('/customers/follow-ups/'),
};

// Customer Categories APIs
export const customerCategoryApi = {
  list: () => api.get<PaginatedResponse<CustomerCategory>>('/customers/categories/'),
  get: (id: string) => api.get<CustomerCategory>(`/customers/categories/${id}/`),
  create: (data: Partial<CustomerCategory>) => api.post<CustomerCategory>('/customers/categories/', data),
  update: (id: string, data: Partial<CustomerCategory>) =>
    api.patch<CustomerCategory>(`/customers/categories/${id}/`, data),
  delete: (id: string) => api.delete(`/customers/categories/${id}/`),
};

// Customer Contacts APIs
export const customerContactApi = {
  list: (customerId: string) => api.get<CustomerContact[]>(`/customers/${customerId}/contacts/`),
  get: (customerId: string, contactId: string) =>
    api.get<CustomerContact>(`/customers/${customerId}/contacts/${contactId}/`),
  create: (customerId: string, data: Partial<CustomerContact>) =>
    api.post<CustomerContact>(`/customers/${customerId}/contacts/`, data),
  update: (customerId: string, contactId: string, data: Partial<CustomerContact>) =>
    api.patch<CustomerContact>(`/customers/${customerId}/contacts/${contactId}/`, data),
  delete: (customerId: string, contactId: string) =>
    api.delete(`/customers/${customerId}/contacts/${contactId}/`),
};

// Customer Interactions APIs
export const customerInteractionApi = {
  list: (customerId: string) => api.get<CustomerInteraction[]>(`/customers/${customerId}/interactions/`),
  get: (customerId: string, interactionId: string) =>
    api.get<CustomerInteraction>(`/customers/${customerId}/interactions/${interactionId}/`),
  create: (customerId: string, data: Partial<CustomerInteraction>) =>
    api.post<CustomerInteraction>(`/customers/${customerId}/interactions/`, data),
  update: (customerId: string, interactionId: string, data: Partial<CustomerInteraction>) =>
    api.patch<CustomerInteraction>(`/customers/${customerId}/interactions/${interactionId}/`, data),
  delete: (customerId: string, interactionId: string) =>
    api.delete(`/customers/${customerId}/interactions/${interactionId}/`),
};

// Customer Type Options
export const CUSTOMER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
  { value: 'government', label: 'Government' },
];

// Customer Status Options
export const CUSTOMER_STATUS_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active Customer' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
];

// Interaction Type Options
export const INTERACTION_TYPE_OPTIONS = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'visit', label: 'Site Visit' },
  { value: 'demo', label: 'Product Demo' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Other' },
];