
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, Factory, FileText, LayoutDashboard, Stethoscope, User, Users, HandCoins, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';

export function MainNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const routes = {
    Admin: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/hospitals', label: 'Hospitals', icon: Building },
      { href: '/dashboard/companies', label: 'Companies', icon: Factory },
    ],
    'Hospital Admin': [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/staff', label: 'Staff', icon: User },
      { href: '/dashboard/requests', label: 'Staffing Requests', icon: FileText },
    ],
    'Hospital Staff': [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/pre-auths', label: 'Pre-Auth Requests', icon: FileText },
      { href: '/dashboard/claims', label: 'Claim Tracker', icon: HandCoins },
    ],
    'Company Admin': [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/company-hospitals', label: 'Hospitals', icon: Building },
      { href: '/dashboard/companies', label: 'Companies', icon: Factory },
      { href: '/dashboard/tpas', label: 'TPAs', icon: Briefcase },
      { href: '/dashboard/staff', label: 'Staff', icon: Users },
      { href: '/dashboard/claims', label: 'Claim Tracker', icon: HandCoins },
      { href: '/dashboard/policies', label: 'Policies', icon: Stethoscope },
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
              pathname.startsWith(route.href) && route.href !== '/dashboard' ? 'bg-sidebar-accent text-primary-foreground' : pathname === '/dashboard' && route.href === '/dashboard' ? 'bg-sidebar-accent text-primary-foreground' : ''
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
