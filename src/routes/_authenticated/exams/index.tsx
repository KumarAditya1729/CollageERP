import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  ScrollText,
  TicketCheck,
  TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";

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
      { title: "Examination control tower — CampusOS" },
      {
        name: "description",
        content:
          "Live examination overview: sessions, papers, marks entry progress, results and clash detection across the institution.",
      },
      { property: "og:title", content: "Examination control tower — CampusOS" },
      {
        property: "og:description",
        content: "Institution-wide examination and assessment overview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamDashboard,
  errorComponent: ({ error }) => (
    <ErrorState title="Examinations unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
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
  const upcoming = (exams.data ?? [])
    .filter((exam) => exam.exam_date && exam.exam_date >= today)
    .slice(0, 8);

  const marksProgress = useMemo(() => {
    const rows = marks.data ?? [];
    const published = rows.filter((row) => row.status === "published").length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const pending = rows.filter((row) =>
      ["draft", "submitted", "under_moderation"].includes(row.status),
    ).length;
    return { published, approved, pending, total: rows.length };
  }, [marks.data]);

  const pendingRevals = (revaluations.data ?? []).filter((row) => row.status === "pending");

  return (
    <>
      <PageHeader
        title="Examinations"
        description="The assessment backbone — planning, question papers, marks, evaluation, results and certificates."
        crumbs={[{ label: "Examinations" }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/exams/planning">Plan exams</Link>
            </Button>
            <Button asChild>
              <Link to="/exams/marks">Marks entry</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Exam sessions"
          value={overview.data?.["exam_sessions"]}
          icon={ClipboardList}
          loading={overview.isLoading}
          hint="Windows planned across the calendar"
        />
        <StatCard
          label="Scheduled papers"
          value={overview.data?.["exams"]}
          icon={ScrollText}
          loading={overview.isLoading}
          hint={`${overview.data?.["question_papers"] ?? 0} question papers`}
        />
        <StatCard
          label="Registrations"
          value={overview.data?.["exam_registrations"]}
          icon={TicketCheck}
          loading={overview.isLoading}
          hint={`${overview.data?.["hall_tickets"] ?? 0} hall tickets issued`}
        />
        <StatCard
          label="Published results"
          value={(results.data ?? []).filter((row) => row.status === "published").length}
          icon={Award}
          loading={results.isLoading}
          hint={`${overview.data?.["certificates"] ?? 0} certificates issued`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-none lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Upcoming papers</CardTitle>
            <CardDescription>Next scheduled sittings from the live exam timetable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {exams.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading the timetable…</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No papers scheduled yet. Create an exam session and add papers to get started.
              </p>
            ) : (
              upcoming.map((exam) => {
                const course = exam.course_id ? courseById.get(exam.course_id) : null;
                return (
                  <div
                    key={exam.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course ? `${course.code} — ${course.title}` : "Subject not linked"} ·{" "}
                        {formatDate(exam.exam_date)} · {exam.starts_at ?? "—"}–{exam.ends_at ?? "—"}
                      </p>
                    </div>
                    <Badge variant={statusTone(exam.status)}>{labelize(exam.status)}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Marks pipeline</CardTitle>
              <CardDescription>Entry, moderation and publication progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Awaiting action" value={marksProgress.pending} icon={FileSpreadsheet} />
              <Row label="Approved" value={marksProgress.approved} icon={GraduationCap} />
              <Row label="Published" value={marksProgress.published} icon={Award} />
              <Row label="Pending revaluations" value={pendingRevals.length} icon={TriangleAlert} />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Sessions</CardTitle>
              <CardDescription>Current examination windows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(sessions.data ?? []).slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{session.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(session.starts_on)}
                  </span>
                </div>
              ))}
              {(sessions.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No exam sessions yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <ExamConflictsPanel conflicts={conflicts} loading={conflictsLoading} />
    </>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Award }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
