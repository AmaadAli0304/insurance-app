
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
    
    // Optimistically update UI
    setUser(null);
    Cookies.remove('token');

    // Inform the server to blacklist the token
    if (token) {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to call logout API", error);
        }
    }
    
    // Redirect to login page
    router.push('/login');
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
            // Token is invalid or blacklisted, clear it
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
  
  // This effect handles redirection after the initial auth check is complete.
  useEffect(() => {
    if (loading) {
      return; // Don't do anything while auth status is being checked
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isPublicPage = isAuthPage || pathname === '/';

    if (user && isAuthPage) {
      // User is logged in and on an auth page, redirect to dashboard
      router.push('/dashboard');
    }

    if (!user && !isPublicPage) {
      // User is not logged in and not on a public page, redirect to login
      router.push('/login');
    }
  }, [user, loading, pathname, router]);


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
    router.push('/dashboard');
  };
  
  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout: handleLogout,
  }), [user, loading, handleLogout, login]);


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
