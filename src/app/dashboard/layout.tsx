
"use client";

import Link from "next/link";
import { MainNav } from "@/app/dashboard/main-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { Logo } from "@/components/logo";
import { Breadcrumb } from "@/app/dashboard/breadcrumb";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarInset } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth-provider";
import { Building, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = useAuth();
  return (
    <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
             <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6 group-data-[collapsible=icon]:justify-center">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground group-data-[state=collapsed]:hidden">
                    <Logo />
                </Link>
                <div className="ml-auto flex items-center gap-2">
                    <div className="group-data-[state=expanded]:hidden hidden md:block">
                        <SidebarTrigger />
                    </div>
                    <div className="group-data-[state=collapsed]:hidden">
                         <SidebarTrigger />
                    </div>
                </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className="md:hidden"/>
                <div className="w-full flex-1">
                    <Breadcrumb />
                </div>
                 {(role === 'Hospital Staff' || role === 'Admin') && user && (
                    <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4" />
                            <span>{user.hospitalName || 'No Hospital'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{user.name}</span>
                        </div>
                    </div>
                )}
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                {children}
            </main>
        </SidebarInset>
      </SidebarProvider>
  );
}
