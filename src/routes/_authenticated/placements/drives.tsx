import { createFileRoute } from "@tanstack/react-router";
import { usePlacementDrives } from "@/hooks/usePlacements";
import { Users, Plus, MapPin, Calendar, Briefcase, IndianRupee } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/placements/drives")({
  component: PlacementDrives,
});

function PlacementDrives() {
  const drives = usePlacementDrives();

  return (
    <div className="space-y-6 w-full max-w-none min-w-0 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Placement Drives</h1>
          <p className="text-sm text-muted-foreground">Manage active, upcoming, and completed campus drives.</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" /> New Drive
        </Button>
      </div>

      <div className="bg-card rounded-[24px] border border-border shadow-sm p-4 sm:p-6 overflow-hidden">
        <DataTable
          columns={[
            { 
              key: "company", 
              header: "Company", 
              render: (row) => (
                <div className="font-semibold flex items-center gap-2">
                  <Briefcase className="size-4 text-muted-foreground" /> 
                  {row.placement_companies?.name || "Unknown"}
                </div>
              ) 
            },
            { key: "job_role", header: "Job Role" },
            { 
              key: "package", 
              header: "Package (CTC)", 
              render: (row) => (
                <div className="flex items-center gap-1 font-mono text-emerald-600">
                  <IndianRupee className="size-3" /> {row.ctc_lpa} LPA
                </div>
              ) 
            },
            { 
              key: "eligibility", 
              header: "Min CGPA", 
              render: (row) => <span className="font-mono bg-accent px-2 py-1 rounded-md">{row.min_cgpa}</span> 
            },
            { 
              key: "schedule", 
              header: "Date & Location", 
              render: (row) => (
                <div className="flex flex-col text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="size-3" /> {row.drive_date ? new Date(row.drive_date).toLocaleDateString() : "TBD"}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" /> {row.location || "TBD"}</span>
                </div>
              ) 
            },
            { 
              key: "status", 
              header: "Status", 
              render: (row) => (
                <Badge variant={row.status === "active" ? "default" : row.status === "upcoming" ? "secondary" : "outline"}>
                  {row.status.toUpperCase()}
                </Badge>
              )
            },
          ]}
          data={drives.data ?? []}
          getRowId={(row) => row.id}
        />
      </div>
    </div>
  );
}
