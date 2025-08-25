export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  product_type: 'physical' | 'digital' | 'service';
  category_name: string;
  category_color: string;
  selling_price: string;
  current_stock: number;
  minimum_stock: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  stock_status_display: string;
  track_inventory: boolean;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  product_type: 'physical' | 'digital' | 'service';
  category: string;
  category_name: string;
  cost_price: string;
  selling_price: string;
  margin_percentage: string;
  profit_margin: string;
  track_inventory: boolean;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  weight?: string;
  dimensions?: string;
  image?: string;
  is_active: boolean;
  is_featured: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  stock_movements_count: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCreateUpdate {
  name: string;
  description?: string;
  barcode?: string;
  product_type: 'physical' | 'digital' | 'service';
  category: string;
  cost_price: string;
  selling_price: string;
  track_inventory: boolean;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  weight?: string;
  dimensions?: string;
  image?: File;
  is_active: boolean;
  is_featured: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tax_number?: string;
  payment_terms?: string;
  is_active: boolean;
  products_count: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'return';
  movement_type_display: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_number?: string;
  notes?: string;
  created_by_name: string;
  created_at: string;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_inventory_value: string;
  categories_count: number;
  suppliers_count: number;
}

export interface StockAdjustment {
  product_id: string;
  new_quantity: number;
  notes?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}