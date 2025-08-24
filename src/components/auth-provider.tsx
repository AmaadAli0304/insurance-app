
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

  const handleLogout = useCallback(async () => {
    const token = Cookies.get('token');
    setUser(null);
    Cookies.remove('token'); // Remove cookie immediately
    
    try {
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
       console.error("Failed to call logout API", error);
    } finally {
      router.push('/login');
    }
  }, [router]);


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

  const login = useCallback((token: string, user: User, remember: boolean = false) => {
    try {
        setUser(user);
        const cookieOptions: Cookies.CookieAttributes = {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        };
        if (remember) {
            cookieOptions.expires = 7; // Expires in 7 days
        }
        Cookies.set('token', token, cookieOptions);
        router.push('/dashboard');
    } catch (error) {
      console.error("Failed to set user or save to cookie", error);
      // Fallback to login page if something goes wrong
      router.push('/login');
    }
  }, [router]);

  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout: handleLogout,
  }), [user, loading, login, handleLogout]);

  // If we are not loading and there's no user, and we are not on an auth page, redirect to login
  useEffect(() => {
      if (!loading && !user) {
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
        if (!isAuthPage) {
            router.push('/login');
        }
      }
      if (!loading && user) {
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
        if (isAuthPage) {
          router.push('/dashboard');
        }
      }
  }, [loading, user, pathname, router]);

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
