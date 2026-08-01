import { Link } from "@tanstack/react-router";
import { Bell, Check, Archive } from "lucide-react";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/export";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { active, unreadCount, isLoading, markRead, archive, busy } = useNotifications();
  const recent = active.slice(0, 8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4.5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 ? <Badge variant="secondary">{unreadCount} new</Badge> : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                void markRead(active.filter((item) => !item.read_at).map((item) => item.id))
              }
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <InlineLoader label="Loading notifications" />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="New alerts about approvals, admissions and academics will appear here."
            className="py-10"
          />
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {recent.map((item) => (
                <li
                  key={item.id}
                  className={cn("flex gap-3 px-4 py-3", !item.read_at && "bg-accent/40")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    {item.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {item.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!item.read_at ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Mark as read"
                        disabled={busy}
                        onClick={() => void markRead([item.id])}
                      >
                        <Check className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Archive"
                      disabled={busy}
                      onClick={() => void archive([item.id])}
                    >
                      <Archive className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/notifications">Open notification center</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
