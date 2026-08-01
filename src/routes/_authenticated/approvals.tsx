import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — CampusOS" },
      {
        name: "description",
        content: "Workflow inbox for pending approvals across admissions, documents and academics.",
      },
      { property: "og:title", content: "Approvals — CampusOS" },
      { property: "og:description", content: "Your CampusOS workflow inbox." },
    ],
  }),
  component: ApprovalsPage,
});

interface InstanceRow extends Record<string, unknown> {
  id: string;
  subject: string | null;
  entity_type: string;
  status: string;
  current_step_order: number;
  due_at: string | null;
  created_at: string;
  workflows: { name: string; module: string | null } | null;
}

function ApprovalsPage() {
  const { tenant, can } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canAct = can("workflow.act");

  const query = useQuery({
    queryKey: ["workflow-instances", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_instances")
        .select(
          "id, subject, entity_type, status, current_step_order, due_at, created_at, workflows(name, module)",
        )
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as InstanceRow[];
    },
  });

  const act = useMutation({
    mutationFn: async ({ ids, decision }: { ids: string[]; decision: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("workflow_instances")
        .update({ status: decision, completed_at: new Date().toISOString(), updated_by: user?.id })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.decision === "approved" ? "Request approved" : "Request rejected");
      void queryClient.invalidateQueries({ queryKey: ["workflow-instances"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];
  const pending = rows.filter((row) => row.status === "pending" || row.status === "in_progress");

  return (
    <>
      <PageHeader
        title="Workflow inbox"
        description="Approval requests routed to your college, with their current stage and decision history."
        crumbs={[{ label: "Operations" }, { label: "Approvals" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting decision" value={pending.length} loading={query.isLoading} />
        <StatCard
          label="Approved"
          value={rows.filter((row) => row.status === "approved").length}
          loading={query.isLoading}
        />
        <StatCard
          label="Rejected"
          value={rows.filter((row) => row.status === "rejected").length}
          loading={query.isLoading}
        />
      </div>

      <DataTable<InstanceRow>
        columns={[
          { key: "subject", header: "Request", alwaysVisible: true, className: "font-medium" },
          { key: "workflow", header: "Workflow", value: (row) => row.workflows?.name ?? null },
          { key: "entity_type", header: "Record type" },
          { key: "current_step_order", header: "Stage" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge
                variant={
                  row.status === "approved"
                    ? "default"
                    : row.status === "rejected" || row.status === "expired"
                      ? "destructive"
                      : "secondary"
                }
                className="capitalize"
              >
                {row.status.replace(/_/g, " ")}
              </Badge>
            ),
          },
          {
            key: "due_at",
            header: "Due",
            value: (row) => row.due_at,
            render: (row) => formatDateTime(row.due_at),
          },
          {
            key: "created_at",
            header: "Raised",
            value: (row) => row.created_at,
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={rows}
        getRowId={(row) => row.id}
        loading={query.isLoading}
        error={(query.error as Error) ?? null}
        onRetry={() => void query.refetch()}
        storageKey="approvals"
        exportName="approvals"
        searchPlaceholder="Search approvals…"
        emptyTitle="No approval requests"
        emptyDescription="Requests raised through workflows will land in this inbox."
        bulkActions={
          canAct
            ? (ids, clear) => (
                <>
                  <Button
                    size="sm"
                    disabled={act.isPending}
                    onClick={async () => {
                      await act.mutateAsync({ ids, decision: "approved" });
                      clear();
                    }}
                  >
                    <Check className="size-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={act.isPending}
                    onClick={async () => {
                      await act.mutateAsync({ ids, decision: "rejected" });
                      clear();
                    }}
                  >
                    <X className="size-4" />
                    Reject
                  </Button>
                </>
              )
            : undefined
        }
        rowActions={(row) =>
          canAct && (row.status === "pending" || row.status === "in_progress") ? (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Approve"
                disabled={act.isPending}
                onClick={() => void act.mutateAsync({ ids: [row.id], decision: "approved" })}
              >
                <Check className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Reject"
                disabled={act.isPending}
                onClick={() => void act.mutateAsync({ ids: [row.id], decision: "rejected" })}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null
        }
      />
    </>
  );
}
