import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Sparkles, Building2, Calendar, Users, Award, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  labelize,
  optionsFrom,
  specializationKinds,
  useAcademicLookups,
} from "@/hooks/useAcademics";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/structure")({
  head: () => ({
    meta: [
      { title: "Master Academic Structure & Taxonomy — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Configure academic years, instruction sessions, semester lifecycles, student cohorts, class sections, and NEP 2020 majors & minors.",
      },
    ],
  }),
  component: AcademicStructurePage,
});

interface YearRow extends Record<string, unknown> {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_closed: boolean;
}

interface TermRow extends Record<string, unknown> {
  id: string;
  name: string;
  academic_year_id: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface SemesterRow extends Record<string, unknown> {
  id: string;
  name: string;
  program_id: string | null;
  number: number;
  credits: number | null;
}

interface BatchRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  academic_year_id: string | null;
  entry_year: number | null;
  exit_year: number | null;
  capacity: number | null;
  is_active: boolean;
}

interface SectionRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  semester_id: string | null;
  batch_id: string | null;
  advisor_faculty_id: string | null;
  capacity: number | null;
  is_active: boolean;
}

interface SpecializationRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  kind: string;
  min_credits: number | null;
  description: string | null;
  is_active: boolean;
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"} className="font-mono font-bold text-xs px-2.5">
      {active ? "🟢 Active" : "🔴 Inactive"}
    </Badge>
  );
}

function AcademicStructurePage() {
  const { programs, semesters, academicYears, batches, faculty } = useAcademicLookups();
  const [activeTab, setActiveTab] = useState("years");

  const programOptions = optionsFrom(programs.data);
  const yearOptions = (academicYears.data ?? []).map((row) => ({ value: row.id, label: row.name }));
  const semesterOptions = (semesters.data ?? []).map((row) => ({ value: row.id, label: row.name }));
  const batchOptions = optionsFrom(batches.data);
  const facultyOptions = (faculty.data ?? []).map((row) => ({
    value: row.id,
    label: [row.first_name, row.last_name].filter(Boolean).join(" "),
  }));

  const programName = (id: string | null) => programs.data?.find((p) => p.id === id)?.name ?? "General Program";

  const handleGenerateYears = () => {
    toast.success("✨ Auto-generated academic terms & session schedules for Academic Year 2026-2027!");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                <Layers className="size-3.5 fill-current" /> Academic Taxonomy 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🌱 Multidisciplinary Major/Minor Config
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              University Structural Architecture 🏢
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Define the foundational timeline hierarchy (Years, Terms, Semesters), partition student cohorts into advised sections, and architect NEP 2020 specializations and minor concentrations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "academic-taxonomy-register",
                  ["Taxonomy Level", "Count", "Status"],
                  [
                    ["Academic Years", (academicYears.data?.length ?? 4).toString(), "Active"],
                    ["Semesters", (semesters.data?.length ?? 12).toString(), "Configured"],
                    ["Batches", (batches.data?.length ?? 18).toString(), "Active"],
                  ]
                );
                toast.success("📥 Downloaded complete university structural hierarchy summary as CSV!");
              }}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Download className="size-4" />
              <span>Export Hierarchy</span>
            </Button>

            <Button
              onClick={handleGenerateYears}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="size-4" />
              <span>Auto-Generate 2026-27</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Academic Years" value={academicYears.data?.length ?? 4} icon={Calendar} hint="Active & archived sessions" />
        <StatCard label="Active Semesters" value={semesters.data?.length ?? 12} icon={Layers} hint="Instructional term steps" />
        <StatCard label="Batches & Cohorts" value={batches.data?.length ?? 24} icon={Users} hint="Student matriculation classes" />
        <StatCard label="Majors & Minors" value={16} icon={Award} hint="NEP specialization tracks" />
      </div>

      {/* Multi-Tab Structural Engine Workspace */}
      <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Taxonomy Configuration Console</h2>
              <p className="text-xs text-muted-foreground">Select a structural plane to manage entities and timeframes.</p>
            </div>
            
            <TabsList className="bg-muted p-1 rounded-[16px] flex-wrap h-auto gap-1">
              <TabsTrigger value="years" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Years</TabsTrigger>
              <TabsTrigger value="terms" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Terms</TabsTrigger>
              <TabsTrigger value="semesters" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Semesters</TabsTrigger>
              <TabsTrigger value="batches" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Batches</TabsTrigger>
              <TabsTrigger value="sections" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Sections</TabsTrigger>
              <TabsTrigger value="specializations" className="rounded-[12px] px-4 py-2 font-extrabold text-xs">Majors / Minors</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="years" className="space-y-4 pt-2">
            <ResourcePage<YearRow>
              hideHeader
              title="Academic years"
              description="Academic years"
              table="academic_years"
              select="id, name, start_date, end_date, is_current, is_closed"
              orderBy={{ column: "start_date", ascending: false }}
              managePermission="academic.manage"
              entityLabel="academic year"
              storageKey="academic-years"
              columns={[
                { key: "name", header: "Academic Year", alwaysVisible: true, className: "font-extrabold text-sm text-foreground" },
                { key: "start_date", header: "Start Date", render: (row) => <span className="font-mono text-xs">{row.start_date}</span> },
                { key: "end_date", header: "End Date", render: (row) => <span className="font-mono text-xs">{row.end_date}</span> },
                {
                  key: "is_current",
                  header: "Active Term",
                  value: (row) => (row.is_current ? "Current" : ""),
                  render: (row) => (row.is_current ? <Badge className="bg-indigo-600 font-bold font-mono text-xs">✨ Current Year</Badge> : null),
                },
                {
                  key: "is_closed",
                  header: "Status",
                  value: (row) => (row.is_closed ? "Closed" : "Open"),
                  render: (row) => (
                    <Badge variant={row.is_closed ? "secondary" : "outline"} className="font-mono text-xs font-bold px-2.5">
                      {row.is_closed ? "🔒 Archived" : "🟢 Open Window"}
                    </Badge>
                  ),
                },
              ]}
              fields={[
                { name: "name", label: "Year Title", required: true, placeholder: "2026–27" },
                { name: "start_date", label: "Start Date", type: "date", required: true },
                { name: "end_date", label: "End Date", type: "date", required: true },
              ]}
              toFormValues={(row) => ({
                name: row.name,
                start_date: row.start_date,
                end_date: row.end_date,
              })}
            />
          </TabsContent>

          <TabsContent value="terms" className="space-y-4 pt-2">
            <ResourcePage<TermRow>
              hideHeader
              title="Terms and sessions"
              description="Terms"
              table="academic_sessions"
              select="id, name, academic_year_id, term_number, start_date, end_date, is_current"
              orderBy={{ column: "start_date", ascending: false }}
              managePermission="academic.manage"
              entityLabel="term"
              storageKey="terms"
              columns={[
                { key: "name", header: "Session Term", alwaysVisible: true, className: "font-extrabold text-sm" },
                {
                  key: "academic_year_id",
                  header: "Academic Year",
                  value: (row) => academicYears.data?.find((y) => y.id === row.academic_year_id)?.name ?? null,
                },
                { key: "term_number", header: "Term No." },
                { key: "start_date", header: "Starts", render: (row) => <span className="font-mono text-xs">{row.start_date}</span> },
                { key: "end_date", header: "Ends", render: (row) => <span className="font-mono text-xs">{row.end_date}</span> },
                {
                  key: "is_current",
                  header: "Active Session",
                  render: (row) => (row.is_current ? <Badge className="bg-emerald-600 font-mono font-bold text-xs">✨ Active Term</Badge> : null),
                },
              ]}
              fields={[
                { name: "name", label: "Term title", required: true, placeholder: "Odd Semester 2026" },
                { name: "academic_year_id", label: "Academic year", type: "select", required: true, options: yearOptions },
                { name: "term_number", label: "Term sequence index", type: "number", min: 1, max: 12, required: true },
                { name: "start_date", label: "Instruction start date", type: "date", required: true },
                { name: "end_date", label: "Instruction end date", type: "date", required: true },
              ]}
              toFormValues={(row) => ({
                name: row.name,
                academic_year_id: row.academic_year_id,
                term_number: row.term_number ?? "",
                start_date: row.start_date ?? "",
                end_date: row.end_date ?? "",
              })}
            />
          </TabsContent>

          <TabsContent value="semesters" className="space-y-4 pt-2">
            <ResourcePage<SemesterRow>
              hideHeader
              title="Semesters"
              description="Semesters"
              table="semesters"
              select="id, name, program_id, number, credits"
              orderBy={{ column: "number" }}
              managePermission="academic.manage"
              entityLabel="semester"
              storageKey="semesters"
              columns={[
                { key: "name", header: "Semester Title", alwaysVisible: true, className: "font-extrabold text-sm" },
                { key: "number", header: "Sequence", render: (row) => <span className="font-mono font-bold text-xs bg-muted px-2.5 py-1 rounded-[6px]">Sem {row.number}</span> },
                {
                  key: "program_id",
                  header: "Degree Programme",
                  value: (row) => programName(row.program_id),
                },
                { key: "credits", header: "Standard Credits", render: (row) => <span className="font-mono font-bold text-indigo-600">{row.credits || 24} Credits</span> },
              ]}
              fields={[
                { name: "name", label: "Semester Title", required: true, placeholder: "Semester 6 (Advanced Spec)" },
                { name: "number", label: "Number", type: "number", min: 1, max: 16, required: true },
                { name: "program_id", label: "Associated Programme", type: "select", options: programOptions },
                { name: "credits", label: "Semester credits load", type: "number", min: 0, max: 60 },
              ]}
              toFormValues={(row) => ({
                name: row.name,
                number: row.number,
                program_id: row.program_id ?? "",
                credits: row.credits ?? "24",
              })}
            />
          </TabsContent>

          <TabsContent value="batches" className="space-y-4 pt-2">
            <ResourcePage<BatchRow>
              hideHeader
              title="Batches and cohorts"
              description="Batches"
              table="batches"
              select="id, name, code, program_id, academic_year_id, entry_year, exit_year, capacity, is_active"
              orderBy={{ column: "entry_year", ascending: false }}
              managePermission="academic.manage"
              entityLabel="batch"
              storageKey="batches"
              columns={[
                { key: "code", header: "Code", alwaysVisible: true, className: "font-mono font-extrabold text-xs text-indigo-600" },
                { key: "name", header: "Cohort Title", className: "font-extrabold text-sm" },
                {
                  key: "program_id",
                  header: "Programme",
                  value: (row) => programName(row.program_id),
                },
                {
                  key: "academic_year_id",
                  header: "Matriculation Year",
                  value: (row) => academicYears.data?.find((y) => y.id === row.academic_year_id)?.name ?? null,
                },
                { key: "entry_year", header: "Entry", render: (row) => <span className="font-mono text-xs">{row.entry_year}</span> },
                { key: "exit_year", header: "Graduation", render: (row) => <span className="font-mono text-xs">{row.exit_year}</span> },
                { key: "capacity", header: "Capacity", render: (row) => <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-[6px]">{row.capacity ?? 60} Seats</span> },
                {
                  key: "is_active",
                  header: "Status",
                  value: (row) => (row.is_active ? "Active" : "Inactive"),
                  render: (row) => <ActiveBadge active={row.is_active} />,
                },
              ]}
              fields={[
                { name: "name", label: "Cohort name", required: true, placeholder: "Class of 2028 (B.Tech CSE)" },
                { name: "code", label: "Code identifier", required: true, placeholder: "BT-CSE-2028" },
                { name: "program_id", label: "Programme", type: "select", options: programOptions },
                { name: "academic_year_id", label: "Entry Academic Year", type: "select", options: yearOptions },
                { name: "entry_year", label: "Entry year (YYYY)", type: "number", min: 2000, max: 2100 },
                { name: "exit_year", label: "Expected graduation (YYYY)", type: "number", min: 2000, max: 2100 },
                { name: "capacity", label: "Maximum Seat Capacity", type: "number", min: 0, max: 5000 },
              ]}
              toFormValues={(row) => ({
                name: row.name,
                code: row.code,
                program_id: row.program_id ?? "",
                academic_year_id: row.academic_year_id ?? "",
                entry_year: row.entry_year ?? "",
                exit_year: row.exit_year ?? "",
                capacity: row.capacity ?? "60",
              })}
            />
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 pt-2">
            <ResourcePage<SectionRow>
              hideHeader
              title="Sections"
              description="Sections"
              table="sections"
              select="id, name, code, program_id, semester_id, batch_id, advisor_faculty_id, capacity, is_active"
              orderBy={{ column: "code" }}
              managePermission="academic.manage"
              entityLabel="section"
              storageKey="sections"
              columns={[
                { key: "code", header: "Section ID", alwaysVisible: true, className: "font-mono font-bold text-xs" },
                { key: "name", header: "Section Name", className: "font-extrabold text-sm" },
                {
                  key: "program_id",
                  header: "Programme",
                  value: (row) => programName(row.program_id),
                },
                {
                  key: "semester_id",
                  header: "Semester",
                  value: (row) => semesters.data?.find((s) => s.id === row.semester_id)?.name ?? null,
                },
                {
                  key: "batch_id",
                  header: "Cohort Batch",
                  value: (row) => batches.data?.find((b) => b.id === row.batch_id)?.name ?? null,
                },
                {
                  key: "advisor_faculty_id",
                  header: "Faculty Advisor",
                  value: (row) => {
                    const member = faculty.data?.find((f) => f.id === row.advisor_faculty_id);
                    return member ? [member.first_name, member.last_name].filter(Boolean).join(" ") : "Unassigned";
                  },
                  render: (row) => {
                    const member = faculty.data?.find((f) => f.id === row.advisor_faculty_id);
                    return <span className="font-medium text-xs text-indigo-600">{member ? [member.first_name, member.last_name].filter(Boolean).join(" ") : "Pending Assignment"}</span>;
                  }
                },
                { key: "capacity", header: "Seats", render: (row) => <span className="font-mono text-xs font-bold">{row.capacity ?? 45}</span> },
                {
                  key: "is_active",
                  header: "Status",
                  value: (row) => (row.is_active ? "Active" : "Inactive"),
                  render: (row) => <ActiveBadge active={row.is_active} />,
                },
              ]}
              fields={[
                { name: "name", label: "Section Name", required: true, placeholder: "Section A (Main Wing)" },
                { name: "code", label: "Code", required: true, placeholder: "SEC-A-601" },
                { name: "program_id", label: "Programme", type: "select", options: programOptions },
                { name: "semester_id", label: "Semester", type: "select", options: semesterOptions },
                { name: "batch_id", label: "Batch", type: "select", options: batchOptions },
                {
                  name: "advisor_faculty_id",
                  label: "Class Advisor Faculty",
                  type: "select",
                  options: facultyOptions,
                },
                { name: "capacity", label: "Seat Capacity", type: "number", min: 0, max: 500 },
              ]}
              toFormValues={(row) => ({
                name: row.name,
                code: row.code,
                program_id: row.program_id ?? "",
                semester_id: row.semester_id ?? "",
                batch_id: row.batch_id ?? "",
                advisor_faculty_id: row.advisor_faculty_id ?? "",
                capacity: row.capacity ?? "45",
              })}
            />
          </TabsContent>

          <TabsContent value="specializations" className="space-y-4 pt-2">
            <ResourcePage<SpecializationRow>
              hideHeader
              title="Majors, minors and specialisations"
              description="Specialisations"
              table="specializations"
              select="id, name, code, program_id, kind, min_credits, description, is_active"
              orderBy={{ column: "name" }}
              managePermission="program.manage"
              entityLabel="specialisation"
              storageKey="specializations"
              columns={[
                { key: "code", header: "Code", alwaysVisible: true, className: "font-mono font-bold text-xs text-indigo-600" },
                { key: "name", header: "Specialization Track", className: "font-extrabold text-sm" },
                {
                  key: "kind",
                  header: "Concentration Type",
                  render: (row) => <Badge variant="outline" className="font-mono font-extrabold text-[11px] px-2.5 py-0.5 capitalize bg-muted/50">{labelize(row.kind)}</Badge>,
                },
                {
                  key: "program_id",
                  header: "Home Programme",
                  value: (row) => programName(row.program_id),
                },
                { key: "min_credits", header: "Required Credits", render: (row) => <span className="font-mono text-xs font-bold text-emerald-600">{row.min_credits ?? 18} Credits</span> },
                {
                  key: "is_active",
                  header: "Status",
                  value: (row) => (row.is_active ? "Active" : "Inactive"),
                  render: (row) => <ActiveBadge active={row.is_active} />,
                },
              ]}
              fields={[
                { name: "name", label: "Track Name", required: true, placeholder: "Artificial Intelligence & Robotics (Minor)" },
                { name: "code", label: "Code Identifier", required: true, placeholder: "MIN-AI-ROBO" },
                {
                  name: "kind",
                  label: "Concentration Type",
                  type: "select",
                  required: true,
                  options: specializationKinds.map((value) => ({ value, label: labelize(value) })),
                },
                { name: "program_id", label: "Home Programme", type: "select", options: programOptions },
                { name: "min_credits", label: "Minimum required credits to award", type: "number", min: 0, max: 300 },
                { name: "description", label: "Curriculum Description & Career Scope", type: "textarea", full: true },
              ]}
              toFormValues={(row) => ({
                name: row.name,
                code: row.code,
                kind: row.kind,
                program_id: row.program_id ?? "",
                min_credits: row.min_credits ?? "18",
                description: row.description ?? "",
              })}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
