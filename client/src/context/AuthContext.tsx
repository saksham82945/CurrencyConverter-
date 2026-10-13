import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDTO } from '@shared/types/account.types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
  upgradeKyc: () => Promise<void>;
  quickLogin: (demoUser: 'darren' | 'admin' | 'alice' | 'bob') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(() => {
    const cached = localStorage.getItem('bml_user') || localStorage.getItem('nexapay_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bml_token') || localStorage.getItem('nexapay_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('bml_token') || localStorage.getItem('nexapay_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { user: refreshed } = await authApi.me();
      setUser(refreshed);
      localStorage.setItem('bml_user', JSON.stringify(refreshed));
    } catch {
      localStorage.removeItem('bml_token');
      localStorage.removeItem('bml_user');
      localStorage.removeItem('nexapay_token');
      localStorage.removeItem('nexapay_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('bml_token');
      localStorage.removeItem('bml_user');
      localStorage.removeItem('nexapay_token');
      localStorage.removeItem('nexapay_user');
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('bml_token', data.accessToken);
    localStorage.setItem('bml_user', JSON.stringify(data.user));
  };

  const register = async (fullName: string, email: string, password: string) => {
    const data = await authApi.register(fullName, email, password);
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('bml_token', data.accessToken);
    localStorage.setItem('bml_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('bml_token');
      localStorage.removeItem('bml_user');
      localStorage.removeItem('nexapay_token');
      localStorage.removeItem('nexapay_user');
    }
  };

  const updatePin = async (pin: string) => {
    await authApi.updatePin(pin);
    if (user) {
      const updated = { ...user, hasSimulatedPin: true };
      setUser(updated);
      localStorage.setItem('bml_user', JSON.stringify(updated));
    }
  };

  const upgradeKyc = async () => {
    const res = await authApi.upgradeKyc();
    setUser(res.user);
    localStorage.setItem('bml_user', JSON.stringify(res.user));
  };

  const quickLogin = async (demoUser: 'darren' | 'admin' | 'alice' | 'bob') => {
    if (demoUser === 'darren') {
      await login('forextradingplatformfxe@gmail.com', 'Darren Trader');
    } else if (demoUser === 'admin') {
      await login('admin@bankofmaldives.com.mv', 'AdminPassword123!');
    } else if (demoUser === 'alice') {
      await login('alice@bankofmaldives.com.mv', 'Password123!');
    } else if (demoUser === 'bob') {
      await login('bob@bankofmaldives.com.mv', 'Password123!');
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
        updatePin,
        upgradeKyc,
        quickLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
