import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

interface TimelineEntry {
  id: string;
  at: string;
  title: string;
  detail: string | null;
  kind: string;
}

/** Merged audit trail + activity feed for a single record. */
export function EntityTimeline({
  entityType,
  entityId,
  limit = 60,
}: {
  entityType: string;
  entityId: string;
  limit?: number;
}) {
  const { tenant } = useAccess();

  const timeline = useQuery({
    queryKey: ["entity-timeline", entityType, entityId, tenant?.id],
    enabled: Boolean(entityId && tenant?.id),
    queryFn: async () => {
      const [audit, activity] = await Promise.all([
        supabase
          .from("audit_logs")
          .select("id, action, entity_label, changed_fields, actor_email, created_at")
          .eq("tenant_id", tenant!.id)
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("activity_feed")
          .select("id, verb, summary, created_at")
          .eq("tenant_id", tenant!.id)
          .eq("entity_type", entityType)
          .eq("entity_id", entityId)
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);
      if (audit.error) throw audit.error;
      if (activity.error) throw activity.error;

      const entries: TimelineEntry[] = [
        ...(audit.data ?? []).map((row) => ({
          id: `audit-${row.id}`,
          at: row.created_at,
          title: String(row.action).replace(/_/g, " "),
          detail:
            [
              row.actor_email,
              (row.changed_fields ?? []).length
                ? `changed ${(row.changed_fields ?? []).join(", ")}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || null,
          kind: "Audit",
        })),
        ...(activity.data ?? []).map((row) => ({
          id: `feed-${row.id}`,
          at: row.created_at,
          title: row.verb,
          detail: row.summary,
          kind: "Activity",
        })),
      ].sort((a, b) => (a.at < b.at ? 1 : -1));

      return entries.slice(0, limit);
    },
  });

  if (timeline.isLoading) return <InlineLoader label="Loading timeline" />;
  if (!timeline.data?.length) {
    return (
      <EmptyState
        icon={History}
        title="No timeline entries yet"
        description="Every create, update and status change on this record appears here."
      />
    );
  }

  return (
    <ol className="relative space-y-5 border-l-2 border-primary/30 pl-6 my-2">
      {timeline.data.map((entry) => (
        <li key={entry.id} className="relative p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/45 transition-all shadow-2xs">
          <span className="absolute -left-[31px] top-4 size-3 rounded-full border-2 border-background bg-primary ring-4 ring-primary/20" />
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold capitalize tracking-tight text-foreground">{entry.title}</p>
              <Badge variant={entry.kind === "Audit" ? "default" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
                {entry.kind}
              </Badge>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{formatDateTime(entry.at)}</span>
          </div>
          {entry.detail ? (
            <p className="text-xs text-muted-foreground/90 font-mono bg-background/60 p-2 rounded-lg border border-border/40 mt-1">
              {entry.detail}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
