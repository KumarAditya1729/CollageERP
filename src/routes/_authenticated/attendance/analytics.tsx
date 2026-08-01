import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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

import { AttendanceHeatmap } from "@/components/attendance/attendance-heatmap";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  facultyName,
  labelize,
  studentLabel,
  useAcademicLookups,
  useStudentRecords,
} from "@/hooks/useAcademics";
import {
  useAttendanceRecords,
  useAttendanceSessions,
  useEffectivePolicy,
} from "@/hooks/useAttendance";
import { monthKey, predictPercentage, riskBand, summarise } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/analytics")({
  head: () => ({
    meta: [
      { title: "Attendance analytics — CampusOS" },
      {
        name: "description",
        content:
          "Subject, section and faculty attendance analytics with month-on-month trends, status mix and risk prediction.",
      },
      { property: "og:title", content: "Attendance analytics — CampusOS" },
      { property: "og:description", content: "Where attendance is slipping, and who is at risk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendanceAnalytics,
});

const PIE_COLORS = [
  "var(--color-primary)",
  "var(--color-chart-2, #64748b)",
  "var(--color-destructive)",
  "var(--color-muted-foreground)",
  "var(--color-accent-foreground)",
];

function AttendanceAnalytics() {
  const records = useAttendanceRecords();
  const sessions = useAttendanceSessions();
  const students = useStudentRecords();
  const { courses, sections, faculty } = useAcademicLookups();
  const { policy } = useEffectivePolicy();

  const sessionById = useMemo(
    () => new Map((sessions.data ?? []).map((row) => [row.id, row])),
    [sessions.data],
  );

  /** Percentage grouped by an arbitrary dimension of the parent session. */
  const groupBy = (pick: (sessionId: string) => string | null, label: (key: string) => string) => {
    const buckets = new Map<string, { attended: number; held: number }>();
    for (const record of records.data ?? []) {
      const key = pick(record.attendance_session_id);
      if (!key) continue;
      const bucket = buckets.get(key) ?? { attended: 0, held: 0 };
      const summary = summarise([record.status], policy);
      bucket.attended += summary.attended;
      bucket.held += summary.held;
      buckets.set(key, bucket);
    }
    return [...buckets.entries()]
      .map(([key, bucket]) => ({
        key,
        name: label(key),
        percentage: bucket.held ? Math.round((bucket.attended / bucket.held) * 100) : 0,
        held: bucket.held,
      }))
      .sort((a, b) => a.percentage - b.percentage);
  };

  const bySubject = groupBy(
    (id) => sessionById.get(id)?.course_id ?? null,
    (key) => courses.data?.find((row) => row.id === key)?.code ?? "Subject",
  );
  const bySection = groupBy(
    (id) => sessionById.get(id)?.section_id ?? null,
    (key) => sections.data?.find((row) => row.id === key)?.name ?? "Section",
  );
  const byFaculty = groupBy(
    (id) => sessionById.get(id)?.faculty_id ?? null,
    (key) => {
      const member = faculty.data?.find((row) => row.id === key);
      return member ? facultyName(member) : "Faculty";
    },
  );

  const statusMix = useMemo(() => {
    const tally = new Map<string, number>();
    for (const record of records.data ?? []) {
      tally.set(record.status, (tally.get(record.status) ?? 0) + 1);
    }
    return [...tally.entries()].map(([status, value]) => ({ name: labelize(status), value }));
  }, [records.data]);

  /** Month × subject heatmap. */
  const heatmap = useMemo(() => {
    const buckets = new Map<string, { attended: number; held: number }>();
    for (const record of records.data ?? []) {
      const session = sessionById.get(record.attendance_session_id);
      if (!session?.course_id) continue;
      const code = courses.data?.find((row) => row.id === session.course_id)?.code ?? "Subject";
      const key = `${code}|${monthKey(session.session_date)}`;
      const bucket = buckets.get(key) ?? { attended: 0, held: 0 };
      const summary = summarise([record.status], policy);
      bucket.attended += summary.attended;
      bucket.held += summary.held;
      buckets.set(key, bucket);
    }
    const cells = [...buckets.entries()].map(([key, bucket]) => {
      const [row, column] = key.split("|");
      return {
        row,
        column,
        held: bucket.held,
        percentage: bucket.held ? Math.round((bucket.attended / bucket.held) * 100) : 0,
      };
    });
    return {
      cells,
      rows: [...new Set(cells.map((cell) => cell.row))].sort(),
      columns: [...new Set(cells.map((cell) => cell.column))].sort(),
    };
  }, [records.data, sessionById, courses.data, policy]);

  /** Students trending downwards month on month. */
  const atRisk = useMemo(() => {
    const perStudent = new Map<string, Map<string, { attended: number; held: number }>>();
    for (const record of records.data ?? []) {
      if (!record.student_id) continue;
      const session = sessionById.get(record.attendance_session_id);
      if (!session) continue;
      const months = perStudent.get(record.student_id) ?? new Map();
      const key = monthKey(session.session_date);
      const bucket = months.get(key) ?? { attended: 0, held: 0 };
      const summary = summarise([record.status], policy);
      bucket.attended += summary.attended;
      bucket.held += summary.held;
      months.set(key, bucket);
      perStudent.set(record.student_id, months);
    }
    return [...perStudent.entries()]
      .map(([studentId, months]) => {
        const series = [...months.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, value]) => value);
        const totals = series.reduce(
          (acc, item) => ({ attended: acc.attended + item.attended, held: acc.held + item.held }),
          { attended: 0, held: 0 },
        );
        const current = totals.held ? Math.round((totals.attended / totals.held) * 100) : 0;
        const student = students.data?.find((row) => row.id === studentId);
        return {
          id: studentId,
          name: student ? studentLabel(student) : "Student",
          current,
          projected: predictPercentage(series),
          band: riskBand(current, policy),
        };
      })
      .filter((row) => row.projected < policy.minimum_percentage)
      .sort((a, b) => a.projected - b.projected)
      .slice(0, 12);
  }, [records.data, sessionById, students.data, policy]);

  const overall = summarise(
    (records.data ?? []).map((row) => row.status),
    policy,
  );

  return (
    <>
      <PageHeader
        title="Attendance analytics"
        description="Comparative analysis across subjects, sections and faculty, with predictive risk flags."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Analytics" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall"
          value={`${overall.percentage}%`}
          hint={`${overall.held} marks analysed`}
        />
        <StatCard
          label="Weakest subject"
          value={bySubject[0] ? `${bySubject[0].percentage}%` : "—"}
          hint={bySubject[0]?.name ?? "No data"}
        />
        <StatCard
          label="Weakest section"
          value={bySection[0] ? `${bySection[0].percentage}%` : "—"}
          hint={bySection[0]?.name ?? "No data"}
        />
        <StatCard
          label="Predicted defaulters"
          value={atRisk.length}
          hint="Trending below threshold"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise attendance</CardTitle>
            <CardDescription>Lowest performing subjects first.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {bySubject.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySubject.slice(0, 12)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
            <CardDescription>How marks are distributed across statuses.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {statusMix.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusMix} dataKey="value" nameKey="name" outerRadius={100} label>
                    {statusMix.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty-wise class attendance</CardTitle>
          <CardDescription>Average attendance across each teacher's sessions.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {byFaculty.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byFaculty.slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="percentage" fill="var(--color-primary)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <AttendanceHeatmap
        title="Subject × month heatmap"
        description="Track how each subject's attendance moves through the term."
        rows={heatmap.rows}
        columns={heatmap.columns}
        cells={heatmap.cells}
      />

      <Card>
        <CardHeader>
          <CardTitle>Predicted shortfall</CardTitle>
          <CardDescription>
            Students whose trend projects below {policy.minimum_percentage}% by the end of term.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {atRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students are trending into shortfall.
            </p>
          ) : (
            atRisk.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <p className="font-medium">{student.name}</p>
                <p className="text-xs text-muted-foreground">
                  now {student.current}% · projected {student.projected}%
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
