import { createFileRoute } from "@tanstack/react-router";
import { usePlacementCompanies, usePlacementDrives, usePlacementApplications } from "@/hooks/usePlacements";
import { Building2, Briefcase, Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import { DataTable } from "@/components/common/data-table";

export const Route = createFileRoute("/_authenticated/placements/")({
  component: PlacementsDashboard,
});

function PlacementsDashboard() {
  const companies = usePlacementCompanies();
  const drives = usePlacementDrives();
  const applications = usePlacementApplications();

  const activeDrives = drives.data?.filter(d => d.status === "active" || d.status === "upcoming").length || 0;
  const totalOffers = applications.data?.filter(a => a.status === "offered").length || 0;

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <Briefcase className="size-3.5 fill-current" /> CRC Studio 3.0
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Corporate Relations & Placements 💼
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Manage recruiting partners, upcoming placement drives, student eligibility, and job offers directly from the ERP.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recruiting Partners" value={companies.data?.length || 0} icon={Building2} hint="Total registered companies" />
        <StatCard label="Active/Upcoming Drives" value={activeDrives} icon={TrendingUp} hint="Campus drives this season" />
        <StatCard label="Student Applications" value={applications.data?.length || 0} icon={FileText} hint="Total drive registrations" />
        <StatCard label="Offers Rolled Out" value={totalOffers} icon={CheckCircle2} hint="Total selections/offers" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2 mb-4">
            <Building2 className="size-5 text-indigo-600" /> Recruiting Companies
          </h2>
          <DataTable
            columns={[
              { key: "name", header: "Company Name" },
              { key: "industry", header: "Industry" },
              { key: "hr_contact_name", header: "HR Contact" },
            ]}
            data={companies.data ?? []}
            getRowId={(row) => row.id}
          />
        </div>

        <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2 mb-4">
            <Briefcase className="size-5 text-purple-600" /> Recent Placement Drives
          </h2>
          <DataTable
            columns={[
              { 
                key: "company", 
                header: "Company",
                value: (row) => row.placement_companies?.name || "Unknown",
                render: (row) => <span className="font-semibold">{row.placement_companies?.name || "Unknown"}</span>
              },
              { key: "job_role", header: "Role" },
              { key: "ctc_lpa", header: "CTC (LPA)", render: (row) => <span className="font-mono text-emerald-600 font-bold">{row.ctc_lpa} L</span> },
              { key: "status", header: "Status" },
            ]}
            data={drives.data ?? []}
            getRowId={(row) => row.id}
          />
        </div>
      </div>
    </div>
  );
}
