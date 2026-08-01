import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { ErrorState } from "@/components/common/states";
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
import { useAcademicLookups, useRooms, facultyName } from "@/hooks/useAcademics";
import {
  useCertificates,
  useExamInvigilators,
  useExamRegistrations,
  useExamRooms,
  useExamSeats,
  useExamSessions,
  useExams,
  useHallTickets,
  useResults,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, formatDate, formatDateTime, printAsPdf } from "@/lib/export";
import { labelize, round2 } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/reports")({
  head: () => ({
    meta: [
      { title: "Examination reports & statistics — CampusOS" },
      {
        name: "description",
        content:
          "Hall ticket register, seating and invigilation reports, result register, topper list, subject and department reports with CSV and PDF export.",
      },
      { property: "og:title", content: "Examination reports & statistics — CampusOS" },
      { property: "og:description", content: "Statutory examination reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamReports,
  errorComponent: ({ error }) => (
    <ErrorState title="Reports unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

type ReportKey =
  | "hall_ticket_register"
  | "seating_register"
  | "invigilation"
  | "result_register"
  | "topper_list"
  | "subject_report"
  | "department_report"
  | "certificate_register"
  | "statistics";

const REPORTS: { key: ReportKey; label: string; description: string }[] = [
  {
    key: "hall_ticket_register",
    label: "Hall ticket register",
    description: "Issued tickets with verification codes.",
  },
  {
    key: "seating_register",
    label: "Seating register",
    description: "Hall, bench and seat allocation per candidate.",
  },
  {
    key: "invigilation",
    label: "Invigilation report",
    description: "Duty roster with reporting times.",
  },
  {
    key: "result_register",
    label: "Result register",
    description: "SGPA, CGPA, credits and class awarded.",
  },
  {
    key: "topper_list",
    label: "Topper list",
    description: "Top ranked candidates in the session.",
  },
  {
    key: "subject_report",
    label: "Subject report",
    description: "Paper-wise registrations and outcomes.",
  },
  {
    key: "department_report",
    label: "Department report",
    description: "Department-wise pass performance.",
  },
  {
    key: "certificate_register",
    label: "Certificate register",
    description: "Issued marksheets and transcripts.",
  },
  {
    key: "statistics",
    label: "University statistics",
    description: "Consolidated session statistics.",
  },
];

function ExamReports() {
  const sessions = useExamSessions();
  const exams = useExams();
  const registrations = useExamRegistrations();
  const tickets = useHallTickets();
  const seats = useExamSeats();
  const examRooms = useExamRooms();
  const rooms = useRooms();
  const invigilators = useExamInvigilators();
  const results = useResults();
  const certificates = useCertificates();
  const students = useStudentRegister();
  const lookups = useAcademicLookups();

  const [sessionId, setSessionId] = useState("");
  const [report, setReport] = useState<ReportKey>("hall_ticket_register");

  const session = (sessions.data ?? []).find((row) => row.id === sessionId) ?? null;
  const sessionExams = useMemo(
    () => (exams.data ?? []).filter((row) => !sessionId || row.exam_session_id === sessionId),
    [exams.data, sessionId],
  );
  const examIds = useMemo(() => new Set(sessionExams.map((row) => row.id)), [sessionExams]);
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );
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
  const roomsById = useMemo(
    () => new Map((rooms.data ?? []).map((row) => [row.id, row])),
    [rooms.data],
  );
  const hallsById = useMemo(
    () => new Map((examRooms.data ?? []).map((row) => [row.id, row])),
    [examRooms.data],
  );
  const facultyById = useMemo(
    () => new Map((lookups.faculty.data ?? []).map((row) => [row.id, row])),
    [lookups.faculty.data],
  );
  const nameOf = (id: string) => {
    const student = studentById.get(id);
    return student ? studentName(student) : "Unknown student";
  };
  const rollOf = (id: string) => {
    const student = studentById.get(id);
    return student?.roll_number ?? student?.admission_number ?? "—";
  };

  const { headers, rows } = useMemo<{
    headers: string[];
    rows: (string | number | null)[][];
  }>(() => {
    switch (report) {
      case "hall_ticket_register": {
        const list = (tickets.data ?? []).filter(
          (row) => !sessionId || row.exam_session_id === sessionId,
        );
        return {
          headers: [
            "Ticket no.",
            "Roll",
            "Student",
            "Verification",
            "Issued",
            "Valid until",
            "Status",
          ],
          rows: list.map((row) => [
            row.ticket_number,
            rollOf(row.student_id),
            nameOf(row.student_id),
            row.verification_code,
            formatDate(row.issued_at),
            formatDate(row.valid_until),
            row.is_revoked ? "Revoked" : "Valid",
          ]),
        };
      }
      case "seating_register": {
        const list = (seats.data ?? []).filter((row) => examIds.has(row.exam_id));
        return {
          headers: [
            "Exam",
            "Hall",
            "Seat",
            "Bench",
            "Roll",
            "Student",
            "Special needs",
            "Verification",
          ],
          rows: list.map((row) => {
            const hall = hallsById.get(row.exam_room_id);
            const room = hall?.room_id ? roomsById.get(hall.room_id) : null;
            return [
              sessionExams.find((item) => item.id === row.exam_id)?.title ?? "—",
              room?.name ?? "—",
              row.seat_number,
              row.bench_number,
              rollOf(row.student_id),
              nameOf(row.student_id),
              row.is_special_needs ? "Yes" : "No",
              row.verification_code,
            ];
          }),
        };
      }
      case "invigilation": {
        const list = (invigilators.data ?? []).filter((row) => examIds.has(row.exam_id));
        return {
          headers: ["Exam", "Faculty", "Hall", "Duty", "Attendance", "Reported", "Departed"],
          rows: list.map((row) => {
            const hall = row.exam_room_id ? hallsById.get(row.exam_room_id) : null;
            const room = hall?.room_id ? roomsById.get(hall.room_id) : null;
            const faculty = row.faculty_id ? facultyById.get(row.faculty_id) : null;
            return [
              sessionExams.find((item) => item.id === row.exam_id)?.title ?? "—",
              faculty ? facultyName(faculty) : "Unassigned",
              room?.name ?? "All halls",
              labelize(row.duty_role),
              labelize(row.attendance_status),
              formatDateTime(row.reported_at),
              formatDateTime(row.departed_at),
            ];
          }),
        };
      }
      case "result_register":
      case "topper_list": {
        let list = (results.data ?? []).filter(
          (row) => !sessionId || row.exam_session_id === sessionId,
        );
        list = [...list].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
        if (report === "topper_list") list = list.slice(0, 20);
        return {
          headers: [
            "Rank",
            "Roll",
            "Student",
            "Credits",
            "SGPA",
            "CGPA",
            "%",
            "Backlogs",
            "Class",
            "Status",
          ],
          rows: list.map((row) => [
            row.rank,
            rollOf(row.student_id),
            nameOf(row.student_id),
            `${row.credits_earned}/${row.credits_registered}`,
            row.sgpa,
            row.cgpa,
            row.percentage,
            row.backlog_count,
            row.class_awarded,
            labelize(row.status),
          ]),
        };
      }
      case "subject_report": {
        return {
          headers: ["Code", "Subject", "Exam", "Date", "Registered", "Max marks", "Status"],
          rows: sessionExams.map((exam) => {
            const course = exam.course_id ? courseById.get(exam.course_id) : null;
            return [
              course?.code ?? "—",
              course?.title ?? "—",
              exam.title,
              formatDate(exam.exam_date),
              (registrations.data ?? []).filter((row) => row.exam_id === exam.id).length,
              exam.max_marks,
              labelize(exam.status),
            ];
          }),
        };
      }
      case "department_report": {
        const map = new Map<string, { appeared: number; passed: number; total: number }>();
        for (const result of (results.data ?? []).filter(
          (row) => !sessionId || row.exam_session_id === sessionId,
        )) {
          const student = studentById.get(result.student_id);
          const program = student?.program_id ? programById.get(student.program_id) : null;
          const key = program?.department_id ?? "unassigned";
          const entry = map.get(key) ?? { appeared: 0, passed: 0, total: 0 };
          entry.appeared += 1;
          if (result.is_pass) entry.passed += 1;
          entry.total += Number(result.percentage ?? 0);
          map.set(key, entry);
        }
        return {
          headers: ["Department", "Candidates", "Passed", "Pass %", "Average %"],
          rows: [...map.entries()].map(([key, entry]) => [
            departmentById.get(key)?.name ?? "Unassigned",
            entry.appeared,
            entry.passed,
            entry.appeared ? round2((entry.passed / entry.appeared) * 100) : 0,
            entry.appeared ? round2(entry.total / entry.appeared) : 0,
          ]),
        };
      }
      case "certificate_register": {
        const list = (certificates.data ?? []).filter(
          (row) => !sessionId || row.exam_session_id === sessionId,
        );
        return {
          headers: [
            "Certificate no.",
            "Kind",
            "Roll",
            "Student",
            "Verification",
            "Issued",
            "Status",
          ],
          rows: list.map((row) => [
            row.certificate_number,
            labelize(row.kind),
            rollOf(row.student_id),
            nameOf(row.student_id),
            row.verification_code,
            formatDate(row.issued_on),
            row.is_revoked ? "Revoked" : "Valid",
          ]),
        };
      }
      default: {
        const scoped = (results.data ?? []).filter(
          (row) => !sessionId || row.exam_session_id === sessionId,
        );
        const passed = scoped.filter((row) => row.is_pass).length;
        return {
          headers: ["Metric", "Value"],
          rows: [
            ["Session", session?.name ?? "All sessions"],
            ["Papers", sessionExams.length],
            [
              "Registrations",
              (registrations.data ?? []).filter((row) => examIds.has(row.exam_id)).length,
            ],
            [
              "Hall tickets issued",
              (tickets.data ?? []).filter((row) => !sessionId || row.exam_session_id === sessionId)
                .length,
            ],
            [
              "Seats allocated",
              (seats.data ?? []).filter((row) => examIds.has(row.exam_id)).length,
            ],
            [
              "Invigilation duties",
              (invigilators.data ?? []).filter((row) => examIds.has(row.exam_id)).length,
            ],
            ["Results", scoped.length],
            ["Passed", passed],
            ["Pass percentage", scoped.length ? round2((passed / scoped.length) * 100) : 0],
            [
              "Certificates issued",
              (certificates.data ?? []).filter(
                (row) => !sessionId || row.exam_session_id === sessionId,
              ).length,
            ],
          ],
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    report,
    sessionId,
    tickets.data,
    seats.data,
    invigilators.data,
    results.data,
    certificates.data,
    registrations.data,
    sessionExams,
    examIds,
    studentById,
    courseById,
    departmentById,
    programById,
    hallsById,
    roomsById,
    facultyById,
  ]);

  const tableRows = rows.map((row, index) => ({
    id: String(index),
    ...Object.fromEntries(headers.map((header, column) => [header, row[column] ?? "—"])),
  })) as (Record<string, unknown> & { id: string })[];

  const current = REPORTS.find((row) => row.key === report)!;

  return (
    <>
      <PageHeader
        title="Examination reports"
        description="Statutory registers and management reports, exportable to CSV or print-ready PDF."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Reports" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv(current.key.replace(/_/g, "-"), headers, rows)}
              disabled={!rows.length}
            >
              <Download className="size-4" />
              CSV / Excel
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                printAsPdf(`${current.label} — ${session?.name ?? "All sessions"}`, headers, rows)
              }
              disabled={!rows.length}
            >
              <Printer className="size-4" />
              PDF
            </Button>
          </>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{current.label}</CardTitle>
          <CardDescription>{current.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 gap-1.5">
            <Label htmlFor="report-kind">Report</Label>
            <Select value={report} onValueChange={(value) => setReport(value as ReportKey)}>
              <SelectTrigger id="report-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORTS.map((row) => (
                  <SelectItem key={row.key} value={row.key}>
                    {row.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-64 gap-1.5">
            <Label htmlFor="report-session">Session</Label>
            <Select
              value={sessionId || "all"}
              onValueChange={(value) => setSessionId(value === "all" ? "" : value)}
            >
              <SelectTrigger id="report-session">
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

      <DataTable
        rows={tableRows}
        storageKey={`exam-report-${report}`}
        exportName={current.key}
        getRowId={(row) => row.id}
        columns={headers.map((header) => ({
          key: header,
          header,
          value: (row: Record<string, unknown> & { id: string }) =>
            (row[header] as string | number | null) ?? "—",
          sortable: true,
        }))}
        emptyTitle="Nothing to report"
        emptyDescription="Choose another report or session."
      />
    </>
  );
}
