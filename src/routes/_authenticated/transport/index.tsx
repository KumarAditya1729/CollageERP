/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/common/stat-card";
import {
  useTransportVehicles,
  useTransportRoutes,
  useTransportStudentAllocations,
} from "@/hooks/transport/useTransport";
import { Truck, Navigation, Users, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transport/")({
  component: TransportDashboard,
});

function TransportDashboard() {
  const { data: vehicles } = useTransportVehicles();
  const { data: routes } = useTransportRoutes();
  const { data: allocations } = useTransportStudentAllocations();

  const activeVehicles = vehicles?.filter((v: any) => v.status === "active")?.length || 0;
  const totalRoutes = routes?.length || 0;
  const totalAllocations = allocations?.filter((a: any) => a.status === "active")?.length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Vehicles"
          value={activeVehicles}
          hint="Vehicles currently running"
          icon={Truck}
        />
        <StatCard
          label="Total Routes"
          value={totalRoutes}
          hint="Active routes configured"
          icon={Navigation}
        />
        <StatCard
          label="Student Allocations"
          value={totalAllocations}
          hint="Active transport students"
          icon={Users}
        />
        <StatCard label="Fleet Status" value="Healthy" hint="All systems normal" icon={Activity} />
      </div>

      <div className="bg-card rounded-lg p-6 border shadow-sm flex items-center justify-center h-64 text-muted-foreground">
        Live GPS Map tracking integration will appear here (GPS-ready architecture).
      </div>
    </div>
  );
}
