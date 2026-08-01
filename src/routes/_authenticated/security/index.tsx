import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Can } from "@/components/common/can";
import {
  useSecurityIncidents,
  useEmergencyContacts,
  usePanicAlerts,
} from "@/hooks/security/useSecurity";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/security/")({
  component: SecurityDashboard,
});

function SecurityDashboard() {
  const incidents = useSecurityIncidents();
  const contacts = useEmergencyContacts();
  const panics = usePanicAlerts();

  const data = incidents.data ?? [];
  const open = data.filter(
    (i: Record<string, unknown>) => i.status !== "closed" && i.status !== "resolved",
  );
  const high = data.filter(
    (i: Record<string, unknown>) => i.severity === "high" || i.severity === "critical",
  );

  return (
    <Can
      permission="security.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Security"
          description="Monitor security incidents, alerts, and emergency contacts."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Incidents" value={data.length} icon={ShieldAlert} />
          <StatCard label="Open" value={open.length} icon={AlertTriangle} />
          <StatCard label="High Severity" value={high.length} icon={AlertTriangle} />
          <StatCard label="Panic Alerts" value={panics.data?.length ?? 0} icon={Phone} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Recent Incidents</h3>
            {data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents reported.</p>
            ) : (
              <div className="space-y-2">
                {data.slice(0, 8).map((inc: Record<string, unknown>, i: number) => (
                  <div
                    key={String(inc.id ?? i)}
                    className="flex items-center justify-between border-b pb-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{String(inc.title ?? "Untitled")}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(inc.location ?? "")} —{" "}
                        {inc.incident_time
                          ? format(new Date(String(inc.incident_time)), "dd MMM HH:mm")
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        inc.severity === "high" || inc.severity === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {String(inc.severity ?? "low")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Emergency Contacts</h3>
            {(contacts.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No emergency contacts configured.</p>
            ) : (
              <div className="space-y-2">
                {(contacts.data ?? []).map((c: Record<string, unknown>, i: number) => (
                  <div
                    key={String(c.id ?? i)}
                    className="flex items-center justify-between border-b pb-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{String(c.name ?? "—")}</p>
                      <p className="text-xs text-muted-foreground">{String(c.phone ?? "")}</p>
                    </div>
                    <Badge variant="outline">{String(c.role ?? "Contact")}</Badge>
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
