import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
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
import { useAccess } from "@/hooks/useAccess";
import { useEnrollmentRecords } from "@/hooks/useAcademics";
import {
  useAttendanceEligibility,
  useConfirmRegistrations,
  useExamRegistrations,
  useExams,
  useGenerateRegistrations,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv } from "@/lib/export";
import { labelize, statusTone } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/registrations")({
  head: () => ({
    meta: [
      { title: "Exam registrations & eligibility — CampusOS" },
      {
        name: "description",
        content:
          "Generate exam registrations from live enrolments, apply attendance eligibility rules and confirm candidates.",
      },
      { property: "og:title", content: "Exam registrations & eligibility — CampusOS" },
      { property: "og:description", content: "Registration and eligibility management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegistrationsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Registrations unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface CandidateRow extends Record<string, unknown> {
  id: string;
  studentId: string;
  name: string;
  roll: string | null;
  attendance: number | null;
  status: string;
  reason: string | null;
  isBacklog: boolean;
  registrationId: string | null;
}

function RegistrationsPage() {
  const { can } = useAccess();
  const exams = useExams();
  const registrations = useExamRegistrations();
  const enrollments = useEnrollmentRecords();
  const students = useStudentRegister();
  const eligibility = useAttendanceEligibility();
  const generate = useGenerateRegistrations();
  const confirm = useConfirmRegistrations();
  const [examId, setExamId] = useState("");

  const exam = useMemo(
    () => (exams.data ?? []).find((row) => row.id === examId) ?? null,
    [exams.data, examId],
  );

  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const rows = useMemo<CandidateRow[]>(() => {
    if (!exam) return [];
    const existing = (registrations.data ?? []).filter((row) => row.exam_id === exam.id);
    const enrolled = (enrollments.data ?? []).filter(
      (row) => exam.course_id && row.course_id === exam.course_id && row.status !== "withdrawn",
    );

    const ids = new Set<string>([
      ...enrolled.map((row) => row.student_id),
      ...existing.map((row) => row.student_id),
    ]);

    return [...ids]
      .map((studentId) => {
        const student = studentById.get(studentId);
        const registration = existing.find((row) => row.student_id === studentId);
        const attendance = exam.course_id
          ? (eligibility.get(studentId, exam.course_id)?.percentage ?? null)
          : null;
        return {
          id: studentId,
          studentId,
          name: student ? studentName(student) : "Unknown student",
          roll: student?.roll_number ?? student?.admission_number ?? null,
          attendance: registration?.attendance_percentage ?? attendance,
          status: registration?.status ?? "not_generated",
          reason: registration?.eligibility_reason ?? null,
          isBacklog: registration?.is_backlog ?? false,
          registrationId: registration?.id ?? null,
        } satisfies CandidateRow;
      })
      .sort((a, b) => (a.roll ?? "").localeCompare(b.roll ?? ""));
  }, [exam, registrations.data, enrollments.data, studentById, eligibility]);

  const eligibleCount = rows.filter((row) =>
    ["eligible", "registered"].includes(row.status),
  ).length;
  const ineligibleCount = rows.filter((row) => row.status === "ineligible").length;
  const registeredCount = rows.filter((row) => row.status === "registered").length;
  const canManage = can("exam.update");

  const registrationIdsFor = (ids: string[]) =>
    rows
      .filter((row) => ids.includes(row.id) && row.registrationId)
      .map((row) => row.registrationId!);

  return (
    <>
      <PageHeader
        title="Registrations & eligibility"
        description="Candidates are drawn from live subject enrolments and screened against attendance policy before hall tickets are issued."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Registrations" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "exam-registrations",
                ["Roll", "Student", "Attendance %", "Status", "Reason"],
                rows.map((row) => [row.roll, row.name, row.attendance, row.status, row.reason]),
              )
            }
            disabled={!rows.length}
          >
            Export CSV
          </Button>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Choose an exam</CardTitle>
          <CardDescription>
            Eligibility uses each paper&apos;s minimum attendance threshold against live attendance
            data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="reg-exam">Exam</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="reg-exam">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {(exams.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {exam && canManage ? (
            <>
              <Button
                onClick={() =>
                  generate.mutate({
                    exam,
                    candidates: rows.map((row) => ({
                      studentId: row.studentId,
                      attendancePercentage: row.attendance,
                      isBacklog: row.isBacklog,
                    })),
                  })
                }
                disabled={generate.isPending || !rows.length}
              >
                <RefreshCw className="size-4" />
                Generate / refresh registrations
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      {exam ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Candidates" value={rows.length} />
            <StatCard label="Eligible" value={eligibleCount} />
            <StatCard label="Registered" value={registeredCount} />
            <StatCard
              label="Ineligible"
              value={ineligibleCount}
              hint={
                exam.min_attendance_percentage === null
                  ? "No attendance threshold set"
                  : `Below ${exam.min_attendance_percentage}% attendance`
              }
            />
          </div>

          <DataTable<CandidateRow>
            rows={rows}
            loading={registrations.isLoading || students.isLoading || eligibility.loading}
            storageKey="exam-registration-candidates"
            exportName="exam-registrations"
            getRowId={(row) => row.id}
            bulkActions={(ids, clear) =>
              canManage ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      confirm.mutate({ ids: registrationIdsFor(ids), status: "registered" });
                      clear();
                    }}
                    disabled={confirm.isPending || !registrationIdsFor(ids).length}
                  >
                    <CheckCircle2 className="size-4" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      confirm.mutate({ ids: registrationIdsFor(ids), status: "eligible" });
                      clear();
                    }}
                    disabled={confirm.isPending || !registrationIdsFor(ids).length}
                  >
                    <UserCheck className="size-4" />
                    Mark eligible
                  </Button>
                </>
              ) : null
            }
            columns={[
              { key: "roll", header: "Roll", value: (row) => row.roll ?? "—", sortable: true },
              { key: "name", header: "Student", value: (row) => row.name, sortable: true },
              {
                key: "attendance",
                header: "Attendance %",
                value: (row) => row.attendance ?? "—",
                sortable: true,
              },
              {
                key: "status",
                header: "Status",
                value: (row) => row.status,
                render: (row) => (
                  <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>
                ),
              },
              { key: "backlog", header: "Backlog", value: (row) => (row.isBacklog ? "Yes" : "No") },
              { key: "reason", header: "Reason", value: (row) => row.reason ?? "—" },
            ]}
            emptyTitle="No candidates"
            emptyDescription="Enrol students into this subject to build the candidate list."
          />
        </>
      ) : (
        <EmptyState
          title="Select an exam"
          description="Pick a paper to review its candidate list and eligibility."
        />
      )}
    </>
  );
}
