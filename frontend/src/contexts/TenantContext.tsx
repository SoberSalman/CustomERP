import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import apiService, { Tenant } from '../services/api';
import { useAuth } from './AuthContext';

interface TenantState {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isLoading: boolean;
  error: string | null;
}

type TenantAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_TENANT'; payload: Tenant | null }
  | { type: 'SET_USER_TENANTS'; payload: Tenant[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

interface TenantContextType extends TenantState {
  loadUserTenants: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  createTenant: (tenantData: Partial<Tenant>) => Promise<Tenant>;
  clearError: () => void;
}

const initialState: TenantState = {
  currentTenant: null,
  userTenants: [],
  isLoading: false,
  error: null,
};

const tenantReducer = (state: TenantState, action: TenantAction): TenantState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_CURRENT_TENANT':
      return {
        ...state,
        currentTenant: action.payload,
      };
    case 'SET_USER_TENANTS':
      return {
        ...state,
        userTenants: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load user tenants when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUserTenants();
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [isAuthenticated]);

  // Try to load current tenant from localStorage and API
  useEffect(() => {
    if (isAuthenticated && state.userTenants.length > 0) {
      const storedTenantId = localStorage.getItem('current_tenant_id');
      
      if (storedTenantId) {
        const storedTenant = state.userTenants.find(t => t.id === storedTenantId);
        if (storedTenant) {
          dispatch({ type: 'SET_CURRENT_TENANT', payload: storedTenant });
          return;
        }
      }
      
      // If no valid stored tenant, use the first available tenant
      if (!state.currentTenant && state.userTenants.length > 0) {
        const firstTenant = state.userTenants[0];
        localStorage.setItem('current_tenant_id', firstTenant.id);
        dispatch({ type: 'SET_CURRENT_TENANT', payload: firstTenant });
      }
    }
  }, [isAuthenticated, state.userTenants, state.currentTenant]);

  const loadUserTenants = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const tenants = await apiService.getUserTenants();
      dispatch({ type: 'SET_USER_TENANTS', payload: tenants });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load tenants';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.switchTenant(tenantId);
      
      // Store in localStorage
      localStorage.setItem('current_tenant_id', tenantId);
      
      // Update current tenant
      dispatch({ type: 'SET_CURRENT_TENANT', payload: response.tenant });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to switch tenant';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createTenant = async (tenantData: Partial<Tenant>): Promise<Tenant> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const newTenant = await apiService.createTenant(tenantData);
      
      // Reload user tenants to include the new one
      await loadUserTenants();
      
      // Switch to the new tenant
      localStorage.setItem('current_tenant_id', newTenant.id);
      dispatch({ type: 'SET_CURRENT_TENANT', payload: newTenant });
      
      return newTenant;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create tenant';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: TenantContextType = {
    ...state,
    loadUserTenants,
    switchTenant,
    createTenant,
    clearError,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};