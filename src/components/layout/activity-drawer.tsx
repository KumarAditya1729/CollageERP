import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

export interface ActivityRow {
  id: string;
  verb: string;
  summary: string;
  module: string | null;
  entity_type: string | null;
  created_at: string;
}

export function useActivityFeed(limit = 30) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["activity-feed", tenant?.id, limit],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_feed")
        .select("id, verb, summary, module, entity_type, created_at")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });
}

export function ActivityDrawer() {
  const { data, isLoading } = useActivityFeed(30);
  const items = data ?? [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Recent activity">
          <Activity className="size-4.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Recent activity</SheetTitle>
          <SheetDescription>What has happened across your college lately.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <InlineLoader label="Loading activity" />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Actions taken by your team will show up here."
            />
          ) : (
            <ol className="relative space-y-4 border-l pl-5">
              {items.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-primary" />
                  <p className="text-sm text-foreground">{item.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.module ? `${item.module} · ` : ""}
                    {formatDateTime(item.created_at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <Button asChild variant="outline" size="sm" className="mt-6 w-full">
            <Link to="/activity">View full audit trail</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
