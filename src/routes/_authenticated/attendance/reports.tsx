import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useLeaveRequests,
} from "@/hooks/useAttendance";
import { monthKey, riskBand, summarise, todayIso } from "@/lib/attendance";
import { downloadCsv } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/attendance/reports")({
  head: () => ({
    meta: [
      { title: "Attendance reports — CampusOS" },
      {
        name: "description",
        content:
          "Daily registers, monthly summaries, defaulter lists, exam-eligibility and leave reports exportable to CSV.",
      },
      { property: "og:title", content: "Attendance reports — CampusOS" },
      {
        property: "og:description",
        content: "Statutory attendance registers and defaulter reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendanceReports,
});

interface RegisterRow extends Record<string, unknown> {
  id: string;
  date: string;
  subject: string;
  section: string;
  teacher: string;
  present: number;
  absent: number;
  strength: number;
  percentage: number;
}

interface StudentRow extends Record<string, unknown> {
  id: string;
  name: string;
  roll: string;
  attended: number;
  held: number;
  percentage: number;
  band: string;
}

interface MonthRow extends Record<string, unknown> {
  id: string;
  month: string;
  attended: number;
  held: number;
  percentage: number;
}

function AttendanceReports() {
  const records = useAttendanceRecords();
  const sessions = useAttendanceSessions();
  const leave = useLeaveRequests();
  const students = useStudentRecords();
  const { courses, sections, faculty } = useAcademicLookups();
  const { policy } = useEffectivePolicy();

  const sessionById = useMemo(
    () => new Map((sessions.data ?? []).map((row) => [row.id, row])),
    [sessions.data],
  );

  const register = useMemo<RegisterRow[]>(() => {
    const buckets = new Map<string, { present: number; absent: number; strength: number }>();
    for (const record of records.data ?? []) {
      const bucket = buckets.get(record.attendance_session_id) ?? {
        present: 0,
        absent: 0,
        strength: 0,
      };
      const summary = summarise([record.status], policy);
      bucket.present += summary.attended;
      bucket.absent += summary.held - summary.attended;
      bucket.strength += 1;
      buckets.set(record.attendance_session_id, bucket);
    }
    return [...buckets.entries()]
      .map(([sessionId, bucket]) => {
        const session = sessionById.get(sessionId);
        const held = bucket.present + bucket.absent;
        return {
          id: sessionId,
          date: session?.session_date ?? "—",
          subject: courses.data?.find((row) => row.id === session?.course_id)?.code ?? "—",
          section: sections.data?.find((row) => row.id === session?.section_id)?.name ?? "—",
          teacher: (() => {
            const member = faculty.data?.find((row) => row.id === session?.faculty_id);
            return member ? facultyName(member) : "—";
          })(),
          present: bucket.present,
          absent: bucket.absent,
          strength: bucket.strength,
          percentage: held ? Math.round((bucket.present / held) * 100) : 0,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records.data, sessionById, courses.data, sections.data, faculty.data, policy]);

  const studentRows = useMemo<StudentRow[]>(() => {
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
          name: student ? studentLabel(student) : "Student",
          roll: student?.roll_number ?? "—",
          attended: summary.attended,
          held: summary.held,
          percentage: summary.percentage,
          band: riskBand(summary.percentage, policy),
        };
      })
      .sort((a, b) => a.percentage - b.percentage);
  }, [records.data, students.data, policy]);

  const monthly = useMemo<MonthRow[]>(() => {
    const buckets = new Map<string, { attended: number; held: number }>();
    for (const record of records.data ?? []) {
      const session = sessionById.get(record.attendance_session_id);
      if (!session) continue;
      const key = monthKey(session.session_date);
      const bucket = buckets.get(key) ?? { attended: 0, held: 0 };
      const summary = summarise([record.status], policy);
      bucket.attended += summary.attended;
      bucket.held += summary.held;
      buckets.set(key, bucket);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, bucket]) => ({
        id: month,
        month,
        attended: bucket.attended,
        held: bucket.held,
        percentage: bucket.held ? Math.round((bucket.attended / bucket.held) * 100) : 0,
      }));
  }, [records.data, sessionById, policy]);

  const defaulters = studentRows.filter((row) => row.percentage < policy.minimum_percentage);
  const ineligible = studentRows.filter((row) => row.percentage < policy.penalty_percentage);

  const leaveRows = (leave.data ?? []).map((row) => ({
    ...row,
    who: row.student_id
      ? studentLabel(
          students.data?.find((item) => item.id === row.student_id) ?? { first_name: "Student" },
        )
      : row.faculty_id
        ? (() => {
            const member = faculty.data?.find((item) => item.id === row.faculty_id);
            return member ? facultyName(member) : "Faculty";
          })()
        : labelize(row.attendee_kind),
  }));

  const exportStudents = (rows: StudentRow[], name: string) =>
    downloadCsv(
      `${name}-${todayIso()}`,
      ["Roll number", "Student", "Attended", "Held", "Percentage", "Risk"],
      rows.map((row) => [row.roll, row.name, row.attended, row.held, row.percentage, row.band]),
    );

  return (
    <>
      <PageHeader
        title="Attendance reports"
        description={`Registers, summaries and statutory lists calculated with the ${policy.minimum_percentage}% policy.`}
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Reports" }]}
      />

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="register">Daily register</TabsTrigger>
          <TabsTrigger value="students">Student summary</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="eligibility">Exam eligibility</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Daily class register</CardTitle>
                <CardDescription>One row per session with strength and percentage.</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    `attendance-register-${todayIso()}`,
                    ["Date", "Subject", "Section", "Faculty", "Present", "Absent", "Strength", "%"],
                    register.map((row) => [
                      row.date,
                      row.subject,
                      row.section,
                      row.teacher,
                      row.present,
                      row.absent,
                      row.strength,
                      row.percentage,
                    ]),
                  )
                }
              >
                <Download className="size-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable<RegisterRow>
                rows={register}
                loading={records.isLoading}
                getRowId={(row) => String(row.id)}
                storageKey="attendance-register"
                columns={[
                  { key: "date", header: "Date", alwaysVisible: true, value: (row) => row.date },
                  { key: "subject", header: "Subject", value: (row) => row.subject },
                  { key: "section", header: "Section", value: (row) => row.section },
                  { key: "teacher", header: "Faculty", value: (row) => row.teacher },
                  { key: "present", header: "Present", value: (row) => row.present },
                  { key: "absent", header: "Absent", value: (row) => row.absent },
                  { key: "percentage", header: "%", value: (row) => row.percentage },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Student attendance summary</CardTitle>
                <CardDescription>
                  Cumulative attendance for every student with marks.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => exportStudents(studentRows, "attendance-students")}
              >
                <Download className="size-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable<StudentRow>
                rows={studentRows}
                loading={records.isLoading}
                getRowId={(row) => String(row.id)}
                storageKey="attendance-students"
                columns={[
                  {
                    key: "roll",
                    header: "Roll number",
                    alwaysVisible: true,
                    value: (row) => row.roll,
                  },
                  { key: "name", header: "Student", value: (row) => row.name },
                  { key: "attended", header: "Attended", value: (row) => row.attended },
                  { key: "held", header: "Held", value: (row) => row.held },
                  { key: "percentage", header: "%", value: (row) => row.percentage },
                  {
                    key: "band",
                    header: "Risk",
                    render: (row) => (
                      <Badge
                        variant={
                          row.band === "critical"
                            ? "destructive"
                            : row.band === "warning"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {labelize(row.band)}
                      </Badge>
                    ),
                    value: (row) => row.band,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Monthly summary</CardTitle>
                <CardDescription>Institution attendance month by month.</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    `attendance-monthly-${todayIso()}`,
                    ["Month", "Attended", "Held", "%"],
                    monthly.map((row) => [row.month, row.attended, row.held, row.percentage]),
                  )
                }
              >
                <Download className="size-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable<MonthRow>
                rows={monthly}
                loading={records.isLoading}
                getRowId={(row) => String(row.id)}
                storageKey="attendance-monthly"
                columns={[
                  { key: "month", header: "Month", alwaysVisible: true, value: (row) => row.month },
                  { key: "attended", header: "Attended", value: (row) => row.attended },
                  { key: "held", header: "Held", value: (row) => row.held },
                  { key: "percentage", header: "%", value: (row) => row.percentage },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaulters">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Defaulter list</CardTitle>
                <CardDescription>Below the {policy.minimum_percentage}% minimum.</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => exportStudents(defaulters, "attendance-defaulters")}
              >
                <Download className="size-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable<StudentRow>
                rows={defaulters}
                loading={records.isLoading}
                getRowId={(row) => String(row.id)}
                storageKey="attendance-defaulters"
                columns={[
                  {
                    key: "roll",
                    header: "Roll number",
                    alwaysVisible: true,
                    value: (row) => row.roll,
                  },
                  { key: "name", header: "Student", value: (row) => row.name },
                  { key: "percentage", header: "%", value: (row) => row.percentage },
                  { key: "held", header: "Sessions held", value: (row) => row.held },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eligibility">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Exam eligibility</CardTitle>
                <CardDescription>
                  Students below the {policy.penalty_percentage}% penalty line are withheld until
                  condoned.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => exportStudents(ineligible, "attendance-ineligible")}
              >
                <Download className="size-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable<StudentRow>
                rows={ineligible}
                loading={records.isLoading}
                getRowId={(row) => String(row.id)}
                storageKey="attendance-eligibility"
                columns={[
                  {
                    key: "roll",
                    header: "Roll number",
                    alwaysVisible: true,
                    value: (row) => row.roll,
                  },
                  { key: "name", header: "Student", value: (row) => row.name },
                  { key: "percentage", header: "%", value: (row) => row.percentage },
                  {
                    key: "status",
                    header: "Eligibility",
                    render: () => <Badge variant="destructive">Withheld</Badge>,
                    value: () => "withheld",
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Leave report</CardTitle>
                <CardDescription>
                  All leave requests and their effect on attendance.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    `leave-report-${todayIso()}`,
                    ["From", "To", "Requester", "Type", "Status", "Adjusts attendance"],
                    leaveRows.map((row) => [
                      row.from_date,
                      row.to_date,
                      row.who,
                      labelize(row.leave_kind),
                      labelize(row.status),
                      row.adjusts_attendance ? "Yes" : "No",
                    ]),
                  )
                }
              >
                <Download className="size-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={leaveRows}
                loading={leave.isLoading}
                getRowId={(row) => String(row.id)}
                storageKey="attendance-leave-report"
                columns={[
                  {
                    key: "from_date",
                    header: "From",
                    alwaysVisible: true,
                    value: (row) => String(row.from_date),
                  },
                  { key: "to_date", header: "To", value: (row) => String(row.to_date) },
                  { key: "who", header: "Requester", value: (row) => String(row.who) },
                  {
                    key: "leave_kind",
                    header: "Type",
                    value: (row) => labelize(String(row.leave_kind)),
                  },
                  { key: "status", header: "Status", value: (row) => labelize(String(row.status)) },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
