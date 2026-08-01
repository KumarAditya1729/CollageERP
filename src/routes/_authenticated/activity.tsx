import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Audit trail — CampusOS" },
      {
        name: "description",
        content:
          "Immutable audit log of every create, update and delete in your college workspace.",
      },
      { property: "og:title", content: "Audit trail — CampusOS" },
      { property: "og:description", content: "Immutable audit log for your college workspace." },
    ],
  }),
  component: ActivityPage,
});

interface AuditRow extends Record<string, unknown> {
  id: string;
  action: string;
  entity_type: string;
  entity_label: string | null;
  module: string | null;
  actor_email: string | null;
  changed_fields: string[] | null;
  created_at: string;
}

function ActivityPage() {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["audit-logs", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          "id, action, entity_type, entity_label, module, actor_email, changed_fields, created_at",
        )
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="Every recorded change in your workspace, captured automatically by the database."
        crumbs={[{ label: "Operations" }, { label: "Activity" }]}
      />

      <DataTable<AuditRow>
        columns={[
          {
            key: "action",
            header: "Action",
            alwaysVisible: true,
            render: (row) => (
              <Badge
                variant={
                  row.action === "delete"
                    ? "destructive"
                    : row.action === "create"
                      ? "default"
                      : "secondary"
                }
                className="capitalize"
              >
                {row.action}
              </Badge>
            ),
          },
          { key: "entity_type", header: "Record type" },
          { key: "entity_label", header: "Record" },
          { key: "module", header: "Module", defaultHidden: true },
          { key: "actor_email", header: "Performed by" },
          {
            key: "changed_fields",
            header: "Changed fields",
            sortable: false,
            value: (row) => (row.changed_fields ?? []).join(", "),
          },
          {
            key: "created_at",
            header: "When",
            value: (row) => row.created_at,
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={query.data}
        getRowId={(row) => row.id}
        loading={query.isLoading}
        error={(query.error as Error) ?? null}
        onRetry={() => void query.refetch()}
        storageKey="audit-logs"
        exportName="audit-trail"
        searchPlaceholder="Search the audit trail…"
        emptyTitle="No audit entries yet"
        emptyDescription="Changes to records will be logged here automatically."
      />
    </>
  );
}
