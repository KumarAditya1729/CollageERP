import { Link, useRouterState } from "@tanstack/react-router";
import { Clock, GraduationCap, Star, ChevronRight, FolderOpen } from "lucide-react";
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
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { AICopilotButton } from "@/components/common/ai-copilot-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PIN_KEY = "campusos.pins";
const RECENT_KEY = "campusos.recents";

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const { can, tenant } = useAccess();
  const pathname = useRouterState({ select: (router) => router.location.pathname });

  const [pins, setPins] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  
  // Track which module dropdown is currently open (Accordion style)
  const [openModule, setOpenModule] = useState<string | null>(() => {
    for (const group of navGroups) {
      if (group.items.some((it) => it.to === pathname || (pathname !== "/" && pathname.startsWith(it.to) && it.to !== "/dashboard" && it.to !== "/"))) {
        return group.label;
      }
    }
    return "Overview";
  });

  useEffect(() => {
    try {
      setPins(JSON.parse(window.localStorage.getItem(PIN_KEY) ?? "[]"));
      setRecents(JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      setPins([]);
      setRecents([]);
    }
  }, []);

  useEffect(() => {
    if (!allNavItems.some((item) => item.to === pathname)) return;
    setRecents((prev) => {
      const next = [pathname, ...prev.filter((entry) => entry !== pathname)].slice(0, 5);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, [pathname]);

  // Automatically expand the module containing the currently active path on route changes
  useEffect(() => {
    for (const group of navGroups) {
      const isMatch = group.items.some(
        (it) => it.to === pathname || (pathname !== "/" && pathname.startsWith(it.to) && it.to !== "/dashboard" && it.to !== "/")
      );
      if (isMatch) {
        setOpenModule(group.label);
        break;
      }
    }
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

  const renderItem = (item: NavItem, options?: { pinnable?: boolean }) => {
    const isActive = pathname === item.to || (pathname !== "/" && pathname.startsWith(item.to) && item.to !== "/dashboard" && item.to !== "/");
    return (
      <SidebarMenuItem key={item.to} className="list-none">
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className={cn(
            "rounded-[12px] h-8.5 transition-all duration-150 text-xs font-medium w-full px-2.5",
            isActive ? "bg-primary/15 text-primary font-bold shadow-2xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <Link to={item.to} className="flex items-center gap-2">
            <item.icon className={cn("size-4 shrink-0 transition-colors", isActive ? "text-primary opacity-100" : "opacity-70")} />
            <span className="truncate">{item.title}</span>
          </Link>
        </SidebarMenuButton>
        {options?.pinnable && !collapsed ? (
          <SidebarMenuAction
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePin(item.to);
            }}
            aria-label={pins.includes(item.to) ? `Unpin ${item.title}` : `Pin ${item.title}`}
            showOnHover={!pins.includes(item.to)}
            className="rounded-md"
          >
            <Star className={cn("size-3.5 transition-colors", pins.includes(item.to) ? "fill-amber-400 text-amber-500 opacity-100" : "text-muted-foreground/60")} />
          </SidebarMenuAction>
        ) : null}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar">
      <SidebarHeader className="border-b border-border/60 bg-sidebar px-3.5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="size-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-bold tracking-tight text-foreground">CampusOS</p>
                <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider">3.0</span>
              </div>
              <p className="truncate text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {tenant?.name ?? "Enterprise ERP"}
              </p>
            </div>
          ) : null}
        </div>
        {!collapsed && (
          <div className="mt-3">
            <AICopilotButton className="w-full justify-start h-9 shadow-2xs rounded-[14px]" showText={true} />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2.5 py-3 gap-2 overflow-x-hidden">
        {/* Pinned Favorites Section */}
        {pinnedItems.length > 0 ? (
          <SidebarGroup className="py-1 border-b border-border/60 pb-2.5 mb-1">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-amber-500 px-2 mb-1 flex items-center gap-1.5">
              <Star className="size-3 fill-current" /> {!collapsed && <span>Pinned Favorites</span>}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {pinnedItems.map((item) => renderItem(item, { pinnable: true }))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {/* Enterprise SaaS Module Dropdowns */}
        <div className="space-y-1">
          {navGroups.map((group) => {
            const items = group.items.filter(visible);
            if (items.length === 0) return null;

            const isOpen = openModule === group.label;
            const GroupIcon = group.icon ?? FolderOpen;

            // Collapsed state: just show icon button that opens sidebar and module on click
            if (collapsed) {
              return (
                <TooltipProvider key={group.label} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setOpen(true);
                          setOpenModule(group.label);
                        }}
                        className={cn(
                          "w-full flex items-center justify-center size-9 rounded-[14px] transition-colors mb-1",
                          isOpen ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                      >
                        <GroupIcon className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-semibold text-xs rounded-xl shadow-md">
                      {group.label} ({items.length})
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            // Expanded state: interactive SaaS module accordion
            return (
              <Collapsible key={group.label} open={isOpen} className="group/collapsible transition-all">
                <div
                  onClick={() => setOpenModule(isOpen ? null : group.label)}
                  className={cn(
                    "flex items-center justify-between w-full h-10 px-3 rounded-[14px] text-xs transition-all duration-180 cursor-pointer select-none border",
                    isOpen
                      ? "bg-primary/10 text-primary border-primary/25 font-bold shadow-2xs"
                      : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "size-6 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isOpen ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <GroupIcon className="size-3.5" />
                    </div>
                    <span className="truncate tracking-wide">{group.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded-full transition-colors leading-none",
                        isOpen ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground border border-border/60"
                      )}
                    >
                      {items.length}
                    </span>
                    <ChevronRight
                      className={cn(
                        "size-3.5 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-90 text-primary"
                      )}
                    />
                  </div>
                </div>

                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <div className="pt-1 pb-1.5 pl-3.5 pr-1">
                    <SidebarMenu className="border-l-2 border-primary/20 pl-2 space-y-0.5 my-0.5">
                      {items.map((item) => renderItem(item, { pinnable: true }))}
                    </SidebarMenu>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Recent History Section */}
        {recentItems.length > 0 && !collapsed ? (
          <SidebarGroup className="py-2 border-t border-border/60 mt-2">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/80 px-2 flex items-center gap-1.5 mb-1">
              <Clock className="size-3 text-muted-foreground" /> <span>Recent Activity</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">{recentItems.map((item) => renderItem(item))}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}
