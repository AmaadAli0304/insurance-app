
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import Cookies from 'js-cookie';
import { verifyToken } from '@/app/login/actions';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  loading: boolean;
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    const token = Cookies.get('token');
    setUser(null);
    Cookies.remove('token');
    
    if (token) {
        fetch('/api/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(error => console.error("Failed to call logout API", error));
    }
    // Hard reload to ensure server-side state is cleared
    window.location.href = '/login';
  }, []);


  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = Cookies.get('token');
      if (token) {
        try {
          const { isValid, user: validatedUser } = await verifyToken(token);
          if (isValid && validatedUser) {
            setUser(validatedUser);
          } else {
            setUser(null);
            Cookies.remove('token');
          }
        } catch (error) {
          console.error("Failed to verify token", error);
          setUser(null);
          Cookies.remove('token');
        }
      }
      setLoading(false);
    };
    checkAuthStatus();
  }, []);

  const login = (token: string, user: User, remember: boolean = false) => {
    const cookieOptions: Cookies.CookieAttributes = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };
    if (remember) {
        cookieOptions.expires = 7; // Expires in 7 days
    }
    Cookies.set('token', token, cookieOptions);
    setUser(user);
    // Redirection is now handled by the login page via window.location.href
  };

  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout: handleLogout,
  }), [user, loading, login, handleLogout]);

  
  // This effect handles redirection logic for already authenticated users
  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }
    
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (!user && !isAuthPage) {
      // User is not logged in and not on an auth page, redirect to login
      // This is handled by middleware, but as a fallback:
      router.push('/login');
    }
    
    if (user && isAuthPage) {
        // User is logged in and on an auth page, redirect to dashboard
        router.push('/dashboard');
    }

  }, [user, loading, pathname, router]);


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
