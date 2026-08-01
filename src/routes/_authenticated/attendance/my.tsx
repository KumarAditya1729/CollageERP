import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { labelize, useAcademicLookups, useStudentRecords } from "@/hooks/useAcademics";
import {
  useAttendanceRecords,
  useAttendanceSessions,
  useEffectivePolicy,
} from "@/hooks/useAttendance";
import { getWardAttendance } from "@/lib/parent-portal.functions";
import { riskBand, statusTone, summarise } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/my")({
  head: () => ({
    meta: [
      { title: "My attendance — CampusOS" },
      {
        name: "description",
        content:
          "Personal attendance record for students and faculty, plus a guardian view of every linked ward's attendance.",
      },
      { property: "og:title", content: "My attendance — CampusOS" },
      {
        property: "og:description",
        content: "Your attendance percentage, recent classes and ward summaries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyAttendancePage,
});

function MyAttendancePage() {
  const { user } = useAuth();
  const records = useAttendanceRecords();
  const sessions = useAttendanceSessions();
  const students = useStudentRecords();
  const { courses } = useAcademicLookups();
  const { policy } = useEffectivePolicy();

  const fetchWards = useServerFn(getWardAttendance);
  const wards = useQuery({
    queryKey: ["ward-attendance", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchWards(),
  });

  const me = students.data?.find((row) => row.user_id === user?.id);

  const sessionById = useMemo(
    () => new Map((sessions.data ?? []).map((row) => [row.id, row])),
    [sessions.data],
  );

  const mine = (records.data ?? []).filter((row) => row.student_id && row.student_id === me?.id);
  const summary = summarise(
    mine.map((row) => row.status),
    policy,
  );
  const band = riskBand(summary.percentage, policy);

  return (
    <>
      <PageHeader
        title="My attendance"
        description="Your own attendance record and, if you are a guardian, every ward linked to your account."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "My attendance" }]}
      />

      {me ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Attendance"
              value={`${summary.percentage}%`}
              hint={`Minimum ${policy.minimum_percentage}%`}
            />
            <StatCard
              label="Classes attended"
              value={summary.attended}
              hint={`${summary.held} held`}
            />
            <StatCard
              label="Standing"
              value={labelize(band)}
              hint={band === "healthy" ? "On track" : "Needs attention"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent classes</CardTitle>
              <CardDescription>Your last 20 marks with subject and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={summary.percentage} />
              {mine.slice(0, 20).map((record) => {
                const session = sessionById.get(record.attendance_session_id);
                const course = courses.data?.find((row) => row.id === session?.course_id);
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {course ? `${course.code} — ${course.name}` : "Class"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session?.session_date ?? "—"}
                      </p>
                    </div>
                    <Badge variant={statusTone(record.status)}>{labelize(record.status)}</Badge>
                  </div>
                );
              })}
              {mine.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance recorded for you yet.</p>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>My wards</CardTitle>
          <CardDescription>
            Guardian view — attendance for every student linked to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {wards.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (wards.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No students are linked to your account.</p>
          ) : (
            (wards.data ?? []).map((ward) => (
              <div key={ward.studentId} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{ward.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ward.rollNumber ?? "—"} · {ward.attended}/{ward.held} classes
                    </p>
                  </div>
                  <Badge
                    variant={
                      ward.percentage < policy.minimum_percentage ? "destructive" : "secondary"
                    }
                  >
                    {ward.percentage}%
                  </Badge>
                </div>
                <Progress value={ward.percentage} />
                <div className="flex flex-wrap gap-2">
                  {ward.recent.slice(0, 10).map((entry, index) => (
                    <Badge key={`${ward.studentId}-${index}`} variant={statusTone(entry.status)}>
                      {entry.date} · {labelize(entry.status)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
