import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import apiService, { User, LoginRequest, RegisterRequest } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token },
          });
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await apiService.login(credentials);
      
      // Store in localStorage
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await apiService.register(userData);
      
      // Store in localStorage
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear localStorage regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('current_tenant_id');
      
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};