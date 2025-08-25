import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  legal_name: string;
  email: string;
  primary_color: string;
  secondary_color: string;
  currency: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        
        // Add tenant ID header if available
        const tenantId = localStorage.getItem('current_tenant_id');
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth data and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('current_tenant_id');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/auth/login/', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/auth/register/', userData);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/auth/logout/');
  }

  async getUserProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/auth/profile/');
    return response.data;
  }

  // Tenant endpoints
  async getTenants(): Promise<Tenant[]> {
    const response = await this.api.get<Tenant[]>('/tenants/');
    return response.data;
  }

  async createTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const response = await this.api.post<Tenant>('/tenants/', tenantData);
    return response.data;
  }

  async getCurrentTenant(): Promise<Tenant> {
    const response = await this.api.get<Tenant>('/tenants/current/');
    return response.data;
  }

  async switchTenant(tenantId: string): Promise<{ tenant: Tenant }> {
    const response = await this.api.post<{ tenant: Tenant }>('/tenants/switch/', {
      tenant_id: tenantId,
    });
    return response.data;
  }

  async getUserTenants(): Promise<Tenant[]> {
    const response = await this.api.get<Tenant[]>('/tenants/user-tenants/');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await this.api.get<{ status: string; version: string }>('/health/');
    return response.data;
  }

  // Generic HTTP methods for direct API access
  async get<T = any>(url: string, config?: any) {
    return this.api.get<T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any) {
    return this.api.post<T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any) {
    return this.api.patch<T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: any) {
    return this.api.delete<T>(url, config);
  }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService;