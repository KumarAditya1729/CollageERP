import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
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
import { useAcademicLookups } from "@/hooks/useAcademics";
import {
  useCourseOutcomes,
  useEffectiveBands,
  useExamSessions,
  useExams,
  useMarks,
  usePaperQuestions,
  useQuestions,
  useResultCourses,
  useResults,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import {
  attainmentByOutcome,
  attainmentLevel,
  bloomLevels,
  difficulties,
  gradeFor,
  labelize,
  percentage,
  round2,
} from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/analytics")({
  head: () => ({
    meta: [
      { title: "Examination analytics & attainment — CampusOS" },
      {
        name: "description",
        content:
          "Pass percentage, grade distribution, subject and department analytics, difficulty and Bloom mix, plus CO/PO attainment for NBA and NAAC.",
      },
      { property: "og:title", content: "Examination analytics & attainment — CampusOS" },
      { property: "og:description", content: "Outcome-based examination analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamAnalytics,
  errorComponent: ({ error }) => (
    <ErrorState title="Analytics unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

const COLORS = [
  "var(--color-primary)",
  "var(--color-chart-2, #64748b)",
  "var(--color-destructive)",
  "var(--color-muted-foreground)",
  "var(--color-accent-foreground)",
];

interface SubjectRow extends Record<string, unknown> {
  id: string;
  code: string;
  title: string;
  department: string | null;
  appeared: number;
  passed: number;
  passPercent: number;
  average: number;
  highest: number;
}

function ExamAnalytics() {
  const sessions = useExamSessions();
  const exams = useExams();
  const marks = useMarks();
  const results = useResults();
  const resultCourses = useResultCourses();
  const questions = useQuestions();
  const paperQuestions = usePaperQuestions();
  const outcomes = useCourseOutcomes();
  const lookups = useAcademicLookups();
  const students = useStudentRegister();
  const { bands } = useEffectiveBands(null);

  const [sessionId, setSessionId] = useState("");

  const courseById = useMemo(
    () => new Map((lookups.courses.data ?? []).map((row) => [row.id, row])),
    [lookups.courses.data],
  );
  const departmentById = useMemo(
    () => new Map((lookups.departments.data ?? []).map((row) => [row.id, row])),
    [lookups.departments.data],
  );
  const programById = useMemo(
    () => new Map((lookups.programs.data ?? []).map((row) => [row.id, row])),
    [lookups.programs.data],
  );
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const scopedExams = useMemo(
    () => (exams.data ?? []).filter((row) => !sessionId || row.exam_session_id === sessionId),
    [exams.data, sessionId],
  );
  const examIds = useMemo(() => new Set(scopedExams.map((row) => row.id)), [scopedExams]);
  const scopedMarks = useMemo(
    () => (marks.data ?? []).filter((row) => row.exam_id && examIds.has(row.exam_id)),
    [marks.data, examIds],
  );
  const scopedResults = useMemo(
    () => (results.data ?? []).filter((row) => !sessionId || row.exam_session_id === sessionId),
    [results.data, sessionId],
  );

  const subjects = useMemo<SubjectRow[]>(() => {
    const map = new Map<
      string,
      { total: number; count: number; passed: number; highest: number; max: number }
    >();
    for (const exam of scopedExams) {
      if (!exam.course_id) continue;
      const rows = scopedMarks.filter((row) => row.exam_id === exam.id);
      const entry = map.get(exam.course_id) ?? {
        total: 0,
        count: 0,
        passed: 0,
        highest: 0,
        max: exam.max_marks,
      };
      for (const row of rows) {
        const value = Number(row.final_marks ?? 0);
        entry.total += value;
        entry.count += 1;
        entry.highest = Math.max(entry.highest, value);
        if (!row.is_absent && value >= exam.passing_marks) entry.passed += 1;
      }
      map.set(exam.course_id, entry);
    }
    return [...map.entries()]
      .map(([courseId, entry]) => {
        const course = courseById.get(courseId);
        return {
          id: courseId,
          code: course?.code ?? "—",
          title: course?.title ?? "Course",
          department: course?.department_id
            ? (departmentById.get(course.department_id)?.name ?? null)
            : null,
          appeared: entry.count,
          passed: entry.passed,
          passPercent: entry.count ? round2((entry.passed / entry.count) * 100) : 0,
          average: entry.count ? round2(entry.total / entry.count) : 0,
          highest: entry.highest,
        } satisfies SubjectRow;
      })
      .sort((a, b) => b.appeared - a.appeared);
  }, [scopedExams, scopedMarks, courseById, departmentById]);

  const gradeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of resultCourses.data ?? []) {
      const grade = row.grade ?? gradeFor(percentage(row.total_marks, row.max_marks), bands).grade;
      counts.set(grade, (counts.get(grade) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [resultCourses.data, bands]);

  const departmentRows = useMemo(() => {
    const map = new Map<string, { appeared: number; passed: number; total: number }>();
    for (const result of scopedResults) {
      const student = studentById.get(result.student_id);
      const program = student?.program_id ? programById.get(student.program_id) : null;
      const key = program?.department_id ?? "unassigned";
      const entry = map.get(key) ?? { appeared: 0, passed: 0, total: 0 };
      entry.appeared += 1;
      if (result.is_pass) entry.passed += 1;
      entry.total += Number(result.percentage ?? 0);
      map.set(key, entry);
    }
    return [...map.entries()].map(([key, entry]) => ({
      id: key,
      name: departmentById.get(key)?.name ?? "Unassigned",
      appeared: entry.appeared,
      passed: entry.passed,
      passPercent: entry.appeared ? round2((entry.passed / entry.appeared) * 100) : 0,
      average: entry.appeared ? round2(entry.total / entry.appeared) : 0,
    }));
  }, [scopedResults, studentById, programById, departmentById]);

  const difficultyMix = useMemo(
    () =>
      difficulties.map((level) => ({
        name: labelize(level),
        value: (questions.data ?? []).filter((row) => row.difficulty === level).length,
      })),
    [questions.data],
  );

  const bloomMix = useMemo(
    () =>
      bloomLevels.map((level) => ({
        name: labelize(level),
        value: (questions.data ?? []).filter((row) => row.bloom === level).length,
      })),
    [questions.data],
  );

  /** CO attainment: marks scored on questions mapped to each course outcome. */
  const attainment = useMemo(() => {
    const questionById = new Map((questions.data ?? []).map((row) => [row.id, row]));
    const paperById = new Map((paperQuestions.data ?? []).map((row) => [row.question_id, row]));
    const rows = (outcomes.data ?? []).map((outcome) => {
      const linked = (questions.data ?? []).filter((row) => row.course_outcome_id === outcome.id);
      const courseMarks = scopedMarks.filter((mark) => {
        const exam = scopedExams.find((item) => item.id === mark.exam_id);
        return exam?.course_id === outcome.course_id;
      });
      const maxPer = linked.reduce(
        (sum, row) => sum + (paperById.get(row.id)?.marks ?? row.marks),
        0,
      );
      const attempted = courseMarks.length;
      const scored = courseMarks.reduce((sum, row) => sum + Number(row.final_marks ?? 0), 0);
      const max = attempted * (courseMarks[0]?.max_marks ?? 100);
      return {
        outcomeId: outcome.id,
        code: outcome.code,
        description: outcome.description,
        course: outcome.course_id ? (courseById.get(outcome.course_id)?.code ?? "—") : "—",
        questions: linked.length,
        blueprintMarks: maxPer,
        percent: max ? round2((scored / max) * 100) : 0,
      };
    });
    const summary = new Map(
      attainmentByOutcome(
        rows.map((row) => ({ outcomeId: row.outcomeId, obtained: row.percent, max: 100 })),
      ).map((row) => [row.outcomeId, row.percent]),
    );
    void questionById;
    return rows.map((row) => ({
      ...row,
      id: row.outcomeId,
      level: attainmentLevel(row.percent),
      summary: summary.get(row.outcomeId) ?? row.percent,
    }));
  }, [outcomes.data, questions.data, paperQuestions.data, scopedMarks, scopedExams, courseById]);

  const appeared = scopedResults.length;
  const passed = scopedResults.filter((row) => row.is_pass).length;
  const passPercent = appeared ? round2((passed / appeared) * 100) : 0;
  const averagePercent = appeared
    ? round2(scopedResults.reduce((sum, row) => sum + Number(row.percentage ?? 0), 0) / appeared)
    : 0;

  return (
    <>
      <PageHeader
        title="Examination analytics"
        description="Pass and fail trends, grade distribution, subject and department performance, question difficulty, Bloom coverage and outcome attainment."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Analytics" }]}
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Scope</CardTitle>
          <CardDescription>
            Leave the session empty to analyse every published exam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid min-w-72 max-w-sm gap-1.5">
            <Label htmlFor="analytics-session">Exam session</Label>
            <Select
              value={sessionId || "all"}
              onValueChange={(value) => setSessionId(value === "all" ? "" : value)}
            >
              <SelectTrigger id="analytics-session">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sessions</SelectItem>
                {(sessions.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Candidates" value={appeared} />
        <StatCard label="Pass percentage" value={`${passPercent}%`} />
        <StatCard label="Fail percentage" value={`${appeared ? round2(100 - passPercent) : 0}%`} />
        <StatCard label="Average score" value={`${averagePercent}%`} />
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="questions">Question analysis</TabsTrigger>
          <TabsTrigger value="attainment">CO / PO attainment</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Subject pass percentage</CardTitle>
              <CardDescription>Top subjects by candidates appeared.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjects.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="code" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="passPercent" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <DataTable<SubjectRow>
            rows={subjects}
            storageKey="exam-subject-analytics"
            exportName="subject-analytics"
            getRowId={(row) => row.id}
            columns={[
              { key: "code", header: "Code", value: (row) => row.code, sortable: true },
              { key: "title", header: "Subject", value: (row) => row.title, sortable: true },
              { key: "department", header: "Department", value: (row) => row.department ?? "—" },
              { key: "appeared", header: "Appeared", value: (row) => row.appeared, sortable: true },
              { key: "passed", header: "Passed", value: (row) => row.passed, sortable: true },
              { key: "pass", header: "Pass %", value: (row) => row.passPercent, sortable: true },
              { key: "average", header: "Average", value: (row) => row.average, sortable: true },
              { key: "highest", header: "Highest", value: (row) => row.highest },
            ]}
            emptyTitle="No subject data"
          />
        </TabsContent>

        <TabsContent value="grades">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Grade distribution</CardTitle>
              <CardDescription>Across every published subject result.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="grade" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <DataTable
            rows={departmentRows}
            storageKey="exam-department-analytics"
            exportName="department-analytics"
            getRowId={(row) => row.id}
            columns={[
              { key: "name", header: "Department", value: (row) => row.name, sortable: true },
              {
                key: "appeared",
                header: "Candidates",
                value: (row) => row.appeared,
                sortable: true,
              },
              { key: "passed", header: "Passed", value: (row) => row.passed, sortable: true },
              { key: "pass", header: "Pass %", value: (row) => row.passPercent, sortable: true },
              { key: "average", header: "Average %", value: (row) => row.average, sortable: true },
            ]}
            emptyTitle="No department data"
          />
        </TabsContent>

        <TabsContent value="questions" className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Difficulty mix</CardTitle>
              <CardDescription>Question bank composition.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyMix} dataKey="value" nameKey="name" outerRadius={90} label>
                    {difficultyMix.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Bloom taxonomy coverage</CardTitle>
              <CardDescription>Cognitive levels represented in the bank.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bloomMix}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attainment">
          <DataTable
            rows={attainment}
            storageKey="exam-attainment"
            exportName="co-attainment"
            getRowId={(row) => row.id}
            columns={[
              { key: "course", header: "Course", value: (row) => row.course, sortable: true },
              { key: "code", header: "Outcome", value: (row) => row.code, sortable: true },
              { key: "description", header: "Description", value: (row) => row.description },
              { key: "questions", header: "Questions", value: (row) => row.questions },
              {
                key: "percent",
                header: "Attainment %",
                value: (row) => row.percent,
                sortable: true,
              },
              {
                key: "level",
                header: "NBA level",
                value: (row) => row.level,
                render: (row) => (
                  <Badge variant={row.level >= 2 ? "secondary" : "outline"}>
                    Level {row.level}
                  </Badge>
                ),
              },
            ]}
            emptyTitle="No outcomes mapped"
            emptyDescription="Map course outcomes to questions to compute attainment."
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
