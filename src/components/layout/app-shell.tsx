import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare, WifiOff, Building2, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { ActivityDrawer } from "@/components/layout/activity-drawer";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationCenter } from "@/components/layout/notification-center";
import { QuickActions } from "@/components/layout/quick-actions";
import {
  AcademicSessionSwitcher,
  AcademicYearSwitcher,
  CampusSwitcher,
  OrganizationSwitcher,
  RoleSwitcher,
} from "@/components/layout/switchers";
import { ThemeToggle, UserMenu } from "@/components/layout/user-menu";
import { AICopilotButton } from "@/components/common/ai-copilot-modal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useOnline } from "@/hooks/useOnline";
import { findNavItem } from "@/lib/nav";

function ShellBreadcrumbs() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const current = findNavItem(pathname);

  return (
    <Breadcrumb className="hidden sm:flex items-center min-w-0">
      <BreadcrumbList className="text-xs font-medium flex items-center gap-1 flex-nowrap min-w-0">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="transition-colors hover:text-primary font-bold text-foreground/80 flex items-center gap-1.5">
              <span>CampusOS 3.0</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {current ? (
          <>
            <BreadcrumbSeparator className="opacity-50 shrink-0" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="font-extrabold text-primary truncate max-w-[180px] md:max-w-[300px] xl:max-w-none">
                {current.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const online = useOnline();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 bg-background flex flex-col w-full overflow-x-hidden">
          {/* Tier 1: Main Application Header (Uncluttered, High contrast, No overlapping elements) */}
          <header className="sticky top-0 z-30 flex flex-col border-b border-border/80 bg-card/98 backdrop-blur-md shadow-2xs w-full transition-all duration-180">
            <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 lg:px-8 xl:px-12 py-2.5 w-full min-w-0">
              
              {/* Left Group: Sidebar Toggle & Breadcrumbs */}
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                <SidebarTrigger aria-label="Toggle sidebar" className="hover:bg-muted rounded-[12px] p-2 transition-colors cursor-pointer text-foreground shrink-0 shadow-2xs border border-border/40" />
                <Separator orientation="vertical" className="h-5 hidden sm:block border-border shrink-0" />
                <ShellBreadcrumbs />
              </div>

              {/* Right Group: Search Bar, Copilot & Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0 justify-end min-w-0">
                <div className="w-[180px] sm:w-[220px] md:w-[280px] lg:w-[320px] xl:w-[380px] transition-all shrink">
                  <GlobalSearch />
                </div>
                
                <AICopilotButton className="h-9 px-2.5 sm:px-3 rounded-[12px] shrink-0 font-bold hidden xs:inline-flex shadow-2xs" />
                
                <div className="hidden lg:block shrink-0">
                  <RoleSwitcher />
                </div>
                
                <div className="hidden sm:block shrink-0">
                  <QuickActions />
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Messages"
                  disabled
                  title="Messages — coming soon"
                  className="rounded-[12px] size-9 shrink-0 hidden md:inline-flex"
                >
                  <MessageSquare className="size-4 text-muted-foreground" />
                </Button>
                
                <NotificationCenter />
                <ActivityDrawer />
                <Separator orientation="vertical" className="h-5 mx-0.5 hidden sm:block border-border shrink-0" />
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
            
            {/* Tier 2: Institution & Academic Context Sub-Header (Isolated to prevent row collision/merging!) */}
            <div className="flex items-center justify-between gap-3 px-3.5 sm:px-6 lg:px-8 xl:px-12 py-1.5 bg-muted/30 border-t border-border/50 w-full overflow-x-auto no-scrollbar text-xs">
              <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                <Building2 className="size-3.5 text-primary shrink-0" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider uppercase">Context:</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
                <OrganizationSwitcher />
                <CampusSwitcher />
                <AcademicYearSwitcher />
                <AcademicSessionSwitcher />
                <div className="lg:hidden shrink-0">
                  <RoleSwitcher />
                </div>
              </div>
            </div>
          </header>

          {!online ? (
            <div className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2 text-xs font-semibold text-warning-foreground w-full">
              <WifiOff className="size-4 text-warning animate-pulse" aria-hidden />
              <span>Offline connection detected. Real-time changes will re-sync upon connection restored.</span>
            </div>
          ) : null}

          {/* Universal Fluid Workspace (Adapts smoothly from mobile to 4K displays) */}
          <main className="flex-1 w-full max-w-none px-3.5 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-20 py-5 sm:py-8 overflow-x-hidden">
            <div className="mx-auto w-full max-w-[2400px] space-y-7 sm:space-y-8 transition-all duration-200 min-w-0">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
