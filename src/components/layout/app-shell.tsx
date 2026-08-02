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
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">CampusOS</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {current ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current.title}</BreadcrumbPage>
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
        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-30 flex flex-col gap-2 border-b border-border/40 bg-background/70 px-4 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <Separator orientation="vertical" className="mr-1 hidden h-5 sm:block" />
              <div className="hidden lg:flex lg:items-center lg:gap-1">
                <OrganizationSwitcher />
                <CampusSwitcher />
                <AcademicYearSwitcher />
                <AcademicSessionSwitcher />
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="hidden sm:block">
                  <GlobalSearch />
                </div>
                <RoleSwitcher className="hidden xl:inline-flex" />
                <QuickActions />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Messages"
                  disabled
                  title="Messages — coming soon"
                >
                  <MessageSquare className="size-4.5" />
                </Button>
                <NotificationCenter />
                <ActivityDrawer />
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <ShellBreadcrumbs />
              <div className="sm:hidden">
                <GlobalSearch />
              </div>
            </div>
          </header>

          {!online ? (
            <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2 text-sm text-muted-foreground">
              <WifiOff className="size-4" aria-hidden />
              You are offline. Changes will fail to save until the connection returns.
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
