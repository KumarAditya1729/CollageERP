import { createFileRoute } from "@tanstack/react-router";
import { Heart, UserCheck, Syringe, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Can } from "@/components/common/can";
import {
  useMedicalVisits,
  useMedicalRecords,
  useVaccinations,
  useHealthAlerts,
} from "@/hooks/medical/useMedical";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/medical/")({
  component: MedicalCenter,
});

function MedicalCenter() {
  const visits = useMedicalVisits();
  const records = useMedicalRecords();
  const vaccinations = useVaccinations();
  const alerts = useHealthAlerts();

  const visitsData = visits.data ?? [];
  const alertsData = alerts.data ?? [];
  const today = new Date().toISOString().split("T")[0];
  const todaysVisits = visitsData.filter((v: Record<string, unknown>) =>
    String(v.created_at ?? "").startsWith(today),
  ).length;

  return (
    <Can
      permission="medical.view"
      fallback={<p className="p-6 text-muted-foreground">Access denied.</p>}
    >
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Medical Center"
          description="Student health records, visits, vaccinations, and alerts."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Records" value={records.data?.length ?? 0} icon={Heart} />
          <StatCard label="Today's Visits" value={todaysVisits} icon={UserCheck} />
          <StatCard label="Vaccinations" value={vaccinations.data?.length ?? 0} icon={Syringe} />
          <StatCard label="Active Alerts" value={alertsData.length} icon={AlertTriangle} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Recent Visits</h3>
            {visitsData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits recorded.</p>
            ) : (
              <div className="space-y-2">
                {visitsData.slice(0, 8).map((v: Record<string, unknown>, i: number) => (
                  <div
                    key={String(v.id ?? i)}
                    className="flex items-center justify-between border-b pb-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {String(v.diagnosis ?? v.complaints ?? "Visit")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.created_at
                          ? format(new Date(String(v.created_at)), "dd MMM, HH:mm")
                          : "—"}
                      </p>
                    </div>
                    <Badge variant="outline">{String(v.visit_type ?? "General")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">Health Alerts</h3>
            {alertsData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active health alerts.</p>
            ) : (
              <div className="space-y-2">
                {alertsData.slice(0, 8).map((a: Record<string, unknown>, i: number) => (
                  <div
                    key={String(a.id ?? i)}
                    className="flex items-center justify-between border-b pb-2 text-sm"
                  >
                    <p className="font-medium">{String(a.title ?? a.message ?? "Alert")}</p>
                    <Badge variant="destructive">{String(a.severity ?? "Warning")}</Badge>
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
