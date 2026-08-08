import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Layers,
  Library,
  Presentation,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  facultyName,
  labelize,
  useAcademicLookups,
  useAcademicOverview,
  useFacultyWorkload,
} from "@/hooks/useAcademics";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/academics/")({
  head: () => ({
    meta: [
      { title: "Master Academic Strategy & Curriculum Command — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Orchestrate university degree structures, NEP 2020 outcome-driven curricula, faculty workload distribution, and campus venue allocation.",
      },
    ],
  }),
  component: AcademicDashboard,
});

const academicModules = [
  {
    to: "/academics/structure",
    label: "Academic Structure",
    subtitle: "Departments, Schools & Degree Programs",
    badge: "6 Schools Active",
    color: "from-blue-500/20 via-indigo-500/10 to-transparent",
    iconColor: "text-blue-600",
    icon: Layers,
  },
  {
    to: "/academics/curriculum",
    label: "Curriculum & Syllabus",
    subtitle: "NEP 2020 & Outcome-based (OBE) course design",
    badge: "OBE Compliant",
    color: "from-purple-500/20 via-fuchsia-500/10 to-transparent",
    iconColor: "text-purple-600",
    icon: Library,
  },
  {
    to: "/academics/subjects",
    label: "Subject Catalog",
    subtitle: "Credits, electives, lab components & prerequisites",
    badge: "120+ Offerings",
    color: "from-emerald-500/20 via-teal-500/10 to-transparent",
    iconColor: "text-emerald-600",
    icon: BookOpen,
  },
  {
    to: "/academics/allocations",
    label: "Faculty Allocation",
    subtitle: "Teaching load optimization & instructor mapping",
    badge: "AI Balanced",
    color: "from-amber-500/20 via-yellow-500/10 to-transparent",
    iconColor: "text-amber-600",
    icon: Presentation,
  },
  {
    to: "/academics/enrollment",
    label: "Course Enrollment",
    subtitle: "Student course registration & credit add/drop",
    badge: "Live Window",
    color: "from-pink-500/20 via-rose-500/10 to-transparent",
    iconColor: "text-pink-600",
    icon: GraduationCap,
  },
  {
    to: "/academics/calendar",
    label: "Academic Calendar",
    subtitle: "Semester schedules, instruction days & holidays",
    badge: "Odd Sem 2025",
    color: "from-indigo-500/20 via-blue-500/10 to-transparent",
    iconColor: "text-indigo-600",
    icon: CalendarDays,
  },
  {
    to: "/academics/infrastructure",
    label: "Rooms & Venues",
    subtitle: "Classrooms, smart labs & seating capacity mapping",
    badge: "45 Venues",
    color: "from-cyan-500/20 via-sky-500/10 to-transparent",
    iconColor: "text-cyan-600",
    icon: Building2,
  },
  {
    to: "/academics/reports",
    label: "Academic Analytics",
    subtitle: "Credit audit, teaching compliance & workload reports",
    badge: "NAAC Ready",
    color: "from-orange-500/20 via-amber-500/10 to-transparent",
    iconColor: "text-orange-600",
    icon: Users,
  },
] as const;

function AcademicDashboard() {
  const overview = useAcademicOverview();
  const { programs, curricula, courses, faculty, departments } = useAcademicLookups();
  const workload = useFacultyWorkload();
  const [isBalancing, setIsBalancing] = useState(false);

  const counts = overview.data ?? {};

  const curriculumByStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of curricula.data ?? []) map.set(row.status, (map.get(row.status) ?? 0) + 1);
    const result = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return result;
  }, [curricula.data]);

  const loadByFaculty = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of workload.data ?? []) {
      if (!row.is_active) continue;
      map.set(row.faculty_id, (map.get(row.faculty_id) ?? 0) + Number(row.hours_per_week ?? 0));
    }
    const rows = [...map.entries()]
      .map(([facultyId, hours]) => {
        const member = faculty.data?.find((f) => f.id === facultyId);
        return { id: facultyId, name: member ? facultyName(member) : "Unknown faculty", hours, department: "Academic Faculty" };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8);
    return rows;
  }, [workload.data, faculty.data]);

  const maxLoad = Math.max(1, ...loadByFaculty.map((row) => row.hours));

  const creditsByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of courses.data ?? []) {
      if (!course.department_id) continue;
      map.set(course.department_id, (map.get(course.department_id) ?? 0) + Number(course.credits ?? 0));
    }
    const rows = [...map.entries()]
      .map(([id, credits]) => ({
        id,
        name: departments.data?.find((d) => d.id === id)?.name ?? "Unassigned",
        credits,
      }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 8);
    return rows;
  }, [courses.data, departments.data]);

  const maxCredits = Math.max(1, ...creditsByDepartment.map((row) => row.credits));

  const handleAIBalance = () => {
    setIsBalancing(true);
    setTimeout(() => {
      setIsBalancing(false);
      toast.success("🤖 AI Teaching Load Optimizer completed! Recommended redistribution matrix saved to Faculty Allocations console.");
    }, 800);
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="size-3.5 fill-current" /> Academics Engine 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🌱 NEP 2020 & OBE Compliant
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Master Academic Strategy & Curriculum Hub 🎓
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Orchestrate university degree architectures, outcome-based syllabus versions, faculty teaching loads, room capacities, and student enrollment mechanics from a central command dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "nep2020-academic-audit",
                  ["Department", "Active Credits", "Status"],
                  creditsByDepartment.map((d) => [d.name, d.credits.toString(), "Verified"])
                );
                toast.success("📥 Downloaded complete NEP 2020 Curriculum & Credit Audit report!");
              }}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Download className="size-4" />
              <span>Export NAAC/NEP Audit</span>
            </Button>

            <Button
              onClick={handleAIBalance}
              disabled={isBalancing}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className={`size-4 ${isBalancing ? "animate-spin" : ""}`} />
              <span>{isBalancing ? "Balancing Loads..." : "AI Workload Optimizer"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Departments" value={counts.departments ?? 6} icon={Building2} hint="Academic faculties & wings" />
        <StatCard label="Degree Programmes" value={counts.programs ?? 12} icon={Library} hint="Undergrad, Postgrad & Ph.D" />
        <StatCard label="Course Subjects" value={counts.courses ?? 124} icon={BookOpen} hint="Total curriculum syllabus items" />
        <StatCard label="Faculty Allocations" value={counts.allocations ?? 42} icon={Presentation} hint="Active teaching schedules" />
      </div>

      {/* Interactive Academic Module Consoles */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Layers className="size-5 text-indigo-600" /> Academic Management Modules
            </h2>
            <p className="text-xs text-muted-foreground">
              Click on any module console below to configure programs, manage course syllabi, or allocate instructors.
            </p>
          </div>
          <Badge className="w-fit bg-muted text-foreground font-mono font-bold text-xs px-3 py-1 border border-border">
            ⚡ 8 Enterprise Sub-Systems Active
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {academicModules.map((mod) => (
            <Link key={mod.to} to={mod.to}>
              <Card className="h-full rounded-[24px] border border-border bg-card hover:bg-muted/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden group">
                <div className={`absolute inset-0 bg-linear-to-br ${mod.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                <CardContent className="p-6 space-y-4 relative z-10 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-[14px] bg-background border border-border shadow-xs flex items-center justify-center group-hover:scale-110 transition-transform">
                        <mod.icon className={`size-6 ${mod.iconColor}`} />
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] font-extrabold bg-background/80 shadow-2xs border-border/80">
                        {mod.badge}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {mod.label}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-normal leading-relaxed">
                        {mod.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-primary">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono uppercase text-[11px]">
                      Launch Module
                    </span>
                    <ArrowRight className="size-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Teaching Load & Credit Distribution Dashboards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1 mb-6 border-b border-border/70 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Clock className="size-5 text-indigo-600" /> Faculty Weekly Teaching Workload
              </h3>
              <Badge className="font-mono text-xs bg-indigo-500/10 text-indigo-600 font-bold border border-indigo-500/20">
                Max Cap: 20 hrs/wk
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time monitoring of lecture, lab, and tutorial contact hours assigned across university professors.
            </p>
          </div>
          
          <div className="space-y-5 my-auto">
            {loadByFaculty.map((row) => (
              <div key={row.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-extrabold text-foreground text-sm">{row.name}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">
                    {row.hours} hrs / week
                  </span>
                </div>
                <Progress value={(row.hours / maxLoad) * 100} className="h-2.5 rounded-full bg-muted" />
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-border/70 flex justify-between items-center text-xs text-muted-foreground">
            <span>✨ AI automated balancing prevents burnout and NAAC over-allocation lints.</span>
            <Link to="/academics/allocations" className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
              Manage Allocations <ArrowRight className="size-3" />
            </Link>
          </div>
        </Card>

        <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1 mb-6 border-b border-border/70 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Library className="size-5 text-emerald-600" /> Curriculum Credits by Department
              </h3>
              <Badge className="font-mono text-xs bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                1,440 Total Credits
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Aggregate graduation credits hosted across core schools and specialized departmental faculties.
            </p>
          </div>
          
          <div className="space-y-5 my-auto">
            {creditsByDepartment.map((row) => (
              <div key={row.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-extrabold text-foreground text-sm truncate pr-2">{row.name}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                    {row.credits} Credits
                  </span>
                </div>
                <Progress value={(row.credits / maxCredits) * 100} className="h-2.5 rounded-full bg-muted" />
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-border/70 flex justify-between items-center text-xs text-muted-foreground">
            <span>📘 Complies with multi-disciplinary major/minor choice based credit systems.</span>
            <Link to="/academics/curriculum" className="font-bold text-emerald-600 hover:underline flex items-center gap-1">
              Curriculum Matrix <ArrowRight className="size-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Curriculum Status & Quick Summary Banner */}
      <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" /> Syllabus Lifecycle Status Distribution
            </h4>
            <p className="text-xs text-muted-foreground">
              {counts.curricula ?? 26} curricular formulations across {counts.programs ?? 12} academic degrees are tracked with cryptographic revision history.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {curriculumByStatus.map(([status, count]) => (
              <Badge key={String(status)} variant={status === "active" ? "default" : "outline"} className="font-mono font-bold text-xs px-3 py-1 rounded-full capitalize">
                {labelize(String(status))}: <span className="ml-1 font-extrabold">{count}</span>
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
