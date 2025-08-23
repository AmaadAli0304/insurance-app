
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  loading: boolean;
  login: (user: User, remember?: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let storedUser: User | null = null;
    try {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        storedUser = JSON.parse(sessionUser);
      } else {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          storedUser = JSON.parse(localUser);
        }
      }
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      sessionStorage.removeItem('user');
      localStorage.removeItem('user');
    }
    
    setUser(storedUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
      if (user && isAuthPage) {
        router.push('/dashboard');
      } else if (!user && !isAuthPage) {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (appUser: User, remember: boolean = false) => {
    setUser(appUser);
    try {
      if (remember) {
        localStorage.setItem('user', JSON.stringify(appUser));
      } else {
        sessionStorage.setItem('user', JSON.stringify(appUser));
      }
    } catch (error) {
      console.error("Failed to save user to storage", error);
    }
  };
  
  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    } catch (error) {
       console.error("Failed to remove user from storage", error);
    }
    router.push('/login');
  };

  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout,
  }), [user, loading]);

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
