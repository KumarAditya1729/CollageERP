import { createFileRoute } from "@tanstack/react-router";
import { Award, Lock, LockOpen, Snowflake, Upload } from "lucide-react";
import { useMemo, useState } from "react";

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
      { title: "Results, ranks & merit lists — CampusOS" },
      {
        name: "description",
        content:
          "Compute SGPA and CGPA from live marks, rank candidates, freeze and lock results, and publish or withhold them per candidate.",
      },
      { property: "og:title", content: "Results, ranks & merit lists — CampusOS" },
      {
        property: "og:description",
        content: "Result processing with freeze, lock and publication.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResultsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Results unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
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

  const canProcess = can("result.publish") || can("exam.approve");
  const session = useMemo(
    () => (sessions.data ?? []).find((row) => row.id === sessionId) ?? null,
    [sessions.data, sessionId],
  );
  const sessionExams = useMemo(
    () => (exams.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [exams.data, sessionId],
  );
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );
  const programById = useMemo(
    () => new Map((lookups.programs.data ?? []).map((row) => [row.id, row])),
    [lookups.programs.data],
  );
  const courseCredits = useMemo(
    () => new Map((lookups.courses.data ?? []).map((row) => [row.id, Number(row.credits ?? 0)])),
    [lookups.courses.data],
  );

  const computed = useMemo(() => {
    if (!sessionExams.length) return [];
    const examIds = new Set(sessionExams.map((row) => row.id));
    return computeResults({
      exams: sessionExams,
      marks: (marks.data ?? []).filter(
        (row) =>
          row.exam_id && examIds.has(row.exam_id) && ["approved", "published"].includes(row.status),
      ),
      courseCredits,
      students: (students.data ?? []).map((row) => ({
        id: row.id,
        program_id: row.program_id ?? null,
      })),
      bands,
    });
  }, [sessionExams, marks.data, courseCredits, students.data, bands]);

  const stored = useMemo(
    () => (results.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [results.data, sessionId],
  );

  const rows = useMemo<ResultRowView[]>(
    () =>
      stored
        .map((row) => {
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
        })
        .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
    [stored, studentById, programById],
  );

  const passed = rows.filter((row) => row.backlogs === 0).length;
  const passPercent = rows.length ? Math.round((passed / rows.length) * 1000) / 10 : 0;
  const toppers = rows.slice(0, 10);
  const backlogRows = rows.filter((row) => row.backlogs > 0);

  const doPublish = (status: "draft" | "provisional" | "approved" | "published") =>
    publish.mutate({
      examSessionId: sessionId,
      gradingScaleId: scale?.id ?? null,
      results: computed,
      status,
    });

  return (
    <>
      <PageHeader
        title="Results processing"
        description="Results are computed only from approved marks. Freeze locks the numbers, lock prevents any further change, and publication exposes them to students."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Results" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "result-register",
                  [
                    "Rank",
                    "Roll",
                    "Student",
                    "Credits",
                    "Earned",
                    "%",
                    "SGPA",
                    "CGPA",
                    "Backlogs",
                    "Class",
                    "Status",
                  ],
                  rows.map((row) => [
                    row.rank,
                    row.roll,
                    row.student,
                    row.credits,
                    row.earned,
                    row.percent,
                    row.sgpa,
                    row.cgpa,
                    row.backlogs,
                    row.classAwarded,
                    row.status,
                  ]),
                )
              }
              disabled={!rows.length}
            >
              Export register
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                printAsPdf(
                  `Topper list — ${session?.name ?? ""}`,
                  ["Rank", "Roll", "Student", "SGPA", "CGPA", "%"],
                  toppers.map((row) => [
                    row.rank,
                    row.roll,
                    row.student,
                    row.sgpa,
                    row.cgpa,
                    row.percent,
                  ]),
                )
              }
              disabled={!toppers.length}
            >
              <Award className="size-4" />
              Topper list
            </Button>
          </>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Exam session</CardTitle>
          <CardDescription>
            {computed.length
              ? `${computed.length} candidate result${computed.length === 1 ? "" : "s"} ready to post from approved marks.`
              : "Approve marks sheets to make results computable."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="result-session">Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger id="result-session">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {(sessions.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {session && canProcess ? (
            <>
              <Button
                variant="outline"
                onClick={() => doPublish("provisional")}
                disabled={!computed.length}
              >
                Post provisional
              </Button>
              <Button
                variant="outline"
                onClick={() => doPublish("approved")}
                disabled={!computed.length}
              >
                Approve
              </Button>
              <Button onClick={() => doPublish("published")} disabled={!computed.length}>
                <Upload className="size-4" />
                Publish
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      {session ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Results" value={rows.length} />
            <StatCard label="Pass percentage" value={`${passPercent}%`} />
            <StatCard label="With backlogs" value={backlogRows.length} />
            <StatCard
              label="Papers"
              value={sessionExams.length}
              hint={scale?.name ?? "Default grading scale"}
            />
          </div>

          <Tabs defaultValue="register" className="space-y-4">
            <TabsList>
              <TabsTrigger value="register">Result register</TabsTrigger>
              <TabsTrigger value="merit">Merit list</TabsTrigger>
              <TabsTrigger value="backlogs">Backlogs</TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <DataTable<ResultRowView>
                rows={rows}
                loading={results.isLoading}
                storageKey="exam-results"
                exportName="results"
                getRowId={(row) => row.id}
                bulkActions={(ids, clear) =>
                  canProcess ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          controls.mutate({ ids, action: "freeze" });
                          clear();
                        }}
                      >
                        <Snowflake className="size-4" />
                        Freeze
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          controls.mutate({ ids, action: "lock" });
                          clear();
                        }}
                      >
                        <Lock className="size-4" />
                        Lock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          controls.mutate({ ids, action: "unlock" });
                          clear();
                        }}
                      >
                        <LockOpen className="size-4" />
                        Unlock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          controls.mutate({
                            ids,
                            action: "withhold",
                            remarks: "Withheld by exam office",
                          });
                          clear();
                        }}
                      >
                        Withhold
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          controls.mutate({ ids, action: "publish" });
                          clear();
                        }}
                      >
                        Publish
                      </Button>
                    </>
                  ) : null
                }
                columns={[
                  { key: "rank", header: "Rank", value: (row) => row.rank ?? "—", sortable: true },
                  { key: "roll", header: "Roll", value: (row) => row.roll ?? "—", sortable: true },
                  {
                    key: "student",
                    header: "Student",
                    value: (row) => row.student,
                    sortable: true,
                  },
                  { key: "program", header: "Programme", value: (row) => row.program ?? "—" },
                  {
                    key: "credits",
                    header: "Credits",
                    value: (row) => `${row.earned}/${row.credits}`,
                  },
                  {
                    key: "percent",
                    header: "%",
                    value: (row) => row.percent ?? "—",
                    sortable: true,
                  },
                  { key: "sgpa", header: "SGPA", value: (row) => row.sgpa ?? "—", sortable: true },
                  { key: "cgpa", header: "CGPA", value: (row) => row.cgpa ?? "—", sortable: true },
                  {
                    key: "backlogs",
                    header: "Backlogs",
                    value: (row) => row.backlogs,
                    sortable: true,
                  },
                  { key: "class", header: "Class", value: (row) => row.classAwarded ?? "—" },
                  {
                    key: "status",
                    header: "Status",
                    value: (row) => row.status,
                    render: (row) => (
                      <div className="flex gap-1">
                        <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>
                        {row.frozen ? <Badge variant="outline">Frozen</Badge> : null}
                        {row.locked ? <Badge variant="outline">Locked</Badge> : null}
                      </div>
                    ),
                  },
                  {
                    key: "published",
                    header: "Published",
                    value: (row) => formatDate(row.published),
                  },
                ]}
                emptyTitle="No results posted"
                emptyDescription="Compute and post results from approved marks."
              />
            </TabsContent>

            <TabsContent value="merit">
              <DataTable<ResultRowView>
                rows={toppers}
                storageKey="exam-merit"
                exportName="merit-list"
                getRowId={(row) => row.id}
                columns={[
                  { key: "rank", header: "Rank", value: (row) => row.rank ?? "—" },
                  { key: "roll", header: "Roll", value: (row) => row.roll ?? "—" },
                  { key: "student", header: "Student", value: (row) => row.student },
                  { key: "program", header: "Programme", value: (row) => row.program ?? "—" },
                  { key: "sgpa", header: "SGPA", value: (row) => row.sgpa ?? "—" },
                  { key: "cgpa", header: "CGPA", value: (row) => row.cgpa ?? "—" },
                  { key: "percent", header: "%", value: (row) => row.percent ?? "—" },
                ]}
                emptyTitle="No merit list yet"
              />
            </TabsContent>

            <TabsContent value="backlogs">
              <DataTable<ResultRowView>
                rows={backlogRows}
                storageKey="exam-backlogs"
                exportName="backlogs"
                getRowId={(row) => row.id}
                columns={[
                  { key: "roll", header: "Roll", value: (row) => row.roll ?? "—" },
                  { key: "student", header: "Student", value: (row) => row.student },
                  { key: "program", header: "Programme", value: (row) => row.program ?? "—" },
                  {
                    key: "backlogs",
                    header: "Backlogs",
                    value: (row) => row.backlogs,
                    sortable: true,
                  },
                  {
                    key: "credits",
                    header: "Credits earned",
                    value: (row) => `${row.earned}/${row.credits}`,
                  },
                ]}
                emptyTitle="No backlogs"
                emptyDescription="Every candidate cleared all papers."
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState
          title="Select a session"
          description="Pick an exam session to process results."
        />
      )}
    </>
  );
}
