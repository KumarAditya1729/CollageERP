import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, TriangleAlert, Users } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AttendanceHeatmap } from "@/components/attendance/attendance-heatmap";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { facultyName, labelize, useAcademicLookups } from "@/hooks/useAcademics";
import {
  useAttendancePolicies,
  useAttendanceRecords,
  useAttendanceSessions,
  useEffectivePolicy,
  useLeaveRequests,
} from "@/hooks/useAttendance";
import { useStudentRecords } from "@/hooks/useAcademics";
import { monthKey, riskBand, summarise, todayIso, weekdayLabels } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/")({
  head: () => ({
    meta: [
      { title: "Attendance — CampusOS" },
      {
        name: "description",
        content:
          "Live attendance dashboard with today's sessions, defaulter watchlist, weekly heatmaps and trend analysis.",
      },
      { property: "og:title", content: "Attendance — CampusOS" },
      {
        property: "og:description",
        content: "Daily roll call, defaulters and attendance trends at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendanceDashboard,
});

function AttendanceDashboard() {
  const sessions = useAttendanceSessions();
  const records = useAttendanceRecords();
  const leave = useLeaveRequests();
  const policies = useAttendancePolicies();
  const { policy } = useEffectivePolicy();
  const students = useStudentRecords();
  const { sections, courses, faculty } = useAcademicLookups();

  const today = todayIso();
  const sessionById = useMemo(
    () => new Map((sessions.data ?? []).map((row) => [row.id, row])),
    [sessions.data],
  );

  const todaySessions = (sessions.data ?? []).filter((row) => row.session_date === today);
  const markedToday = new Set(
    (records.data ?? [])
      .filter((row) => sessionById.get(row.attendance_session_id)?.session_date === today)
      .map((row) => row.attendance_session_id),
  );

  const overall = summarise(
    (records.data ?? []).map((row) => row.status),
    policy,
  );

  /** Per-student attendance percentage across all sessions. */
  const studentSummaries = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const record of records.data ?? []) {
      if (!record.student_id) continue;
      const list = grouped.get(record.student_id) ?? [];
      list.push(record.status);
      grouped.set(record.student_id, list);
    }
    return [...grouped.entries()]
      .map(([studentId, statuses]) => {
        const student = students.data?.find((row) => row.id === studentId);
        const summary = summarise(statuses as never, policy);
        return {
          id: studentId,
          name: student
            ? `${student.first_name} ${student.last_name ?? ""}`.trim()
            : "Unknown student",
          roll: student?.roll_number ?? "—",
          ...summary,
          band: riskBand(summary.percentage, policy),
        };
      })
      .sort((a, b) => a.percentage - b.percentage);
  }, [records.data, students.data, policy]);

  const defaulters = studentSummaries.filter((row) => row.band !== "healthy");

  /** Weekday × month heatmap of attendance percentage. */
  const heatmap = useMemo(() => {
    const buckets = new Map<string, { attended: number; held: number }>();
    for (const record of records.data ?? []) {
      const session = sessionById.get(record.attendance_session_id);
      if (!session) continue;
      const day = weekdayLabels[new Date(session.session_date).getDay()];
      const month = monthKey(session.session_date);
      const key = `${month}|${day}`;
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
      columns: weekdayLabels.filter((day) => cells.some((cell) => cell.column === day)),
    };
  }, [records.data, sessionById, policy]);

  /** Daily attendance trend. */
  const trend = useMemo(() => {
    const byDate = new Map<string, { attended: number; held: number }>();
    for (const record of records.data ?? []) {
      const session = sessionById.get(record.attendance_session_id);
      if (!session) continue;
      const bucket = byDate.get(session.session_date) ?? { attended: 0, held: 0 };
      const summary = summarise([record.status], policy);
      bucket.attended += summary.attended;
      bucket.held += summary.held;
      byDate.set(session.session_date, bucket);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, bucket]) => ({
        date,
        percentage: bucket.held ? Math.round((bucket.attended / bucket.held) * 100) : 0,
      }));
  }, [records.data, sessionById, policy]);

  const pendingLeave = (leave.data ?? []).filter((row) => row.status === "pending").length;

  const describe = (sessionId: string) => {
    const session = sessionById.get(sessionId);
    if (!session) return "";
    const course = courses.data?.find((row) => row.id === session.course_id);
    const section = sections.data?.find((row) => row.id === session.section_id);
    const teacher = faculty.data?.find((row) => row.id === session.faculty_id);
    return [course?.code, section?.name, teacher ? facultyName(teacher) : null]
      .filter(Boolean)
      .join(" · ");
  };

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`Threshold ${policy.minimum_percentage}% · ${policies.data?.length ?? 0} policies configured.`}
        crumbs={[{ label: "Attendance" }]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/attendance/sessions">Sessions</Link>
            </Button>
            <Button asChild>
              <Link to="/attendance/mark">Take attendance</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall attendance"
          value={`${overall.percentage}%`}
          icon={CalendarCheck}
          hint={`${overall.attended} of ${overall.held} marks`}
          loading={records.isLoading}
        />
        <StatCard
          label="Today's classes"
          value={todaySessions.length}
          icon={ClipboardList}
          hint={`${markedToday.size} already marked`}
        />
        <StatCard
          label="Defaulters"
          value={defaulters.length}
          icon={TriangleAlert}
          hint={`Below ${policy.minimum_percentage}%`}
        />
        <StatCard
          label="Leave awaiting review"
          value={pendingLeave}
          icon={Users}
          hint="Students, faculty and staff"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's sessions</CardTitle>
            <CardDescription>Classes scheduled for {today}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled today.</p>
            ) : (
              todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {describe(session.id) || labelize(session.session_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.starts_at?.slice(0, 5) ?? "—"} · {labelize(session.mode)}
                    </p>
                  </div>
                  <Badge variant={markedToday.has(session.id) ? "secondary" : "outline"}>
                    {markedToday.has(session.id) ? "Marked" : "Pending"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance trend</CardTitle>
            <CardDescription>
              Institution-wide percentage over the last 30 recorded days.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {trend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <AttendanceHeatmap
        title="Attendance heatmap"
        description="Percentage attended by month and weekday — spot the days people skip."
        rows={heatmap.rows}
        columns={heatmap.columns}
        cells={heatmap.cells}
      />

      <Card>
        <CardHeader>
          <CardTitle>Defaulter watchlist</CardTitle>
          <CardDescription>
            Students below the {policy.minimum_percentage}% threshold, lowest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {defaulters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everyone is above the threshold.</p>
          ) : (
            defaulters.slice(0, 15).map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.roll} · {student.attended}/{student.held} sessions
                  </p>
                </div>
                <Badge variant={student.band === "critical" ? "destructive" : "outline"}>
                  {student.percentage}%
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
