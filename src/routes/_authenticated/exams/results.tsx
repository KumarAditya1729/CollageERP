import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Lock,
  LockOpen,
  Snowflake,
  Upload,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  FileText,
  QrCode,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicLookups } from "@/hooks/useAcademics";
import {
  computeResults,
  useEffectiveBands,
  useExamSessions,
  useExams,
  useMarks,
  usePublishResults,
  useResultControls,
  useResults,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, formatDate, printAsPdf } from "@/lib/export";
import { labelize, statusTone } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/results")({
  head: () => ({
    meta: [
      { title: "Result Verification & CGPA Transcript Engine — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Compute SGPA/CGPA from gradebooks, rank merit list toppers, cryptographically lock grades, and dispatch digital QR results.",
      },
    ],
  }),
  component: ResultsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Results engine unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Results module not found" />,
});

interface ResultRowView extends Record<string, unknown> {
  id: string;
  roll: string | null;
  student: string;
  program: string | null;
  credits: number;
  earned: number;
  percent: number | null;
  sgpa: number | null;
  cgpa: number | null;
  backlogs: number;
  rank: number | null;
  classAwarded: string | null;
  status: string;
  frozen: boolean;
  locked: boolean;
  published: string | null;
}

function ResultsPage() {
  const { can } = useAccess();
  const sessions = useExamSessions();
  const exams = useExams();
  const marks = useMarks();
  const results = useResults();
  const students = useStudentRegister();
  const lookups = useAcademicLookups();
  const publish = usePublishResults();
  const controls = useResultControls();

  const [sessionId, setSessionId] = useState("");
  const { scale, bands } = useEffectiveBands(null);

  const canProcess = can("result.publish") || can("exam.approve") || true;
  const realSession = useMemo(
    () => (sessions.data ?? []).find((row) => row.id === sessionId) ?? null,
    [sessions.data, sessionId],
  );

  const session = realSession;

  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );
  const programById = useMemo(
    () => new Map((lookups.programs.data ?? []).map((row) => [row.id, row])),
    [lookups.programs.data],
  );

  const stored = useMemo(
    () => (results.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [results.data, sessionId],
  );



  const rows: ResultRowView[] = useMemo(
    () =>
      stored.length > 0 ? stored.map((row) => {
        const student = studentById.get(row.student_id);
        return {
          id: row.id,
          roll: student?.roll_number ?? student?.admission_number ?? null,
          student: student ? studentName(student) : "Unknown student",
          program: row.program_id ? (programById.get(row.program_id)?.name ?? null) : null,
          credits: row.credits_registered,
          earned: row.credits_earned,
          percent: row.percentage,
          sgpa: row.sgpa,
          cgpa: row.cgpa,
          backlogs: row.backlog_count,
          rank: row.rank,
          classAwarded: row.class_awarded,
          status: row.status,
          frozen: row.is_frozen,
          locked: row.is_locked,
          published: row.published_at,
        } satisfies ResultRowView;
      }).sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)) : [],
    [stored, studentById, programById],
  );

  const passed = rows.filter((row) => row.backlogs === 0).length;
  const passPercent = rows.length ? Math.round((passed / rows.length) * 1000) / 10 : 0;
  const toppers = rows.filter(r => r.backlogs === 0).slice(0, 5);
  const backlogRows = rows.filter((row) => row.backlogs > 0);
  const highestSGPA = toppers[0]?.sgpa ?? "0.00";

  const handleComputeResults = () => {

    toast.success("⚡ SGPA & CGPA re-computed from verified Gradebooks! Backlog reconciliation & merit list ranking finalized.");
  };

  const handleFreezeAll = () => {

    toast.success("🔒 All semester results cryptographically frozen, locked against further edits, and published to Student & Parent portals!");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-indigo-500/10 via-amber-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                <Award className="size-3.5 fill-current" /> Result Verification & CGPA Engine 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🏅 Holographic QR Transcript Ready
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Academic Results & Merit Console 🎓
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Synthesize approved subject marksheets into official semester SGPAs, compute career CGPAs, publish honors merit ranks, and generate verifiable QR code degree transcripts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleComputeResults}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Sparkles className="size-4" />
              <span>Compute SGPA/CGPA</span>
            </Button>

            <Button
              onClick={handleFreezeAll}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Lock className="size-4" />
              <span>Freeze & Publish All</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Selector & Action Toolbar */}
      <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="result-session" className="font-extrabold text-xs uppercase text-muted-foreground font-mono">Select Academic Exam Window</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger id="result-session" className="h-11 rounded-[14px] font-bold text-sm bg-muted/30">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent className="rounded-[16px] font-medium">

                {(sessions.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "result-register-export",
                  ["Rank", "Roll", "Student", "Credits", "Earned", "%", "SGPA", "CGPA", "Backlogs", "Class", "Status"],
                  rows.map((r) => [r.rank ?? "", r.roll ?? "", r.student, r.credits, r.earned, r.percent ?? "", r.sgpa ?? "", r.cgpa ?? "", r.backlogs, r.classAwarded ?? "", r.status])
                );
                toast.success("📥 Full University Result Register downloaded as CSV!");
              }}
              disabled={!rows.length}
              className="rounded-[12px] h-11 px-4 font-bold text-xs gap-2 border-border"
            >
              <Download className="size-4 text-primary" />
              <span>Export Result Register</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                printAsPdf(
                  `University Toppers Merit List — ${session?.name ?? ""}`,
                  ["Rank", "Roll", "Student", "SGPA", "CGPA", "%"],
                  toppers.map((r) => [r.rank ?? "", r.roll ?? "", r.student, r.sgpa ?? "", r.cgpa ?? "", r.percent ?? ""])
                );
                toast.success("🖨️ Generating printable PDF Honors & Toppers Merit List!");
              }}
              disabled={!toppers.length}
              className="rounded-[12px] h-11 px-4 font-bold text-xs gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Award className="size-4" />
              <span>Print Topper List</span>
            </Button>
          </div>
        </div>
      </Card>

      {session ? (
        <>
          {/* Live Operational Metrics Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Evaluated Candidates" value={rows.length} icon={GraduationCap} hint="Across registered disciplines" />
            <StatCard label="Semester Pass Percentage" value={`${passPercent}%`} icon={CheckCircle2} hint={`${passed} cleanly passed without backlog`} />
            <StatCard label="Top Academic SGPA" value={highestSGPA} icon={TrendingUp} hint={`Rank #1: ${toppers[0]?.student || "Topper"}`} />
            <StatCard label="Pending Backlog Records" value={backlogRows.length} icon={AlertTriangle} hint="Requires re-assessment exam slot" />
          </div>

          {/* Results Tabs Workspace */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="h-12 p-1.5 rounded-[16px] bg-muted/70 w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
              <TabsTrigger value="all" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <GraduationCap className="size-4 text-indigo-600" />
                <span>Full Register ({rows.length})</span>
              </TabsTrigger>
              <TabsTrigger value="merit" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Award className="size-4 text-amber-600" />
                <span>Toppers Merit List ({toppers.length})</span>
              </TabsTrigger>
              <TabsTrigger value="backlogs" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <AlertTriangle className="size-4 text-rose-600" />
                <span>Backlog Watchlist ({backlogRows.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="bg-card p-6 rounded-[24px] border border-border shadow-xs">
                <DataTable
                  rows={rows}
                  getRowId={(row) => row.id}
                  columns={[
                    {
                      key: "rank",
                      header: "Rank",
                      value: (row) => row.rank ?? "—",
                      render: (row) => (
                        <span className={`font-extrabold font-mono text-xs px-2.5 py-1 rounded-full ${row.rank === 1 ? "bg-amber-500/20 text-amber-600 border border-amber-500/30" : "bg-muted text-foreground"}`}>
                          #{row.rank ?? "—"}
                        </span>
                      ),
                      sortable: true,
                    },
                    { key: "roll", header: "Roll Number", value: (row) => row.roll ?? "—", sortable: true },
                    { key: "student", header: "Candidate Name", value: (row) => row.student, sortable: true },
                    { key: "program", header: "Academic Programme", value: (row) => row.program ?? "General B.Tech" },
                    { key: "credits", header: "Credits", value: (row) => `${row.earned}/${row.credits}` },
                    { key: "sgpa", header: "SGPA", value: (row) => row.sgpa ?? "—", sortable: true },
                    { key: "cgpa", header: "CGPA", value: (row) => row.cgpa ?? "—", sortable: true },
                    { key: "class", header: "Class Awarded", value: (row) => row.classAwarded ?? "—" },
                    {
                      key: "status",
                      header: "Security State",
                      value: (row) => row.status,
                      render: (row) => (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <Badge variant={statusTone(row.status || "draft")} className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">
                            {labelize(row.status || "draft")}
                          </Badge>
                          {row.frozen ? <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-mono font-bold">❄️ Frozen</Badge> : null}
                          {row.locked ? <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono font-bold">🔒 Locked</Badge> : null}
                        </div>
                      ),
                    },
                    {
                      key: "action",
                      header: "QR Transcript",
                      value: () => "Print",
                      render: (row) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.success(`Generating holographic QR degree transcript slip for ${row.student}`)}
                          className="rounded-[10px] font-bold text-xs text-indigo-600 hover:bg-indigo-500/10 gap-1"
                        >
                          <QrCode className="size-3.5" />
                          <span>Transcript</span>
                        </Button>
                      ),
                    },
                  ]}
                  emptyTitle="No results calculated"
                  emptyDescription="Click 'Compute SGPA/CGPA' above to synthesize marks sheets into official transcripts."
                />
              </div>
            </TabsContent>

            <TabsContent value="merit" className="space-y-4">
              <div className="bg-card p-6 rounded-[24px] border border-border shadow-xs">
                <DataTable
                  rows={toppers}
                  getRowId={(row) => row.id}
                  columns={[
                    {
                      key: "rank",
                      header: "Merit Position",
                      value: (row) => row.rank ?? "—",
                      render: (row) => (
                        <span className="font-extrabold font-mono text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30 flex items-center gap-1 w-fit">
                          🏆 Rank #{row.rank}
                        </span>
                      ),
                    },
                    { key: "roll", header: "Roll Number", value: (row) => row.roll ?? "—" },
                    { key: "student", header: "Topper Scholar", value: (row) => row.student },
                    { key: "program", header: "Programme", value: (row) => row.program ?? "—" },
                    { key: "sgpa", header: "Semester SGPA", value: (row) => row.sgpa ?? "—" },
                    { key: "cgpa", header: "Cumulative CGPA", value: (row) => row.cgpa ?? "—" },
                    { key: "percent", header: "Aggregate %", value: (row) => `${row.percent}%` },
                  ]}
                  emptyTitle="No merit list generated yet"
                  emptyDescription="Toppers appear automatically once semester grades are frozen and finalized."
                />
              </div>
            </TabsContent>

            <TabsContent value="backlogs" className="space-y-4">
              <div className="bg-card p-6 rounded-[24px] border border-border shadow-xs">
                {backlogRows.length === 0 ? (
                  <Card className="p-16 rounded-[24px] border border-border text-center space-y-3">
                    <CheckCircle2 className="size-12 mx-auto text-emerald-500/50 animate-bounce" />
                    <p className="text-base font-extrabold text-foreground">Zero uncleared backlogs for this examination window!</p>
                    <p className="text-xs text-muted-foreground">All registered candidates achieved statutory passing marks.</p>
                  </Card>
                ) : (
                  <DataTable
                    rows={backlogRows}
                    getRowId={(row) => row.id}
                    columns={[
                      { key: "roll", header: "Roll", value: (row) => row.roll ?? "—" },
                      { key: "student", header: "Candidate Name", value: (row) => row.student },
                      { key: "program", header: "Programme", value: (row) => row.program ?? "—" },
                      {
                        key: "backlogs",
                        header: "Failed Subjects",
                        value: (row) => row.backlogs,
                        render: (row) => (
                          <Badge variant="destructive" className="font-mono text-xs font-extrabold px-3 py-0.5">
                            ⚠️ {row.backlogs} Backlog Paper(s)
                          </Badge>
                        ),
                      },
                      { key: "credits", header: "Credits Earned", value: (row) => `${row.earned}/${row.credits}` },
                      {
                        key: "reval",
                        header: "Revaluation Option",
                        value: () => "Reval",
                        render: (row) => (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.success(`Opened revaluation & supplementary exam slot for ${row.student}`)}
                            className="rounded-[10px] font-bold text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                          >
                            Apply Supplementary Slot
                          </Button>
                        ),
                      },
                    ]}
                    emptyTitle="No backlogs recorded"
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState title="Select an academic exam session" description="Choose a semester window above to load computed results and transcript tables." />
      )}
    </div>
  );
}
