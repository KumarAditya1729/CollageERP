import { Link } from "@tanstack/react-router";
import { Bell, Check, Archive, Sparkles, ShieldCheck, DollarSign, BookOpen, AlertCircle } from "lucide-react";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/export";
import { cn } from "@/lib/utils";

function getNotificationCategory(title: string, body?: string | null) {
  const content = `${title} ${body || ""}`.toLowerCase();
  if (content.includes("fee") || content.includes("payment") || content.includes("invoice") || content.includes("due")) {
    return { label: "Finance", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: DollarSign };
  }
  if (content.includes("approve") || content.includes("workflow") || content.includes("request") || content.includes("leave")) {
    return { label: "Approval", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: ShieldCheck };
  }
  if (content.includes("exam") || content.includes("grade") || content.includes("student") || content.includes("attendance")) {
    return { label: "Academic", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", icon: BookOpen };
  }
  if (content.includes("alert") || content.includes("warn") || content.includes("fail") || content.includes("incident")) {
    return { label: "Alert", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: AlertCircle };
  }
  return { label: "System", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Sparkles };
}

export function NotificationCenter() {
  const { active, unreadCount, isLoading, markRead, archive, busy } = useNotifications();
  const recent = active.slice(0, 8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-[12px] h-9 w-9 cursor-pointer" aria-label="Notifications">
          <Bell className="size-4.5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] p-0 rounded-[20px] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/80 bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-bold tracking-tight text-foreground">Activity & Alerts Feed</p>
            {unreadCount > 0 ? <Badge className="bg-primary text-primary-foreground font-mono text-[11px] px-2 rounded-full">{unreadCount} new</Badge> : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                void markRead(active.filter((item) => !item.read_at).map((item) => item.id))
              }
              className="text-xs text-primary font-semibold rounded-[12px] hover:bg-primary/10"
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <InlineLoader label="Loading notification matrix..." />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All clear"
            description="Your inbox is currently empty. System approvals and student activity will stream here."
            className="py-12 my-0 border-0 shadow-none rounded-none bg-transparent"
          />
        ) : (
          <ScrollArea className="max-h-[440px]">
            <div className="divide-y divide-border/60">
              {recent.map((item) => {
                const cat = getNotificationCategory(item.title, item.body);
                const CatIcon = cat.icon;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group flex gap-3.5 px-5 py-4 transition-colors hover:bg-muted/40",
                      !item.read_at ? "bg-primary/5 dark:bg-primary/10" : "bg-card"
                    )}
                  >
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted border border-border text-muted-foreground group-hover:border-border/80 shadow-2xs">
                      <CatIcon className="size-4 text-foreground/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border", cat.color)}>
                          {cat.label}
                        </span>
                      </div>
                      {item.body ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                          {item.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[10px] font-mono font-medium text-muted-foreground/80 flex items-center gap-2">
                        <span>{formatDateTime(item.created_at)}</span>
                        {!item.read_at && <span className="size-1.5 rounded-full bg-primary inline-block" />}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.read_at ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-[10px] hover:bg-muted"
                          aria-label="Mark as read"
                          disabled={busy}
                          title="Mark read"
                          onClick={() => void markRead([item.id])}
                        >
                          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-[10px] hover:bg-muted text-muted-foreground hover:text-destructive"
                        aria-label="Archive"
                        disabled={busy}
                        title="Archive"
                        onClick={() => void archive([item.id])}
                      >
                        <Archive className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="border-t border-border/80 p-2.5 bg-muted/20">
          <Button asChild variant="ghost" size="sm" className="w-full rounded-[14px] text-xs font-semibold justify-center hover:bg-muted/80">
            <Link to="/notifications">View Full Notification History →</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
