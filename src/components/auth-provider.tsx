
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';
import { getMockUserByEmail, mockUsers } from '@/lib/mock-data';

// This is a simplified, mock auth provider for demonstration purposes.
// In a real application, this would be replaced with a proper authentication service.

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A simple in-memory session storage.
let memoryUser: User | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(memoryUser);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Simulate loading the user on initial mount
  useEffect(() => {
    // In a real app, you might check a token from localStorage here.
    // For this mock, we just use the in-memory user.
    setUser(memoryUser);
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

  const login = (email: string) => {
    setLoading(true);
    const appUser = getMockUserByEmail(email);
    if (appUser) {
        memoryUser = appUser;
        setUser(appUser);
    } else {
        // For demo purposes, if user not found, we can default to the first mock user
        console.warn(`User with email ${email} not found in mock data. Defaulting to admin.`);
        memoryUser = mockUsers[0];
        setUser(mockUsers[0]);
    }
    setLoading(false);
  };
  
  const logout = () => {
    memoryUser = null;
    setUser(null);
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
