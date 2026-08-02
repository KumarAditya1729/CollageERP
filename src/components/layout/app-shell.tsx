import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare, WifiOff } from "lucide-react";
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
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList className="text-xs font-medium">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="transition-colors hover:text-primary">CampusOS 3.0</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {current ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">{current.title}</BreadcrumbPage>
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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background flex flex-col">
          <header className="sticky top-0 z-30 flex flex-col gap-2 border-b border-border bg-card px-6 py-2.5 shadow-2xs transition-all duration-180">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger aria-label="Toggle sidebar" className="hover:bg-muted rounded-[12px] p-2 transition-colors cursor-pointer text-foreground" />
                <Separator orientation="vertical" className="mr-1 hidden h-5 sm:block border-border" />
                <div className="hidden lg:flex lg:items-center lg:gap-1.5">
                  <OrganizationSwitcher />
                  <CampusSwitcher />
                  <AcademicYearSwitcher />
                  <AcademicSessionSwitcher />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>
                <AICopilotButton className="hidden sm:inline-flex h-9" />
                <RoleSwitcher className="hidden xl:inline-flex" />
                <QuickActions />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Messages"
                  disabled
                  title="Messages — coming soon"
                  className="rounded-[12px] h-9 w-9"
                >
                  <MessageSquare className="size-4.5 text-muted-foreground" />
                </Button>
                <NotificationCenter />
                <ActivityDrawer />
                <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block border-border" />
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/40">
              <ShellBreadcrumbs />
              <div className="sm:hidden w-full">
                <GlobalSearch />
              </div>
            </div>
          </header>

          {!online ? (
            <div className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/10 px-4 py-2 text-xs font-medium text-warning-foreground">
              <WifiOff className="size-4 text-warning" aria-hidden />
              You are offline. Changes will fail to save until the connection returns.
            </div>
          ) : null}

          <main className="flex-1 px-6 py-8 sm:px-8 lg:px-12">
            <div className="mx-auto w-full max-w-[1550px] space-y-7 transition-all duration-180">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
