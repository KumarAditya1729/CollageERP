import { Link, useRouterState } from "@tanstack/react-router";
import { Clock, GraduationCap, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAccess } from "@/hooks/useAccess";
import { allNavItems, navGroups, type NavItem } from "@/lib/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const PIN_KEY = "campusos.pins";
const RECENT_KEY = "campusos.recents";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { can, tenant } = useAccess();
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  const [pins, setPins] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    setPins(JSON.parse(window.localStorage.getItem(PIN_KEY) ?? "[]"));
    setRecents(JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]"));
  }, []);

  useEffect(() => {
    if (!allNavItems.some((item) => item.to === pathname)) return;
    setRecents((prev) => {
      const next = [pathname, ...prev.filter((entry) => entry !== pathname)].slice(0, 5);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, [pathname]);

  const togglePin = (to: string) =>
    setPins((prev) => {
      const next = prev.includes(to) ? prev.filter((entry) => entry !== to) : [...prev, to];
      window.localStorage.setItem(PIN_KEY, JSON.stringify(next));
      return next;
    });

  const visible = (item: NavItem) => {
    if (item.permission) return can(item.permission);
    if (item.anyPermission) return item.anyPermission.some(can);
    return true;
  };

  const pinnedItems = useMemo(
    () => allNavItems.filter((item) => pins.includes(item.to) && visible(item)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pins, can],
  );
  const recentItems = useMemo(
    () =>
      recents
        .map((to) => allNavItems.find((item) => item.to === to))
        .filter((item): item is NavItem => Boolean(item) && visible(item!))
        .filter((item) => !pins.includes(item.to)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recents, pins, can],
  );

  const renderItem = (item: NavItem, options?: { pinnable?: boolean }) => (
    <SidebarMenuItem key={item.to}>
      <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.title}>
        <Link to={item.to}>
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {options?.pinnable && !collapsed ? (
        <SidebarMenuAction
          onClick={() => togglePin(item.to)}
          aria-label={pins.includes(item.to) ? `Unpin ${item.title}` : `Pin ${item.title}`}
          showOnHover={!pins.includes(item.to)}
        >
          <Star className={cn("size-3.5", pins.includes(item.to) && "fill-current text-primary")} />
        </SidebarMenuAction>
      ) : null}
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">CampusOS</p>
              <p className="truncate text-xs text-muted-foreground">
                {tenant?.name ?? "No college"}
              </p>
            </div>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {pinnedItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Star className="mr-1.5 size-3" /> Pinned
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pinnedItems.map((item) => renderItem(item, { pinnable: true }))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {navGroups.map((group) => {
          const items = group.items.filter(visible);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => renderItem(item, { pinnable: true }))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {recentItems.length > 0 && !collapsed ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Clock className="mr-1.5 size-3" /> Recently visited
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{recentItems.map((item) => renderItem(item))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}
