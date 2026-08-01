/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { BedDouble, Building2, Users, Wrench } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import {
  useHostels,
  useHostelRooms,
  useHostelAllocations,
  useHostelComplaints,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/")({
  component: HostelDashboard,
});

function HostelDashboard() {
  const { data: hostels } = useHostels();
  const { data: rooms } = useHostelRooms();
  const { data: allocations } = useHostelAllocations();
  const { data: complaints } = useHostelComplaints();

  const totalCapacity =
    hostels?.reduce((sum: number, h: any) => sum + (h.total_capacity || 0), 0) || 0;
  const activeAllocations = allocations?.filter((a: any) => a.status !== "vacated")?.length || 0;

  const totalRooms = rooms?.length || 0;
  const totalHostels = hostels?.length || 0;
  const openComplaints = complaints?.filter((c: any) => c.status === "open")?.length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Dashboard"
        description="Overview of campus hostels, occupancy, and operations."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Hostels"
          value={totalHostels.toString()}
          icon={Building2}
          hint="Managed properties"
        />
        <StatCard
          label="Total Rooms"
          value={totalRooms.toString()}
          icon={BedDouble}
          hint="Across all hostels"
        />
        <StatCard
          label="Current Occupancy"
          value={`${activeAllocations} / ${totalCapacity}`}
          icon={Users}
          hint={`${totalCapacity > 0 ? Math.round((activeAllocations / totalCapacity) * 100) : 0}% occupied`}
        />
        <StatCard
          label="Open Complaints"
          value={openComplaints.toString()}
          icon={Wrench}
          hint="Pending resolution"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="font-semibold text-lg mb-2">Occupancy Trends</h3>
          <p className="text-sm text-muted-foreground">Chart placeholder for occupancy data</p>
        </div>
        <div className="border rounded-lg p-6 bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="font-semibold text-lg mb-2">Maintenance Status</h3>
          <p className="text-sm text-muted-foreground">Chart placeholder for maintenance data</p>
        </div>
      </div>
    </div>
  );
}
