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
    <ol className="relative space-y-4 border-l pl-5">
      {timeline.data.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium capitalize">{entry.title}</p>
            <Badge variant="outline" className="text-[10px]">
              {entry.kind}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</span>
          </div>
          {entry.detail ? <p className="text-sm text-muted-foreground">{entry.detail}</p> : null}
        </li>
      ))}
    </ol>
  );
}
