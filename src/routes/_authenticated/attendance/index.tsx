import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  ClipboardList,
  TriangleAlert,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileText,
} from "lucide-react";
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
import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { facultyName, labelize, useAcademicLookups, useStudentRecords } from "@/hooks/useAcademics";
import {
  useAttendancePolicies,
  useAttendanceRecords,
  useAttendanceSessions,
  useEffectivePolicy,
  useLeaveRequests,
} from "@/hooks/useAttendance";
import { monthKey, riskBand, summarise, todayIso, weekdayLabels } from "@/lib/attendance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/attendance/")({
  head: () => ({
    meta: [
      { title: "Attendance Command Center — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Live attendance telemetry, today's roll call sessions, defaulter surveillance, weekly heatmaps and institutional trend analysis.",
      },
      { property: "og:title", content: "Attendance Command Center — CampusOS 3.0" },
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
    <div className="space-y-8">
      <PageHeader
        title="Attendance Command Center"
        description={`Active Statutory Threshold: ${policy.minimum_percentage}% · ${policies.data?.length ?? 0} institutional policies configured and monitored.`}
        crumbs={[{ label: "Academic Telemetry" }, { label: "Attendance" }]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-10 rounded-[14px] px-4 font-semibold text-xs shadow-2xs gap-1.5">
              <Link to="/attendance/sessions">
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>All Sessions</span>
              </Link>
            </Button>
            <Button asChild className="h-10 rounded-[14px] px-5 font-bold text-xs shadow-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/attendance/mark">
                <UserCheck className="size-4" />
                <span>Take Roll Call</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overall Attendance"
          value={`${overall.percentage}%`}
          icon={CalendarCheck}
          hint={`${overall.attended} of ${overall.held} total roll marks`}
          loading={records.isLoading}
        />
        <StatCard
          label="Today's Sessions"
          value={todaySessions.length}
          icon={ClipboardList}
          hint={`${markedToday.size} rolls already captured`}
        />
        <StatCard
          label="Statutory Defaulters"
          value={defaulters.length}
          icon={TriangleAlert}
          hint={`Students below ${policy.minimum_percentage}% threshold`}
        />
        <StatCard
          label="Pending Leave Reviews"
          value={pendingLeave}
          icon={Users}
          hint="Faculty, students and administrative staff"
          footer={
            pendingLeave > 0 ? (
              <Button asChild variant="link" className="p-0 h-auto text-xs font-bold text-primary">
                <Link to="/attendance/leave">Review applications →</Link>
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Sessions & Trend Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Today's Roll Call Cards */}
        <Card className="lg:col-span-6 rounded-[20px] border border-border bg-card shadow-xs overflow-hidden flex flex-col">
          <CardHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                <span>Today's Active Classes</span>
              </CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">Scheduled roll sessions for {today}</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-bold bg-card">
              {markedToday.size}/{todaySessions.length} Complete
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5 flex-1 max-h-[440px] overflow-y-auto">
            {todaySessions.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No sessions scheduled for today"
                  description="Academic time-tables and special lectures will automatically propagate here."
                />
              </div>
            ) : (
              todaySessions.map((session) => {
                const isMarked = markedToday.has(session.id);
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[16px] border p-4 transition-all",
                      isMarked ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border hover:border-border/80 shadow-2xs"
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">
                          {describe(session.id) || labelize(session.session_type)}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase shrink-0">
                          {labelize(session.mode)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span>Starts at {session.starts_at?.slice(0, 5) ?? "—"}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isMarked ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 font-mono text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" /> Marked
                        </Badge>
                      ) : (
                        <Button asChild size="sm" variant="outline" className="h-8 rounded-xl font-bold text-xs border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-1.5">
                          <Link to="/attendance/mark" search={{ sessionId: session.id } as never}>
                            <span>Capture Roll</span>
                            <ArrowUpRight className="size-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* 30-Day Attendance Trend */}
        <Card className="lg:col-span-6 rounded-[20px] border border-border bg-card shadow-xs overflow-hidden flex flex-col">
          <CardHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">30-Day Institution Trend</CardTitle>
              <CardDescription className="text-xs">Aggregate daily attendance percentage across all departments.</CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">Live Telemetry</Badge>
          </CardHeader>
          <CardContent className="p-6 h-[380px] flex items-center justify-center">
            {trend.length === 0 ? (
              <EmptyState title="No historical roll records yet" description="The 30-day institution trajectory chart will build as faculty record daily attendance." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} font-mono />
                  <YAxis domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-[12px] bg-card border border-border p-2.5 shadow-md font-mono text-xs">
                          <p className="text-muted-foreground">{payload[0].payload.date}</p>
                          <p className="font-bold text-primary text-sm mt-0.5">{payload[0].value}% Attendance</p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Heatmap Widget */}
      <div className="rounded-[20px] border border-border bg-card shadow-xs overflow-hidden p-2">
        <AttendanceHeatmap
          title="Institutional Attendance Heatmap"
          description="Percentage attended by month and weekday — spot attendance drop-off patterns and absenteeism spikes."
          rows={heatmap.rows}
          columns={heatmap.columns}
          cells={heatmap.cells}
        />
      </div>

      {/* Statutory Defaulter Surveillance & Watchlist */}
      <Card className="rounded-[20px] border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/60 bg-linear-to-r from-red-500/10 via-card to-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              <span>Statutory Defaulter Surveillance Watchlist</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Students falling below the mandatory <span className="font-mono font-bold text-foreground">{policy.minimum_percentage}%</span> statutory attendance requirement. Subject to examination debarment.
            </CardDescription>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-[12px] h-9 font-semibold text-xs border-border shrink-0">
            <Link to="/students">View Entire Student Roster →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {defaulters.length === 0 ? (
            <div className="py-8 text-center bg-emerald-500/5 rounded-2xl border border-emerald-500/20 p-6">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">🎉 Exemplary Compliance Record</p>
              <p className="text-xs text-muted-foreground mt-1">All enrolled students currently meet or exceed the institutional {policy.minimum_percentage}% attendance threshold.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {defaulters.slice(0, 15).map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col justify-between rounded-[16px] border border-border p-4 bg-muted/20 hover:border-red-500/40 transition-all space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{student.name}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">Roll: {student.roll}</p>
                      </div>
                      <Badge
                        variant={student.band === "critical" ? "destructive" : "outline"}
                        className="font-mono font-bold text-xs shrink-0 rounded-full"
                      >
                        {student.percentage}%
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-muted-foreground">Sessions attended:</span>
                      <span className="font-bold text-foreground">{student.attended} / {student.held}</span>
                    </div>
                    <Progress value={student.percentage} className="h-1.5 rounded-full bg-red-500/10" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono uppercase text-red-500 font-bold tracking-wider">⚠️ Debarment Risk</span>
                    <Button asChild variant="link" className="p-0 h-auto text-xs font-bold text-primary">
                      <Link to="/students/$studentId" params={{ studentId: student.id }}>Inspect Profile →</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
