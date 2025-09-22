
"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';

// Helper to create role-specific storage keys
const getUserKey = (role: UserRole) => `user_${role.replace(' ', '_')}`;
const getTokenKey = (role: UserRole) => `token_${role.replace(' ', '_')}`;
const LAST_ACTIVE_ROLE_KEY = 'last_active_role';


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

  const getRoleFromPath = useCallback((path: string): UserRole | null => {
    // Specific dashboard pages for roles
    if (path.startsWith('/dashboard/companies') || path.startsWith('/dashboard/company-hospitals') || path.startsWith('/dashboard/tpas') || path.startsWith('/dashboard/staff') || path.startsWith('/dashboard/invoices') || path.startsWith('/dashboard/attendance')) return 'Company Admin';
    if (path.startsWith('/dashboard/patients') || path.startsWith('/dashboard/pre-auths') || path.startsWith('/dashboard/claims')) return 'Hospital Staff';
    if (path.startsWith('/dashboard/doctors') || path.startsWith('/dashboard/import') || path.startsWith('/dashboard/activity-log')) {
        // These can be accessed by both Admin and Company Admin
        const lastRole = localStorage.getItem(LAST_ACTIVE_ROLE_KEY) as UserRole;
        if(lastRole === 'Admin' || lastRole === 'Company Admin') return lastRole;
    }
    
    // Login pages
    if (path.includes('/login/admin')) return 'Admin';
    if (path.includes('/login/company-admin')) return 'Company Admin';
    if (path.includes('/login/hospital-staff')) return 'Hospital Staff';
    
    // Fallback for the main dashboard page
    if (path === '/dashboard') {
        const lastRole = localStorage.getItem(LAST_ACTIVE_ROLE_KEY) as UserRole;
        if (lastRole && localStorage.getItem(getUserKey(lastRole))) {
            return lastRole;
        }
        // If no last active role, check for any logged-in user
        const roles: UserRole[] = ['Company Admin', 'Hospital Staff', 'Admin'];
        for (const r of roles) {
            if (localStorage.getItem(getUserKey(r))) {
                return r;
            }
        }
    }

    return null;
  }, []);

  useEffect(() => {
    const currentRole = getRoleFromPath(pathname);
    
    if (currentRole) {
      try {
        const storedUser = localStorage.getItem(getUserKey(currentRole));
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setRole(currentRole);
          localStorage.setItem(LAST_ACTIVE_ROLE_KEY, currentRole);
        } else {
          // If no user for current path role, clear user state
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setUser(null);
        setRole(null);
      }
    } else {
        setUser(null);
        setRole(null);
    }
    setLoading(false);
  }, [pathname, getRoleFromPath]);

  const login = (userData: User, token: string) => {
    localStorage.setItem(getUserKey(userData.role), JSON.stringify(userData));
    localStorage.setItem(getTokenKey(userData.role), token);
    localStorage.setItem(LAST_ACTIVE_ROLE_KEY, userData.role);
    setUser(userData);
    setRole(userData.role);
    router.push('/dashboard');
  };
  
  const logout = useCallback(() => {
    const currentRole = role || getRoleFromPath(pathname);
    if(currentRole){
      localStorage.removeItem(getUserKey(currentRole));
      localStorage.removeItem(getTokenKey(currentRole));
      localStorage.removeItem(LAST_ACTIVE_ROLE_KEY);
    }
    setUser(null);
    setRole(null);
    // Redirect to a neutral login page or a default one
    router.push('/login');
  }, [role, pathname, router, getRoleFromPath]);
  
  const value = useMemo(() => ({
    user,
    role,
    loading,
    login,
    logout,
  }), [user, role, loading, logout]);

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
