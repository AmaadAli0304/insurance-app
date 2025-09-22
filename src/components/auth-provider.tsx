
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';

// Helper to create role-specific storage keys
const getUserKey = (role: UserRole) => `user_${role.replace(' ', '_')}`;
const getTokenKey = (role: UserRole) => `token_${role.replace(' ', '_')}`;

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const getRoleFromPath = (path: string): UserRole | null => {
    if (path.includes('/admin')) return 'Admin';
    if (path.includes('/company-admin') || path.startsWith('/dashboard/companies')) return 'Company Admin';
    if (path.includes('/hospital-staff') || path.startsWith('/dashboard/patients')) return 'Hospital Staff';
    // Fallback for generic dashboard pages
    if (path.startsWith('/dashboard')) {
        // This part is tricky without a clear role in the URL.
        // We might need to check localStorage for any logged-in user.
        const roles: UserRole[] = ['Company Admin', 'Hospital Staff', 'Admin'];
        for (const r of roles) {
            if (localStorage.getItem(getUserKey(r))) {
                return r;
            }
        }
    }
    return null;
  }

  useEffect(() => {
    const currentRole = getRoleFromPath(pathname);
    setRole(currentRole);

    if (currentRole) {
      try {
        const storedUser = localStorage.getItem(getUserKey(currentRole));
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setUser(null);
      }
    } else {
        setUser(null);
    }
    setLoading(false);
  }, [pathname]);

  const login = (userData: User, token: string) => {
    localStorage.setItem(getUserKey(userData.role), JSON.stringify(userData));
    localStorage.setItem(getTokenKey(userData.role), token);
    setUser(userData);
    setRole(userData.role);
    router.push('/dashboard');
  };
  
  const logout = useCallback(() => {
    const currentRole = role || getRoleFromPath(pathname);
    if(currentRole){
      localStorage.removeItem(getUserKey(currentRole));
      localStorage.removeItem(getTokenKey(currentRole));
    }
    setUser(null);
    setRole(null);
    const loginPath = currentRole ? `/login/${currentRole.toLowerCase().replace(' ', '-')}` : '/login/company-admin';
    router.push(loginPath);
  }, [role, pathname, router]);
  
  const value = useMemo(() => ({
    user,
    role,
    loading,
    login,
    logout,
  }), [user, role, loading, logout]);

  // The loading UI prevents flicker during initial render and role detection.
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
