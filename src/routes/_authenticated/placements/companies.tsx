import { createFileRoute } from "@tanstack/react-router";
import { usePlacementCompanies } from "@/hooks/usePlacements";
import { Building2, Plus, ExternalLink } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/placements/companies")({
  component: PlacementCompanies,
});

function PlacementCompanies() {
  const companies = usePlacementCompanies();

  return (
    <div className="space-y-6 w-full max-w-none min-w-0 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruiting Partners</h1>
          <p className="text-sm text-muted-foreground">Manage corporate partners and HR contacts.</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" /> Add Company
        </Button>
      </div>

      <div className="bg-card rounded-[24px] border border-border shadow-sm p-4 sm:p-6 overflow-hidden">
        <DataTable
          columns={[
            { key: "name", header: "Company Name", render: (row) => <div className="font-semibold flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> {row.name}</div> },
            { key: "industry", header: "Industry" },
            { 
              key: "hr_contact", 
              header: "HR Contact", 
              render: (row) => (
                <div className="flex flex-col">
                  <span>{row.hr_contact_name || "N/A"}</span>
                  <span className="text-xs text-muted-foreground">{row.hr_contact_email}</span>
                </div>
              ) 
            },
            { 
              key: "website", 
              header: "Website", 
              render: (row) => row.website_url ? (
                <a href={row.website_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                  Visit <ExternalLink className="size-3" />
                </a>
              ) : "N/A"
            },
          ]}
          data={companies.data ?? []}
          getRowId={(row) => row.id}
        />
      </div>
    </div>
  );
}
