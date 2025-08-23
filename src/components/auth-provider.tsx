
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/lib/types';
import Cookies from 'js-cookie';

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
    let token: string | undefined;
    try {
      token = Cookies.get('token');
      if (token) {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from token", error);
      Cookies.remove('token');
    }
    
    setLoading(false);
  }, []);

  const login = useCallback((token: string, remember: boolean = false) => {
    try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
        Cookies.set('token', token, { 
            expires: remember ? 7 : undefined,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        router.push('/dashboard');
    } catch (error) {
      console.error("Failed to decode token or save to cookie", error);
    }
  }, [router]);
  
  const logout = useCallback(async () => {
    const token = Cookies.get('token');
    setUser(null);
    try {
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      Cookies.remove('token');
    } catch (error) {
       console.error("Failed to logout", error);
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

  if (loading) {
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
