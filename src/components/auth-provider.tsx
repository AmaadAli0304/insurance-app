
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  loading: boolean;
  login: (token: string, remember?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let token: string | null = null;
    try {
      token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from token", error);
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      if (user && isAuthPage) {
        router.push('/dashboard');
      } else if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const login = useCallback((token: string, remember: boolean = false) => {
    try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        if (remember) {
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('token', token);
        }
    } catch (error) {
      console.error("Failed to decode token or save to storage", error);
    }
  }, []);
  
  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    } catch (error) {
       console.error("Failed to remove token from storage", error);
    }
    router.push('/login');
  }, [router]);

  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout,
  }), [user, loading, login, logout]);

  if (loading && !user && pathname !== '/login' && pathname !== '/signup') {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
