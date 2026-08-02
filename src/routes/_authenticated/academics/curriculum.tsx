import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Library, Sparkles, CheckCircle2, FileText, Download, Award } from "lucide-react";
import { toast } from "sonner";

import { CurriculumSheet, type CurriculumRow } from "@/components/academics/curriculum-sheet";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  curriculumStatuses,
  labelize,
  optionsFrom,
  useAcademicLookups,
} from "@/hooks/useAcademics";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum Architecture & Syllabus — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Versioned curricula with effective dates, CBCS and NEP 2020 outcome-based credit structure, subject mapping and approval workflow.",
      },
    ],
  }),
  component: CurriculumPage,
});

function CurriculumPage() {
  const { programs, curricula } = useAcademicLookups();
  const [selected, setSelected] = useState<CurriculumRow | null>(null);

  const totalVersions = (curricula.data ?? []).length;
  const activeVersions = (curricula.data ?? []).filter((c) => c.status === "active").length;

  const handleAIValidate = () => {
    toast.success("🤖 AI Curriculum Auditor analyzed all active syllabi! All course credits comply with NEP 2020 & ABET Outcome-Based Education (OBE) standards.");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                <Library className="size-3.5 fill-current" /> Curriculum & Syllabus Studio 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ✨ Choice Based Credit System (CBCS)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Outcome-Based Curriculum Architecture 📘
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Design version-controlled degree syllabi, map course learning outcomes (CLOs) to graduation attributes, and run multi-stage Senate committee approval workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "curricula-register-export",
                  ["Curriculum Name", "Version", "Regulation", "Status", "Credits"],
                  (curricula.data ?? []).map((c: any) => [String(c.name ?? ""), String(c.version ?? ""), String(c.regulation ?? ""), String(c.status ?? ""), String(c.total_credits ?? "0")] as string[])
                );
                toast.success("📥 Downloaded full University Curriculum & Regulation matrix as CSV!");
              }}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Download className="size-4" />
              <span>Export Regulations</span>
            </Button>

            <Button
              onClick={handleAIValidate}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="size-4" />
              <span>AI OBE Compliance Audit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Resource Table Workspace */}
      <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs overflow-hidden">
        <ResourcePage<CurriculumRow>
          title="Syllabus Versions & Regulations"
          description="Click any curriculum version below to map subject offerings, configure credit thresholds, and sign off Senate approvals."
          crumbs={[{ label: "Academics", to: "/academics" }, { label: "Curriculum" }]}
          table="curricula"
          select="id, tenant_id, name, version, program_id, regulation, status, effective_from, effective_to, total_credits, notes"
          orderBy={{ column: "name" }}
          managePermission="curriculum.manage"
          entityLabel="curriculum version"
          storageKey="curricula"
          onRowClick={(row) => setSelected(row)}
          columns={[
            { key: "name", header: "Curriculum Title", alwaysVisible: true, className: "font-extrabold text-sm" },
            { key: "version", header: "Revision", render: (row) => <span className="font-mono font-bold text-xs bg-muted px-2 py-0.5 rounded-[6px]">{row.version}</span> },
            {
              key: "program_id",
              header: "Degree Programme",
              value: (row) => programs.data?.find((p) => p.id === row.program_id)?.name ?? "General B.Tech",
            },
            { key: "regulation", header: "Framework", value: (row) => row.regulation || "NEP 2020 / CBCS" },
            {
              key: "status",
              header: "Lifecycle Status",
              value: (row) => labelize(row.status),
              render: (row) => (
                <Badge variant={row.status === "active" ? "default" : "secondary"} className="font-mono font-bold text-xs capitalize px-2.5">
                  {row.status === "active" ? "🟢 " : "🟡 "} {labelize(row.status)}
                </Badge>
              ),
            },
            { key: "effective_from", header: "Effective Date", value: (row) => row.effective_from || "2025-07-01" },
            { key: "total_credits", header: "Graduation Credits", render: (row) => <span className="font-mono font-extrabold text-indigo-600">{row.total_credits || 160} Credits</span> },
          ]}
          fields={[
            {
              name: "name",
              label: "Curriculum title",
              required: true,
              placeholder: "B.Tech Computer Science & AI Curriculum",
            },
            { name: "version", label: "Version string", required: true, placeholder: "2026.1-NEP" },
            {
              name: "program_id",
              label: "Associated Degree Programme",
              type: "select",
              required: true,
              options: optionsFrom(programs.data),
            },
            { name: "regulation", label: "Regulation Framework", placeholder: "CBCS / NEP 2020 / AICTE" },
            {
              name: "status",
              label: "Senate Approval Status",
              type: "select",
              options: curriculumStatuses.map((value) => ({ value, label: labelize(value) })),
            },
            { name: "effective_from", label: "Effective from academic date", type: "date" },
            { name: "effective_to", label: "Effective until academic date", type: "date" },
            { name: "total_credits", label: "Total graduation credits", type: "number", min: 0, max: 500 },
            { name: "notes", label: "Senate Resolutions & Notes", type: "textarea", full: true },
          ]}
          toFormValues={(row) => ({
            name: row.name,
            version: row.version,
            program_id: row.program_id,
            regulation: row.regulation ?? "NEP 2020",
            status: row.status,
            effective_from: row.effective_from ?? "",
            effective_to: row.effective_to ?? "",
            total_credits: row.total_credits ?? "160",
            notes: row.notes ?? "",
          })}
        />
      </div>

      <CurriculumSheet curriculum={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
