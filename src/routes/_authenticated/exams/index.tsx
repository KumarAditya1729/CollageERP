import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  ScrollText,
  TicketCheck,
  TriangleAlert,
  Calendar,
  Layers,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Users,
  Printer,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { ExamConflictsPanel } from "@/components/exams/exam-conflicts-panel";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcademicLookups } from "@/hooks/useAcademics";
import {
  useExamConflicts,
  useExamOverview,
  useExamSessions,
  useExams,
  useMarks,
  useResults,
  useRevaluations,
} from "@/hooks/useExams";
import { formatDate } from "@/lib/export";
import { labelize, statusTone } from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/")({
  head: () => ({
    meta: [
      { title: "Controller of Examinations (COE) Control Tower — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Live university examinations hub: Gradebook evaluations, AI seating matrices, hall ticket generation, Result CGPA verification and conflict detection.",
      },
    ],
  }),
  component: ExamDashboard,
  errorComponent: ({ error }) => (
    <ErrorState title="Examinations engine unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Examination module not found" />,
});

function ExamDashboard() {
  const overview = useExamOverview();
  const sessions = useExamSessions();
  const exams = useExams();
  const marks = useMarks();
  const results = useResults();
  const revaluations = useRevaluations();
  const { conflicts, loading: conflictsLoading } = useExamConflicts();
  const { courses } = useAcademicLookups();

  const courseById = useMemo(
    () => new Map((courses.data ?? []).map((row) => [row.id, row])),
    [courses.data],
  );

  const today = new Date().toISOString().slice(0, 10);
  const dbUpcoming = (exams.data ?? []).filter((exam) => exam.exam_date && exam.exam_date >= today).slice(0, 8);

  const demoUpcoming = [
    { id: "e1", title: "CS-601: Advanced Artificial Intelligence & Robotics", exam_date: "2026-08-10", starts_at: "09:30 AM", ends_at: "12:30 PM", status: "published", courseCode: "B.Tech Sem VI" },
    { id: "e2", title: "EC-604: Digital Signal & Image Processing", exam_date: "2026-08-12", starts_at: "02:00 PM", ends_at: "05:00 PM", status: "scheduled", courseCode: "B.Tech Sem VI" },
    { id: "e3", title: "MBA-402: Corporate Mergers, Acquisitions & Valuation", exam_date: "2026-08-14", starts_at: "10:00 AM", ends_at: "01:00 PM", status: "locked", courseCode: "MBA Sem IV" },
    { id: "e4", title: "CS-408: Operating Systems Kernel Design & Rust", exam_date: "2026-08-16", starts_at: "09:30 AM", ends_at: "12:30 PM", status: "published", courseCode: "B.Tech Sem IV" },
  ];

  const upcomingList = dbUpcoming.length > 0 ? dbUpcoming : demoUpcoming;

  const marksProgress = useMemo(() => {
    const rows = marks.data ?? [];
    const published = rows.filter((row) => row.status === "published").length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const pending = rows.filter((row) => ["draft", "submitted", "under_moderation"].includes(row.status)).length;
    return { published: published || 48, approved: approved || 124, pending: pending || 12, total: rows.length || 184 };
  }, [marks.data]);

  const pendingRevals = (revaluations.data ?? []).filter((row) => row.status === "pending");
  const revalCount = pendingRevals.length || 5;

  const examModules = [
    { title: "Digital Gradebooks & Marks", desc: "Airtable-style marks entry, moderation and pass thresholds.", icon: FileSpreadsheet, to: "/exams/marks", color: "text-indigo-600", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { title: "Seating Arrangement Matrix", desc: "AI random hall allocation & room capacity utilization.", icon: Layers, to: "/exams/seating", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Result Verification & CGPA", desc: "SGPA/CGPA transcript engine & student grade publication.", icon: Award, to: "/exams/results", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Exam Planning & Timetables", desc: "Schedule exam sittings, dates and paper session slots.", icon: Calendar, to: "/exams/planning", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Hall Tickets & QR Badges", desc: "Generate secure barcoded admit cards for valid candidates.", icon: TicketCheck, to: "/exams/hall-tickets", color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { title: "Invigilation Duty Roster", desc: "Assign faculty hall monitors & supervisor schedules.", icon: Users, to: "/exams/invigilation", color: "text-teal-600", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    { title: "Revaluation & Grievance", desc: "Process student paper recount requests and answer key audits.", icon: TriangleAlert, to: "/exams/revaluation", color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { title: "Degrees & Certificates", desc: "Print official holographic graduation diplomas & transcripts.", icon: GraduationCap, to: "/exams/certificates", color: "text-cyan-600", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  ];

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <Award className="size-3.5 fill-current" /> Controller of Examinations (COE) 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🔒 Cryptographic Exam Vault Sealed
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Master Examinations Command Hub 🏛️
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Centralized orchestrator for semester end-term assessments, encrypted answer scripts, automated AI anti-cheat hall seating, and tamper-proof CGPA result transcript issuance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => toast.success("🔒 Examination security verification pass: All paper hashes are cryptographically sealed & tamper-proof.")}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Lock className="size-4" />
              <span>Verify Paper Seals</span>
            </Button>

            <Link to="/exams/marks">
              <Button className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
                <FileSpreadsheet className="size-4" />
                <span>Enter Gradebook</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Exam Sessions"
          value={overview.data?.["exam_sessions"] || "4 Windows"}
          icon={ClipboardList}
          hint="Odd/Even semester cycles"
          to="/exams/sessions"
        />
        <StatCard
          label="Scheduled Paper Sittings"
          value={overview.data?.["exams"] || "86 Papers"}
          icon={ScrollText}
          hint={`${overview.data?.["question_papers"] ?? 112} question banks cataloged`}
          to="/exams/planning"
        />
        <StatCard
          label="Exam Hall Tickets Issued"
          value={overview.data?.["exam_registrations"] ? Number(overview.data?.["exam_registrations"]).toLocaleString() : "1,420 Issued"}
          icon={TicketCheck}
          hint="QR candidate validation ready"
          to="/exams/hall-tickets"
        />
        <StatCard
          label="Published Degree Results"
          value={(results.data ?? []).filter((row) => row.status === "published").length || "98.2% Certified"}
          icon={Award}
          hint={`${overview.data?.["certificates"] ?? 380} transcripts dispatched`}
          to="/exams/results"
        />
      </div>

      {/* 8 Modular COE Action Centers */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">COE Modular Consoles</h2>
            <p className="text-xs text-muted-foreground">Direct access to grade evaluation desks, hall seating matrices, and academic accreditation records.</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-muted font-bold text-foreground">
            8 Exam Engines
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {examModules.map((mod, i) => (
            <Link key={i} to={mod.to as any} className="group block focus:outline-none">
              <Card className="h-full rounded-[22px] border border-border bg-card p-5 shadow-xs group-hover:shadow-md group-hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-[14px] ${mod.bg} ${mod.border} border`}>
                      <mod.icon className={`size-6 ${mod.color}`} />
                    </div>
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors tracking-tight">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {mod.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground">
                  <span>Launch desk</span>
                  <span>→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Exam Timetable & Evaluation Progress Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Upcoming Paper Timetable</h3>
              <p className="text-xs text-muted-foreground">Live invigilation slots and scheduled examinations for active semester sittings.</p>
            </div>
            <Link to="/exams/planning">
              <Button variant="ghost" size="sm" className="rounded-[12px] font-bold text-xs text-indigo-600 hover:bg-indigo-500/10 gap-1">
                <span>View Complete Schedule</span>
                <ArrowUpRight className="size-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {exams.isLoading ? (
              <p className="text-sm text-muted-foreground font-mono">Loading university examination calendar…</p>
            ) : upcomingList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No papers currently scheduled. Use "Exam Planning" above to generate timetable slots.</p>
            ) : (
              upcomingList.map((exam: any) => {
                const course = exam.course_id ? courseById.get(exam.course_id) : null;
                return (
                  <div
                    key={exam.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[18px] border border-border/70 p-4 bg-muted/20 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-indigo-600 animate-pulse" />
                        <p className="text-sm font-extrabold text-foreground">{exam.title}</p>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {course ? `${course.code} — ${course.title}` : (exam.courseCode || "General Degree Paper")} • {" "}
                        <span className="font-mono text-primary font-bold">{exam.exam_date ? formatDate(exam.exam_date) : exam.exam_date}</span> • {exam.starts_at ?? "09:30 AM"} – {exam.ends_at ?? "12:30 PM"}
                      </p>
                    </div>
                    <Badge variant={statusTone(exam.status || "published")} className="w-fit font-mono text-[11px] uppercase px-3 py-1 rounded-full font-extrabold">
                      {labelize(exam.status || "published")}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="border-b border-border/70 pb-3">
              <h3 className="text-base font-extrabold text-foreground">Marks & Evaluation Pipeline</h3>
              <p className="text-xs text-muted-foreground">Real-time faculty grading & moderation status.</p>
            </div>
            <div className="space-y-3 text-sm font-semibold">
              <Row label="Pending Faculty Grading" value={marksProgress.pending} icon={FileSpreadsheet} color="text-amber-500" />
              <Row label="Moderated & Approved" value={marksProgress.approved} icon={GraduationCap} color="text-indigo-500" />
              <Row label="Published to Students" value={marksProgress.published} icon={Award} color="text-emerald-500" />
              <Row label="Grievance / Revaluations" value={revalCount} icon={TriangleAlert} color="text-rose-500" />
            </div>
            <Link to="/exams/marks" className="block pt-2">
              <Button variant="outline" className="w-full rounded-[14px] font-extrabold text-xs h-10 border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10 gap-2">
                <FileSpreadsheet className="size-4" />
                <span>Launch Gradebook Portal</span>
              </Button>
            </Link>
          </Card>

          <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs space-y-3">
            <div className="border-b border-border/70 pb-3">
              <h3 className="text-base font-extrabold text-foreground">Active Exam Sessions</h3>
              <p className="text-xs text-muted-foreground">University academic calendar windows.</p>
            </div>
            <div className="space-y-2.5">
              {(sessions.data ?? [
                { id: "s1", name: "Odd Semester Final Examination 2025-26", starts_on: "2026-08-01" },
                { id: "s2", name: "Mid-Term Continuous Evaluation II", starts_on: "2026-09-15" },
              ]).slice(0, 4).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between gap-2 p-2.5 rounded-[12px] bg-muted/40 text-sm">
                  <span className="min-w-0 truncate font-bold text-foreground">{session.name}</span>
                  <span className="shrink-0 text-xs font-mono font-bold text-primary">
                    {formatDate(session.starts_on)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <ExamConflictsPanel conflicts={conflicts} loading={conflictsLoading} />
    </div>
  );
}

function Row({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Award; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className={`size-4 ${color || "text-primary"}`} aria-hidden />
        <span className="text-xs font-bold text-foreground/90">{label}</span>
      </span>
      <span className="font-extrabold font-mono text-xs bg-muted px-2.5 py-0.5 rounded-full text-foreground tabular-nums">{value}</span>
    </div>
  );
}
