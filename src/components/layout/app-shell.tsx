import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare, WifiOff, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

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
import { cn } from "@/lib/utils";

function ShellBreadcrumbs() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  const current = findNavItem(pathname);

  return (
    <Breadcrumb className="hidden sm:block min-w-0">
      <BreadcrumbList className="text-xs font-medium flex items-center gap-1 flex-wrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="transition-colors hover:text-primary whitespace-nowrap font-bold">CampusOS 3.0</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {current ? (
          <>
            <BreadcrumbSeparator className="opacity-50" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="font-bold text-foreground truncate max-w-[200px] sm:max-w-[400px]">{current.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const online = useOnline();
  const [showMobileSwitchers, setShowMobileSwitchers] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 bg-background flex flex-col w-full overflow-x-hidden">
          <header className="sticky top-0 z-30 flex flex-col gap-2 border-b border-border/80 bg-card/95 backdrop-blur-md px-3 sm:px-6 lg:px-8 xl:px-12 py-2.5 shadow-2xs transition-all duration-180 w-full">
            <div className="flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
              {/* Left Group: Sidebar toggle & Switchers */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <SidebarTrigger aria-label="Toggle sidebar" className="hover:bg-muted rounded-[12px] p-2 transition-colors cursor-pointer text-foreground shrink-0" />
                <Separator orientation="vertical" className="mr-0.5 hidden h-5 sm:block border-border" />
                
                {/* Desktop Switcher Bar */}
                <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-[600px] xl:max-w-none no-scrollbar py-0.5">
                  <OrganizationSwitcher />
                  <CampusSwitcher />
                  <AcademicYearSwitcher />
                  <AcademicSessionSwitcher />
                </div>

                {/* Mobile/Tablet Switcher Toggle Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileSwitchers(!showMobileSwitchers)}
                  className="lg:hidden h-8 px-2.5 text-[11px] rounded-[10px] font-mono gap-1 text-muted-foreground border-border/70"
                  title="Toggle institution & academic year filters"
                >
                  <SlidersHorizontal className="size-3 text-primary" />
                  <span className="hidden xs:inline">Institution</span>
                </Button>
              </div>

              {/* Right Group: Search, Copilot & Utilities */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0 justify-end flex-1">
                <div className="hidden md:block flex-1 max-w-[320px] lg:max-w-[400px]">
                  <GlobalSearch />
                </div>
                
                <AICopilotButton className="h-8 sm:h-9 px-2 sm:px-3 rounded-[12px] shrink-0 font-bold" />
                
                <div className="hidden xl:block shrink-0">
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
                  className="rounded-[12px] size-8 sm:size-9 shrink-0 hidden xs:inline-flex"
                >
                  <MessageSquare className="size-4 text-muted-foreground" />
                </Button>
                
                <NotificationCenter />
                <ActivityDrawer />
                <Separator orientation="vertical" className="h-5 mx-0.5 hidden sm:block border-border" />
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
            
            {/* Expandable Institution Switcher drawer for Mobile & Tablets */}
            {showMobileSwitchers && (
              <div className="lg:hidden flex flex-wrap items-center gap-2 pt-2.5 pb-1 border-t border-border/60 animate-in slide-in-from-top duration-150">
                <OrganizationSwitcher />
                <CampusSwitcher />
                <AcademicYearSwitcher />
                <AcademicSessionSwitcher />
                <div className="xl:hidden">
                  <RoleSwitcher />
                </div>
              </div>
            )}
            
            {/* Secondary Row for Breadcrumbs & Mobile Search */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 w-full min-w-0">
              <ShellBreadcrumbs />
              <div className="md:hidden w-full pt-0.5">
                <GlobalSearch />
              </div>
            </div>
          </header>

          {!online ? (
            <div className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2 text-xs font-semibold text-warning-foreground w-full">
              <WifiOff className="size-4 text-warning animate-pulse" aria-hidden />
              <span>Offline connection detected. Real-time changes will re-sync upon connection restored.</span>
            </div>
          ) : null}

          {/* Ultra-Fluid Responsive Workspace Container (Adapts from 320px mobile to 3840px 4K monitor) */}
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
