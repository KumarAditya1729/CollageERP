import { createFileRoute } from "@tanstack/react-router";
import { Ban, Download, Printer, TicketCheck, Unlock } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { HallTicketCard, type HallTicketData } from "@/components/exams/hall-ticket-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicLookups, useRooms } from "@/hooks/useAcademics";
import {
  useExamRegistrations,
  useExamRooms,
  useExamSeats,
  useExamSessions,
  useExams,
  useGenerateHallTickets,
  useHallTicketMutations,
  useHallTickets,
  useRegistrationHolds,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, formatDate, formatDateTime } from "@/lib/export";
import { downloadHallTicketsZip } from "@/lib/hall-ticket-zip";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/hall-tickets")({
  head: () => ({
    meta: [
      { title: "Hall tickets & eligibility holds — CampusOS" },
      {
        name: "description",
        content:
          "Validate eligibility, apply fee and attendance holds, and issue QR-verified hall tickets in bulk.",
      },
      { property: "og:title", content: "Hall tickets & eligibility holds — CampusOS" },
      {
        property: "og:description",
        content: "Bulk hall ticket generation with digital verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HallTicketsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Hall tickets unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface TicketRow extends Record<string, unknown> {
  id: string;
  studentId: string;
  name: string;
  roll: string | null;
  papers: number;
  feeHold: boolean;
  holdReason: string | null;
  ticketNumber: string | null;
  verification: string | null;
  issuedAt: string | null;
  revoked: boolean;
  registrationIds: string[];
}

function HallTicketsPage() {
  const { can, tenant } = useAccess();
  const sessions = useExamSessions();
  const exams = useExams();
  const registrations = useExamRegistrations();
  const tickets = useHallTickets();
  const students = useStudentRegister();
  const seats = useExamSeats();
  const examRooms = useExamRooms();
  const rooms = useRooms();
  const lookups = useAcademicLookups();
  const generate = useGenerateHallTickets();
  const holds = useRegistrationHolds();
  const ticketMutations = useHallTicketMutations();

  const [sessionId, setSessionId] = useState("");
  const [preview, setPreview] = useState<HallTicketData | null>(null);
  const [zipping, setZipping] = useState(false);

  const canManage = can("hallticket.manage") || can("exam.update");
  const session = useMemo(
    () => (sessions.data ?? []).find((row) => row.id === sessionId) ?? null,
    [sessions.data, sessionId],
  );
  const sessionExams = useMemo(
    () => (exams.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [exams.data, sessionId],
  );
  const examIds = useMemo(() => new Set(sessionExams.map((row) => row.id)), [sessionExams]);
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );
  const programById = useMemo(
    () => new Map((lookups.programs.data ?? []).map((row) => [row.id, row])),
    [lookups.programs.data],
  );
  const courseById = useMemo(
    () => new Map((lookups.courses.data ?? []).map((row) => [row.id, row])),
    [lookups.courses.data],
  );
  const roomsById = useMemo(
    () => new Map((rooms.data ?? []).map((row) => [row.id, row])),
    [rooms.data],
  );
  const hallsById = useMemo(
    () => new Map((examRooms.data ?? []).map((row) => [row.id, row])),
    [examRooms.data],
  );

  const sessionTickets = useMemo(
    () => (tickets.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [tickets.data, sessionId],
  );

  const rows = useMemo<TicketRow[]>(() => {
    const byStudent = new Map<string, typeof registrations.data>();
    for (const registration of registrations.data ?? []) {
      if (!examIds.has(registration.exam_id)) continue;
      if (!["eligible", "registered"].includes(registration.status) && !registration.fee_hold)
        continue;
      byStudent.set(registration.student_id, [
        ...(byStudent.get(registration.student_id) ?? []),
        registration,
      ]);
    }
    return [...byStudent.entries()]
      .map(([studentId, list]) => {
        const student = studentById.get(studentId);
        const ticket = sessionTickets.find((row) => row.student_id === studentId);
        const held = (list ?? []).find((row) => row.fee_hold);
        return {
          id: studentId,
          studentId,
          name: student ? studentName(student) : "Unknown student",
          roll: student?.roll_number ?? student?.admission_number ?? null,
          papers: (list ?? []).length,
          feeHold: Boolean(held),
          holdReason: held?.hold_reason ?? null,
          ticketNumber: ticket?.ticket_number ?? null,
          verification: ticket?.verification_code ?? null,
          issuedAt: ticket?.issued_at ?? null,
          revoked: ticket?.is_revoked ?? false,
          registrationIds: (list ?? []).map((row) => row.id),
        } satisfies TicketRow;
      })
      .sort((a, b) => (a.roll ?? "").localeCompare(b.roll ?? ""));
  }, [registrations.data, examIds, studentById, sessionTickets]);

  const buildTicket = (row: TicketRow): HallTicketData => {
    const student = studentById.get(row.studentId);
    const program = student?.program_id ? programById.get(student.program_id) : null;
    const lines = sessionExams
      .filter((examRow) =>
        (registrations.data ?? []).some(
          (reg) => reg.exam_id === examRow.id && reg.student_id === row.studentId,
        ),
      )
      .map((examRow) => {
        const seat = (seats.data ?? []).find(
          (item) => item.exam_id === examRow.id && item.student_id === row.studentId,
        );
        const hall = seat ? hallsById.get(seat.exam_room_id) : null;
        const room = hall?.room_id ? roomsById.get(hall.room_id) : null;
        return {
          date: examRow.exam_date,
          time: examRow.starts_at ? formatDateTime(examRow.starts_at) : null,
          code: examRow.course_id ? (courseById.get(examRow.course_id)?.code ?? "—") : "—",
          title: examRow.title,
          room: room?.name ?? null,
          seat: seat?.seat_number ?? null,
        };
      });
    return {
      ticketNumber: row.ticketNumber ?? "—",
      verificationCode: row.verification ?? "—",
      studentName: row.name,
      rollNumber: row.roll,
      admissionNumber: student?.admission_number ?? null,
      photoUrl: student?.photo_url ?? null,
      programName: program?.name ?? null,
      sessionName: session?.name ?? "",
      validUntil: session?.ends_on ?? null,
      isRevoked: row.revoked,
      exams: lines,
    };
  };

  const issued = rows.filter((row) => row.ticketNumber && !row.revoked).length;
  const heldCount = rows.filter((row) => row.feeHold).length;

  return (
    <>
      <PageHeader
        title="Hall tickets"
        description="Eligibility, fee and attendance holds are validated before tickets are issued with QR and barcode verification."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Hall tickets" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "hall-ticket-register",
                  ["Roll", "Student", "Papers", "Ticket", "Verification", "Issued", "Status"],
                  rows.map((row) => [
                    row.roll,
                    row.name,
                    row.papers,
                    row.ticketNumber,
                    row.verification,
                    formatDate(row.issuedAt),
                    row.revoked ? "Revoked" : row.ticketNumber ? "Issued" : "Pending",
                  ]),
                )
              }
              disabled={!rows.length}
            >
              Export register
            </Button>
            <Button variant="outline" onClick={() => window.print()} disabled={!preview}>
              <Printer className="size-4" />
              Print preview
            </Button>
          </>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Exam session</CardTitle>
          <CardDescription>
            Tickets cover every paper the candidate is registered for in this session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="ticket-session">Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger id="ticket-session">
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
          {session && canManage ? (
            <Button
              onClick={() =>
                generate.mutate({
                  session,
                  students: rows
                    .filter((row) => !row.feeHold)
                    .map((row) => ({
                      id: row.studentId,
                      roll: row.roll,
                      name: row.name,
                      exams: sessionExams
                        .filter((examRow) =>
                          (registrations.data ?? []).some(
                            (reg) => reg.exam_id === examRow.id && reg.student_id === row.studentId,
                          ),
                        )
                        .map((examRow) => examRow.title),
                    })),
                  existing: sessionTickets,
                })
              }
              disabled={generate.isPending || !rows.length}
            >
              <TicketCheck className="size-4" />
              Bulk generate
            </Button>
          ) : null}
          {session ? (
            <Button
              variant="outline"
              disabled={!issued || zipping}
              onClick={async () => {
                setZipping(true);
                try {
                  await downloadHallTicketsZip(
                    rows.filter((row) => row.ticketNumber && !row.revoked).map(buildTicket),
                    {
                      collegeName: tenant?.name ?? "CampusOS",
                      verifyBaseUrl: `${window.location.origin}/verify`,
                      fileName: `hall-tickets-${session.name.replace(/\s+/g, "-").toLowerCase()}.zip`,
                    },
                  );
                } finally {
                  setZipping(false);
                }
              }}
            >
              <Download className="size-4" />
              {zipping ? "Preparing…" : "Download ZIP"}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {session ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Candidates" value={rows.length} />
            <StatCard label="Tickets issued" value={issued} />
            <StatCard label="On hold" value={heldCount} hint="Fee or attendance hold" />
            <StatCard label="Papers in session" value={sessionExams.length} />
          </div>

          <DataTable<TicketRow>
            rows={rows}
            loading={tickets.isLoading || students.isLoading}
            storageKey="hall-tickets"
            exportName="hall-tickets"
            getRowId={(row) => row.id}
            bulkActions={(ids, clear) =>
              canManage ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      holds.mutate({
                        ids: rows
                          .filter((row) => ids.includes(row.id))
                          .flatMap((row) => row.registrationIds),
                        feeHold: true,
                        reason: "Outstanding examination fee",
                      });
                      clear();
                    }}
                  >
                    <Ban className="size-4" />
                    Apply hold
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      holds.mutate({
                        ids: rows
                          .filter((row) => ids.includes(row.id))
                          .flatMap((row) => row.registrationIds),
                        feeHold: false,
                      });
                      clear();
                    }}
                  >
                    <Unlock className="size-4" />
                    Release hold
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const ticketIds = sessionTickets
                        .filter((ticket) => ids.includes(ticket.student_id))
                        .map((ticket) => ticket.id);
                      ticketMutations.revoke.mutate({
                        ids: ticketIds,
                        reason: "Revoked by exam office",
                      });
                      clear();
                    }}
                  >
                    Revoke ticket
                  </Button>
                </>
              ) : null
            }
            columns={[
              { key: "roll", header: "Roll", value: (row) => row.roll ?? "—", sortable: true },
              { key: "name", header: "Student", value: (row) => row.name, sortable: true },
              { key: "papers", header: "Papers", value: (row) => row.papers, sortable: true },
              {
                key: "status",
                header: "Status",
                value: (row) => (row.revoked ? "revoked" : row.ticketNumber ? "issued" : "pending"),
                render: (row) =>
                  row.feeHold ? (
                    <Badge variant="destructive">Hold</Badge>
                  ) : row.revoked ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : row.ticketNumber ? (
                    <Badge variant="secondary">Issued</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  ),
              },
              { key: "ticket", header: "Ticket no.", value: (row) => row.ticketNumber ?? "—" },
              {
                key: "verification",
                header: "Verification",
                value: (row) => row.verification ?? "—",
              },
              { key: "issued", header: "Issued", value: (row) => formatDate(row.issuedAt) },
              { key: "hold", header: "Hold reason", value: (row) => row.holdReason ?? "—" },
              {
                key: "actions",
                header: "",
                value: () => "",
                render: (row) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreview(buildTicket(row))}
                    disabled={!row.ticketNumber}
                  >
                    View
                  </Button>
                ),
              },
            ]}
            emptyTitle="No candidates"
            emptyDescription="Confirm registrations for this session first."
          />
        </>
      ) : (
        <EmptyState
          title="Select a session"
          description="Pick an exam session to issue hall tickets."
        />
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hall ticket</DialogTitle>
          </DialogHeader>
          {preview ? (
            <HallTicketCard
              ticket={preview}
              context={{
                collegeName: tenant?.name ?? "CampusOS",
                collegeLogo: tenant?.logo_url ?? null,
                verifyBaseUrl:
                  typeof window === "undefined" ? "/verify" : `${window.location.origin}/verify`,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
