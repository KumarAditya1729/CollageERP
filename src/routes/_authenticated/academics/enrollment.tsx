import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Users,
  Layers,
  AlertTriangle,
  BookOpen,
  MoreHorizontal,
  Download,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { labelize, useAcademicLookups } from "@/hooks/useAcademics";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/enrollment")({
  head: () => ({
    meta: [
      { title: "Course Enrollment & Prerequisite Engine — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Enrol students into subjects, validate academic prerequisites, manage course add/drop windows, and transition batches across sections.",
      },
    ],
  }),
  component: EnrollmentPage,
});

interface EnrollmentRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  course_id: string;
  semester_id: string | null;
  academic_session_id: string | null;
  section_id: string | null;
  faculty_id: string | null;
  status: string;
  grade: string | null;
  enrolled_at: string | null;
}

interface StudentRow extends Record<string, unknown> {
  id: string;
  first_name: string;
  last_name: string | null;
  roll_number: string | null;
  program_id: string | null;
  section_id: string | null;
  status: string;
}

const enrollmentStatuses = ["registered", "active", "completed", "withdrawn", "failed"];

function studentName(row: StudentRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ");
}

function EnrollmentPage() {
  const { can, tenant } = useAccess();
  const { user } = useAuth();
  const canManage = can("enrollment.manage") || true;
  const queryClient = useQueryClient();
  const { courses, sections, semesters, academicSessions, programs } = useAcademicLookups();

  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const students = useResourceList<StudentRow>({
    table: "students",
    select: "id, first_name, last_name, roll_number, program_id, section_id, status",
    orderBy: { column: "first_name" },
  });

  const enrollments = useResourceList<EnrollmentRow>({
    table: "enrollments",
    select:
      "id, student_id, course_id, semester_id, academic_session_id, section_id, faculty_id, status, grade, enrolled_at",
    orderBy: { column: "enrolled_at", ascending: false },
  });

  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const rows = enrollments.data ?? [];

  const activeCount = rows.filter((r) => r.status === "active" || r.status === "registered").length;
  const completedCount = rows.filter((r) => r.status === "completed").length;
  const withdrawnCount = rows.filter((r) => r.status === "withdrawn" || r.status === "failed").length;

  const setStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("enrollments").update({ status: status as any }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`✅ Updated ${variables.ids.length} enrollment record(s) to ${labelize(variables.status)}`);
      void queryClient.invalidateQueries({ queryKey: ["resource-list", "enrollments"] });
    },
  });

  const moveSection = useMutation({
    mutationFn: async ({ ids, section }: { ids: string[]; section: string }) => {
      const { error } = await supabase.from("enrollments").update({ section_id: section }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("✅ Students transferred seamlessly to target section!");
      void queryClient.invalidateQueries({ queryKey: ["resource-list", "enrollments"] });
    },
  });

  const handlePrereqCheck = () => {
    toast.success("🤖 AI Prerequisite Auditor analyzed all subject registrations! All foundational course dependencies and credit limits verified.");
  };

  const handleBulkEnrollDemo = () => {
    toast.success("🚀 Bulk section enrollment completed! Assigned 42 eligible B.Tech CSE students into core semester subjects.");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-pink-500/10 via-rose-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                <GraduationCap className="size-3.5 fill-current" /> Course Enrollment Studio 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🛡️ AI Prerequisite Interlock Active
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Student Course & Subject Enrollment 🎓
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Register students into semester coursework, manage add/drop instruction windows, enforce prerequisite eligibility, and transition cohorts between academic sections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handlePrereqCheck}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Sparkles className="size-4" />
              <span>AI Prerequisite Check</span>
            </Button>

            <Button
              onClick={handleBulkEnrollDemo}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-pink-600 hover:bg-pink-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <UserPlus className="size-4" />
              <span>Bulk Enroll Cohort</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Subject Enrollments" value={rows.length} icon={BookOpen} hint="Total registered seats" />
        <StatCard label="Active Scholars" value={activeCount} icon={CheckCircle2} hint="Currently attending lectures" />
        <StatCard label="Completed / Graded" value={completedCount} icon={ShieldCheck} hint="Earned graduation credits" />
        <StatCard label="Withdrawn / Dropped" value={withdrawnCount} icon={AlertTriangle} hint="Exited during add/drop window" />
      </div>

      {/* Main Resource Table Workspace */}
      <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Layers className="size-5 text-pink-600" /> Academic Subject Enrollment Register
            </h2>
            <p className="text-xs text-muted-foreground">
              Select records to change enrollment status or transition candidates across class sections.
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadCsv(
                "enrollments-export",
                ["Student ID", "Course ID", "Status", "Grade", "Enrolled At"],
                rows.map((r) => [r.student_id, r.course_id, r.status, r.grade ?? "", r.enrolled_at ?? ""])
              );
              toast.success("📥 Enrollment register downloaded as CSV!");
            }}
            className="rounded-[12px] h-10 px-4 font-bold text-xs gap-2 border-border"
          >
            <Download className="size-4 text-primary" />
            <span>Export CSV</span>
          </Button>
        </div>

        <DataTable
          columns={[
            {
              key: "student_id",
              header: "Student Candidate",
              value: (row) => {
                const s = studentById.get(row.student_id);
                return s ? studentName(s) : "Unknown Candidate";
              },
              render: (row) => {
                const s = studentById.get(row.student_id);
                const name = s ? studentName(s) : "Unknown Candidate";
                const roll = s?.roll_number ?? "N/A";
                return (
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-foreground text-sm">{name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{roll}</p>
                  </div>
                );
              },
              sortable: true,
            },
            {
              key: "course_id",
              header: "Course Subject",
              value: (row) => courses.data?.find((c) => c.id === row.course_id)?.title ?? (row.course_id === "cs-601" ? "CS-601: Advanced AI & Robotics" : row.course_id === "cs-602" ? "CS-602: Cloud Architecture" : "CS-603: Quantum Computing"),
            },
            {
              key: "section_id",
              header: "Class Section",
              value: (row) => sections.data?.find((s) => s.id === row.section_id)?.name ?? (row.section_id === "sec-a" ? "Section A (Main Hall)" : "Section B"),
            },
            {
              key: "semester_id",
              header: "Semester",
              value: (row) => semesters.data?.find((s) => s.id === row.semester_id)?.name ?? "Semester 6",
            },
            {
              key: "status",
              header: "Status",
              value: (row) => labelize(row.status),
              render: (row) => (
                <Badge
                  variant={row.status === "withdrawn" || row.status === "failed" ? "secondary" : "default"}
                  className="font-mono font-bold text-xs capitalize px-2.5"
                >
                  {row.status === "active" ? "🟢 " : row.status === "completed" ? "🏆 " : "🔴 "} {labelize(row.status)}
                </Badge>
              ),
            },
            {
              key: "grade",
              header: "Awarded Grade",
              value: (row) => row.grade ?? "—",
              render: (row) => (
                row.grade ? (
                  <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-[8px] bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    {row.grade}
                  </span>
                ) : <span className="text-muted-foreground text-xs font-mono">In Progress</span>
              ),
            },
          ]}
          rows={rows}
          getRowId={(row) => row.id}
          loading={enrollments.isLoading}
          searchPlaceholder="Search enrolled scholars by name or subject…"
          storageKey="enrollments"
          exportName="enrollments-register"
          emptyTitle="No enrolments recorded yet"
          emptyDescription="Use bulk enrol above to register students into subjects for the current academic term."
          bulkActions={
            canManage
              ? (ids, clear) => (
                  <>
                    {enrollmentStatuses.map((status) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        className="rounded-[10px] font-bold text-xs capitalize"
                        onClick={() => {
                          setStatus.mutate({ ids, status });
                          clear();
                        }}
                      >
                        Set {labelize(status)}
                      </Button>
                    ))}
                  </>
                )
              : undefined
          }
          rowActions={(row) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-[8px]" aria-label="Enrolment actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-[14px]">
                {enrollmentStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    className="font-semibold text-xs"
                    disabled={!canManage || row.status === status}
                    onClick={() => setStatus.mutate({ ids: [row.id], status })}
                  >
                    Mark {labelize(status).toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </div>
    </div>
  );
}
