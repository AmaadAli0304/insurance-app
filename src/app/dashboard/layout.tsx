
"use client";

import Link from "next/link";
import { MainNav } from "@/components/dashboard/main-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarInset, useSidebar } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    return null; // or a loading spinner, though AuthProvider handles this
  }

  const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
    const { isMobile, open } = useSidebar();
    return (
      <>
        <Sidebar collapsible={isMobile ? 'offcanvas' : 'icon'}>
          <SidebarHeader>
            <div className="flex h-14 items-center border-b border-sidebar-border px-4 lg:h-[60px] lg:px-6 group-data-[state=expanded]:justify-between">
                <div className="group-data-[state=collapsed]:w-full group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
                    <SidebarTrigger className="group-data-[state=expanded]:hidden" />
                </div>
                <div className="flex items-center gap-2 group-data-[state=collapsed]:hidden">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                        <Logo />
                    </Link>
                </div>
                <div className="group-data-[state=collapsed]:hidden">
                    <SidebarTrigger />
                </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className="md:hidden"/>
                <div className="w-full flex-1">
                    <Breadcrumb />
                </div>
                <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
                {children}
            </main>
        </SidebarInset>
      </>
    )
  }

  return (
      <SidebarProvider>
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </SidebarProvider>
  );
}
