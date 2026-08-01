import { createFileRoute } from "@tanstack/react-router";
import { Users2, ShieldCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Can } from "@/components/common/can";
import { useVisitors, useVisitorPasses } from "@/hooks/visitor/useVisitor";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/visitors/")({
  component: VisitorManagement,
});

function VisitorManagement() {
  const visitors = useVisitors();
  const passes = useVisitorPasses();

  const totalVisitors = visitors.data?.length ?? 0;
  const activePasses =
    passes.data?.filter((p: Record<string, unknown>) => p.status === "active")?.length ?? 0;
  const todayPasses =
    passes.data?.filter((p: Record<string, unknown>) => {
      const d = String(p.created_at ?? "");
      return d.startsWith(new Date().toISOString().split("T")[0]);
    })?.length ?? 0;

  return (
    <Can
      permission="visitor.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Visitor Management"
          description="Track campus visitors and manage gate passes."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Visitors" value={totalVisitors} icon={Users2} />
          <StatCard label="Active Passes" value={activePasses} icon={ShieldCheck} />
          <StatCard label="Today's Entries" value={todayPasses} icon={Clock} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Registered Visitors</h3>
            {(visitors.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No visitors found.</p>
            ) : (
              <div className="space-y-2">
                {(visitors.data ?? []).slice(0, 8).map((v: Record<string, unknown>, i: number) => (
                  <div
                    key={String(v.id ?? i)}
                    className="flex items-center justify-between border-b pb-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{String(v.name ?? "Unknown")}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(v.phone ?? v.email ?? "")}
                      </p>
                    </div>
                    <Badge variant="outline">{String(v.visitor_type ?? "Guest")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Recent Gate Passes</h3>
            {(passes.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No passes found.</p>
            ) : (
              <div className="space-y-2">
                {(passes.data ?? []).slice(0, 8).map((p: Record<string, unknown>, i: number) => (
                  <div
                    key={String(p.id ?? i)}
                    className="flex items-center justify-between border-b pb-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">Pass #{String(p.id ?? "—").slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.created_at
                          ? format(new Date(String(p.created_at)), "dd MMM, HH:mm")
                          : "—"}
                      </p>
                    </div>
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>
                      {String(p.status ?? "—")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Can>
  );
}
