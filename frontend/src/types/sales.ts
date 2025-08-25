export interface SalesOrderItem {
  id?: number;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  line_total?: number;
  notes?: string;
}

export interface SalesOrder {
  id?: number;
  order_number?: string;
  reference?: string;
  customer: string;
  customer_name?: string;
  customer_email?: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'draft' | 'confirmed' | 'partially_delivered' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  notes?: string;
  internal_notes?: string;
  created_by?: number;
  created_by_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at?: string;
  updated_at?: string;
  items: SalesOrderItem[];
}

export interface SalesOrderListItem {
  id: number;
  order_number: string;
  customer_name: string;
  order_date: string;
  status: SalesOrder['status'];
  priority: SalesOrder['priority'];
  total_amount: number;
  items_count: number;
  created_at: string;
}

export interface SalesOrderCreateUpdate {
  customer: string;
  reference?: string;
  order_date: string;
  expected_delivery_date?: string;
  priority?: SalesOrder['priority'];
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  internal_notes?: string;
  assigned_to?: number;
  items: Omit<SalesOrderItem, 'id' | 'product_name' | 'product_sku' | 'line_total'>[];
}

export interface InvoiceItem {
  id?: number;
  product: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  line_total?: number;
  notes?: string;
}

export interface Invoice {
  id?: number;
  invoice_number?: string;
  reference?: string;
  sales_order?: number;
  sales_order_number?: string;
  customer: string;
  customer_name?: string;
  customer_email?: string;
  invoice_date: string;
  due_date: string;
  payment_terms: 'immediate' | 'net_15' | 'net_30' | 'net_45' | 'net_60';
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  balance_due?: number;
  is_overdue?: boolean;
  notes?: string;
  terms_conditions?: string;
  created_by?: number;
  created_by_name?: string;
  sent_at?: string;
  created_at?: string;
  updated_at?: string;
  items: InvoiceItem[];
}

export interface InvoiceListItem {
  id: number;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  status: Invoice['status'];
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  is_overdue: boolean;
}

export interface InvoiceCreateUpdate {
  sales_order?: number;
  customer: string;
  reference?: string;
  invoice_date: string;
  due_date: string;
  payment_terms?: Invoice['payment_terms'];
  tax_amount?: number;
  discount_amount?: number;
  paid_amount?: number;
  notes?: string;
  terms_conditions?: string;
  items: Omit<InvoiceItem, 'id' | 'product_name' | 'product_sku' | 'line_total'>[];
}

export interface Payment {
  id?: number;
  payment_number?: string;
  reference?: string;
  invoice: number;
  invoice_number?: string;
  customer: string;
  customer_name?: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  transaction_id?: string;
  created_by?: number;
  created_by_name?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentCreateUpdate {
  invoice: number;
  customer: string;
  reference?: string;
  payment_date: string;
  amount: number;
  payment_method: Payment['payment_method'];
  notes?: string;
  transaction_id?: string;
}

export interface SalesStats {
  total_orders: number;
  total_invoices: number;
  total_revenue: number;
  pending_orders: number;
  overdue_invoices: number;
  recent_orders: SalesOrderListItem[];
  recent_invoices: InvoiceListItem[];
}

export interface SalesFilters {
  status?: string;
  priority?: string;
  customer?: string;
  order_date_from?: string;
  order_date_to?: string;
  total_amount_min?: number;
  total_amount_max?: number;
  search?: string;
}

export interface InvoiceFilters {
  status?: string;
  customer?: string;
  sales_order?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  overdue?: boolean;
  search?: string;
}

export interface PaymentFilters {
  payment_method?: string;
  status?: string;
  invoice?: number;
  customer?: string;
  payment_date_from?: string;
  payment_date_to?: string;
  search?: string;
}

// Status and Priority Options
export const SALES_ORDER_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: '#9e9e9e' },
  { value: 'confirmed', label: 'Confirmed', color: '#2196f3' },
  { value: 'partially_delivered', label: 'Partially Delivered', color: '#ff9800' },
  { value: 'delivered', label: 'Delivered', color: '#4caf50' },
  { value: 'cancelled', label: 'Cancelled', color: '#f44336' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#4caf50' },
  { value: 'normal', label: 'Normal', color: '#2196f3' },
  { value: 'high', label: 'High', color: '#ff9800' },
  { value: 'urgent', label: 'Urgent', color: '#f44336' },
];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: '#9e9e9e' },
  { value: 'sent', label: 'Sent', color: '#2196f3' },
  { value: 'paid', label: 'Paid', color: '#4caf50' },
  { value: 'partially_paid', label: 'Partially Paid', color: '#ff9800' },
  { value: 'overdue', label: 'Overdue', color: '#f44336' },
  { value: 'cancelled', label: 'Cancelled', color: '#9e9e9e' },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#ff9800' },
  { value: 'completed', label: 'Completed', color: '#4caf50' },
  { value: 'failed', label: 'Failed', color: '#f44336' },
  { value: 'cancelled', label: 'Cancelled', color: '#9e9e9e' },
];