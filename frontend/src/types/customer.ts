// Customer Management Types

export interface Customer {
  id: string;
  name: string;
  customer_code: string;
  customer_type: 'individual' | 'business' | 'government';
  customer_type_display: string;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'blocked';
  status_display: string;
  
  // Contact Information
  contact_person: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  
  // Address Information
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_postal_code: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  use_billing_as_shipping: boolean;
  
  // Business Information
  tax_number: string;
  registration_number: string;
  payment_terms: string;
  credit_limit?: string;
  
  // Financial Summary
  total_orders: number;
  total_spent: string;
  outstanding_balance: string;
  last_order_date?: string;
  
  // Additional Info
  notes: string;
  tags: string;
  is_active: boolean;
  is_vip: boolean;
  assigned_to?: string;
  assigned_to_name?: string;
  
  // Metadata
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  customer_code: string;
  customer_type: 'individual' | 'business' | 'government';
  customer_type_display: string;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'blocked';
  status_display: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: string;
  outstanding_balance: string;
  is_vip: boolean;
  assigned_to_name?: string;
  last_order_date?: string;
  created_at: string;
}

export interface CustomerCreateUpdate {
  name: string;
  customer_type: 'individual' | 'business' | 'government';
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'blocked';
  contact_person: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_postal_code: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  use_billing_as_shipping: boolean;
  tax_number: string;
  registration_number: string;
  payment_terms: string;
  credit_limit?: string;
  notes: string;
  tags: string;
  is_active: boolean;
  assigned_to?: string;
}

export interface CustomerContact {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CustomerCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  customer_count: number;
}

export interface CustomerInteraction {
  id: string;
  interaction_type: 'call' | 'email' | 'meeting' | 'visit' | 'demo' | 'support' | 'other';
  subject: string;
  description: string;
  interaction_date: string;
  duration_minutes?: number;
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes: string;
  created_by: string;
  created_at: string;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  leads: number;
  prospects: number;
  vip_customers: number;
  total_customer_value: string;
  average_order_value: string;
  this_month_new_customers: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CustomerFilters {
  page?: number;
  search?: string;
  status?: string;
  customer_type?: string;
  vip_only?: boolean;
  assigned_to?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}