import api from './api';
import {
  Category,
  Product,
  ProductListItem,
  ProductCreateUpdate,
  Supplier,
  StockMovement,
  ProductStats,
  StockAdjustment,
  PaginatedResponse,
} from '../types/inventory';

// Categories API
export const categoryApi = {
  list: () => api.get<PaginatedResponse<Category>>('/inventory/categories/'),
  get: (id: string) => api.get<Category>(`/inventory/categories/${id}/`),
  create: (data: Omit<Category, 'id' | 'product_count' | 'created_at' | 'updated_at'>) =>
    api.post<Category>('/inventory/categories/', data),
  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/inventory/categories/${id}/`, data),
  delete: (id: string) => api.delete(`/inventory/categories/${id}/`),
};

// Products API
export const productApi = {
  list: (params?: {
    category?: string;
    type?: string;
    stock_status?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get<PaginatedResponse<ProductListItem>>(
      `/inventory/products/?${searchParams.toString()}`
    );
  },
  get: (id: string) => api.get<Product>(`/inventory/products/${id}/`),
  create: (data: ProductCreateUpdate) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    return api.post<Product>('/inventory/products/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: string, data: Partial<ProductCreateUpdate>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    return api.patch<Product>(`/inventory/products/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/inventory/products/${id}/`),
  stats: () => api.get<ProductStats>('/inventory/products/stats/'),
  lowStock: () => api.get<ProductListItem[]>('/inventory/products/low-stock/'),
};

// Stock Management API
export const stockApi = {
  adjust: (data: StockAdjustment) => 
    api.post('/inventory/stock/adjust/', data),
  movements: (params?: { product?: string; type?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get<PaginatedResponse<StockMovement>>(
      `/inventory/stock/movements/?${searchParams.toString()}`
    );
  },
};

// Suppliers API
export const supplierApi = {
  list: (params?: { search?: string; is_active?: boolean; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get<PaginatedResponse<Supplier>>(
      `/inventory/suppliers/?${searchParams.toString()}`
    );
  },
  get: (id: string) => api.get<Supplier>(`/inventory/suppliers/${id}/`),
  create: (data: Omit<Supplier, 'id' | 'products_count' | 'created_by_name' | 'created_at' | 'updated_at'>) =>
    api.post<Supplier>('/inventory/suppliers/', data),
  update: (id: string, data: Partial<Supplier>) =>
    api.patch<Supplier>(`/inventory/suppliers/${id}/`, data),
  delete: (id: string) => api.delete(`/inventory/suppliers/${id}/`),
};

// Default export for convenience
const inventoryApi = {
  categories: categoryApi,
  products: productApi,
  stock: stockApi,
  suppliers: supplierApi,
};

export default inventoryApi;