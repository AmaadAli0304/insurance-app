"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { getMockUser, mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // In a real app, you'd check for a token in localStorage/cookies
    // For this demo, we check session storage for a simulated logged-in role
    try {
      const storedRole = sessionStorage.getItem('userRole') as UserRole;
      if (storedRole) {
        setUser(getMockUser(storedRole));
      }
    } catch (error) {
        console.error("Could not access session storage.");
    } finally {
        setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!loading) {
      if (user && pathname === '/login') {
        router.push('/dashboard');
      } else if (!user && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (role: UserRole) => {
    const mockUser = getMockUser(role);
    setUser(mockUser);
    try {
        sessionStorage.setItem('userRole', role);
    } catch(e) {
        console.error("Could not set user role in session storage.")
    }
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    try {
        sessionStorage.removeItem('userRole');
    } catch(e) {
        console.error("Could not remove user role from session storage.")
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
