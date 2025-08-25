
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = useCallback(() => {
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    // Since we have no cookie, we are always unauthenticated on load.
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

  const login = (userData: User) => {
    setUser(userData);
    router.push('/dashboard');
  };
  
  const value = useMemo(() => ({
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout: handleLogout,
  }), [user, loading, handleLogout]);

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
