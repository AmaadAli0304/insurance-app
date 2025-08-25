
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import Cookies from 'js-cookie';
import { mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  loading: boolean;
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock function to "verify" the mock token
const verifyMockToken = (token: string): User | null => {
    if (!token || !token.startsWith('mock-token-for-')) {
        return null;
    }
    const userId = token.replace('mock-token-for-', '');
    const user = mockUsers.find(u => u.uid === userId);
    return user || null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    setUser(null);
    Cookies.remove('token');
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
        const validatedUser = verifyMockToken(token);
        if (validatedUser) {
            setUser(validatedUser);
        } else {
            // Token is invalid, clear it
            setUser(null);
            Cookies.remove('token');
        }
    }
    setLoading(false);
  }, []);
  
  useEffect(() => {
    if (loading) {
      return; 
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (user && isAuthPage) {
      router.push('/dashboard');
    }

    if (!user && !isAuthPage) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = (token: string, userData: User, remember: boolean = false) => {
    const cookieOptions: Cookies.CookieAttributes = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };
    if (remember) {
        cookieOptions.expires = 7; 
    }
    Cookies.set('token', token, cookieOptions);
    setUser(userData);
  };
  
  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout: handleLogout,
  }), [user, loading, handleLogout, login]);

  if (loading && !pathname.startsWith('/login')) {
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
