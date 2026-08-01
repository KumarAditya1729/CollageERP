import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Can } from "@/components/common/can";
import { useMaintenanceRequests } from "@/hooks/maintenance/useMaintenance";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/campus-maintenance/")({
  component: CampusMaintenance,
});

function CampusMaintenance() {
  const requests = useMaintenanceRequests();
  const data = requests.data ?? [];
  const open = data.filter(
    (r: Record<string, unknown>) => r.status === "open" || r.status === "pending",
  );
  const inProgress = data.filter((r: Record<string, unknown>) => r.status === "in_progress");
  const resolved = data.filter(
    (r: Record<string, unknown>) => r.status === "resolved" || r.status === "completed",
  );

  return (
    <Can
      permission="maintenance.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Campus Maintenance"
          description="Manage maintenance requests, tasks, and schedules."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Requests" value={data.length} icon={Wrench} />
          <StatCard label="Open" value={open.length} icon={AlertTriangle} />
          <StatCard label="In Progress" value={inProgress.length} icon={Clock} />
          <StatCard label="Resolved" value={resolved.length} icon={CheckCircle2} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-semibold">Recent Requests</h3>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No maintenance requests found.</p>
          ) : (
            <div className="space-y-2">
              {data.slice(0, 10).map((r: Record<string, unknown>, i: number) => (
                <div
                  key={String(r.id ?? i)}
                  className="flex items-center justify-between border-b pb-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{String(r.title ?? "Untitled")}</p>
                    <p className="text-xs text-muted-foreground">{String(r.description ?? "")}</p>
                  </div>
                  <Badge
                    variant={
                      r.status === "resolved"
                        ? "secondary"
                        : r.status === "in_progress"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {String(r.status ?? "—")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Can>
  );
}
