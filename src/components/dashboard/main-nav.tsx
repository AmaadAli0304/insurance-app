"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, Factory, FileText, LayoutDashboard, Stethoscope, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';

export function MainNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const routes = {
    Admin: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/hospitals', label: 'Hospitals', icon: Building },
      { href: '/dashboard/insurance', label: 'Insurance Co.', icon: Factory },
    ],
    'Hospital Admin': [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/staff', label: 'Staff', icon: User },
      { href: '/dashboard/claims', label: 'Claims', icon: FileText },
    ],
    'Hospital Staff': [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/patients/new', label: 'Add Patient', icon: Users },
      { href: '/dashboard/claims/new', label: 'Submit Claim', icon: FileText },
    ],
    'Insurance Company Admin': [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/claims', label: 'Claims', icon: FileText },
      { href: '/dashboard/plans', label: 'Insurance Plans', icon: Stethoscope },
    ],
  };

  const currentRoutes = role ? routes[role] : [];

  return (
    <nav className="flex flex-col items-start gap-2 px-2 text-sm font-medium">
      {currentRoutes.map((route, index) => {
        const Icon = route.icon;
        return (
          <Link
            key={index}
            href={route.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-primary-foreground hover:bg-sidebar-accent',
              pathname === route.href && 'bg-sidebar-accent text-primary-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
