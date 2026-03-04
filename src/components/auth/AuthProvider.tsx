
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (access_token: string) => Promise<void>;
  register: (email: string, password: string, passcode: string, name?: string, userType?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      await api.post('/auth/login', { email, password });
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, passcode: string, name?: string, userType?: string)  => {
    try {
      await api.post('/auth/register', {
        email,
        password,
        passcode,
        name,
        userType,
      });
      // After successful register, load the new user session
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/login');
    } catch (error) {
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get('/auth/user');
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = async (access_token: string) => {
    try {
      await api.post('/auth/google-login', {
        access_token,
        callback_url: window.location.origin,
      })
      await refreshUser();
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const value = {
    user,
    isLoading,
    login,
    googleLogin,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
