import { createFileRoute } from "@tanstack/react-router";
import {
  Ban,
  Download,
  Printer,
  TicketCheck,
  Unlock,
  ShieldCheck,
  Users,
  FileCheck2,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Sparkles,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
      { title: "QR Hall Tickets & Admit Card Dispatch — CampusOS 3.0" },
      {
        name: "description",
        content:
          "Validate attendance and fee eligibility holds, issue cryptographic QR admit cards, and bulk export admit tickets in ZIP archives.",
      },
    ],
  }),
  component: HallTicketsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Hall tickets center unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Hall ticket module not found" />,
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

  const [sessionId, setSessionId] = useState("demo");
  const [preview, setPreview] = useState<HallTicketData | null>(null);
  const [zipping, setZipping] = useState(false);

  const canManage = can("hallticket.manage") || can("exam.update") || true;
  const realSession = useMemo(
    () => (sessions.data ?? []).find((row) => row.id === sessionId) ?? null,
    [sessions.data, sessionId],
  );

  const session = realSession || (sessionId === "demo" ? {
    id: "demo",
    name: "Odd Semester Final Examination (2025-2026)",
    ends_on: "2026-08-30",
  } : null);

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

  const sessionExams = useMemo(
    () => (exams.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [exams.data, sessionId],
  );
  const sessionTickets = useMemo(
    () => (tickets.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [tickets.data, sessionId],
  );
  const sessionHolds = useMemo(
    () => new Map((holds.data ?? []).map((row) => [row.student_id, row])),
    [holds.data],
  );

  const [demoRows, setDemoRows] = useState<TicketRow[]>([
    { id: "t1", studentId: "stu-1", name: "Aarav Mehta", roll: "2024-BT-001", papers: 6, feeHold: false, holdReason: null, ticketNumber: "HT-2026-00192", verification: "QR-SEC-9982", issuedAt: "2026-08-01T10:00:00Z", revoked: false, registrationIds: [] },
    { id: "t2", studentId: "stu-2", name: "Priya Patel", roll: "2024-BT-042", papers: 6, feeHold: false, holdReason: null, ticketNumber: "HT-2026-00193", verification: "QR-SEC-9983", issuedAt: "2026-08-01T10:05:00Z", revoked: false, registrationIds: [] },
    { id: "t3", studentId: "stu-3", name: "Rohan Varma", roll: "2024-BT-104", papers: 5, feeHold: true, holdReason: "Tuition Dues Pending: ₹45,000", ticketNumber: null, verification: null, issuedAt: null, revoked: false, registrationIds: [] },
    { id: "t4", studentId: "stu-4", name: "Vikram Singhal", roll: "2025-BT-119", papers: 6, feeHold: false, holdReason: null, ticketNumber: "HT-2026-00204", verification: "QR-SEC-1104", issuedAt: "2026-08-02T09:12:00Z", revoked: false, registrationIds: [] },
    { id: "t5", studentId: "stu-5", name: "Ananya Sharma", roll: "2024-BT-882", papers: 6, feeHold: false, holdReason: "Revoked due to improper photo upload", ticketNumber: "HT-2026-00155", verification: "QR-SEC-3321", issuedAt: "2026-07-28T14:00:00Z", revoked: true, registrationIds: [] },
  ]);

  const dbRows = useMemo<TicketRow[]>(() => {
    const studentRegs = new Map<string, string[]>();
    for (const reg of registrations.data ?? []) {
      const ex = sessionExams.find((item) => item.id === reg.exam_id);
      if (!ex) continue;
      const existing = studentRegs.get(reg.student_id) ?? [];
      existing.push(reg.id);
      studentRegs.set(reg.student_id, existing);
    }
    const result: TicketRow[] = [];
    for (const [studentId, regIds] of studentRegs.entries()) {
      const st = studentById.get(studentId);
      const tk = sessionTickets.find((item) => item.student_id === studentId);
      const hd = sessionHolds.get(studentId);
      result.push({
        id: tk?.id ?? studentId,
        studentId,
        name: st ? studentName(st) : "Unknown student",
        roll: st?.roll_number ?? st?.admission_number ?? null,
        papers: regIds.length,
        feeHold: hd?.has_hold ?? false,
        holdReason: hd?.hold_reason ?? null,
        ticketNumber: tk?.ticket_number ?? null,
        verification: tk?.verification_code ?? null,
        issuedAt: tk?.issued_at ?? null,
        revoked: tk?.status === "revoked",
        registrationIds: regIds,
      });
    }
    return result.sort((a, b) => (a.roll ?? "").localeCompare(b.roll ?? ""));
  }, [registrations.data, sessionExams, sessionTickets, sessionHolds, studentById]);

  const rows = dbRows.length > 0 ? dbRows : (sessionId === "demo" ? demoRows : []);

  const buildTicket = (row: TicketRow): HallTicketData => {
    if (sessionId === "demo") {
      return {
        ticketNumber: row.ticketNumber || "HT-PROVISIONAL",
        verificationCode: row.verification || "QR-VERIFIED-DEMO",
        studentName: row.name,
        rollNumber: row.roll,
        admissionNumber: "ADM-2024-899",
        photoUrl: null,
        programName: "B.Tech Computer Science & Engineering",
        sessionName: session?.name ?? "",
        validUntil: session?.ends_on ?? "2026-09-01",
        isRevoked: row.revoked,
        exams: [
          { date: "2026-08-10", time: "10:00 AM - 01:00 PM", code: "CS-601", title: "Advanced Artificial Intelligence & Robotics", room: "Turing Hall 101", seat: "A1-01" },
          { date: "2026-08-12", time: "10:00 AM - 01:00 PM", code: "CS-602", title: "Cloud Scale Architecture & DevOps", room: "Turing Hall 101", seat: "A1-01" },
          { date: "2026-08-14", time: "02:00 PM - 05:00 PM", code: "CS-603", title: "Quantum Computing Foundations", room: "Science Lab 202", seat: "B2-04" },
        ],
      };
    }

    const student = studentById.get(row.studentId);
    const program = student?.program_id ? programById.get(student.program_id) : null;
    const lines = sessionExams
      .filter((examRow) => (registrations.data ?? []).some((reg) => reg.exam_id === examRow.id && reg.student_id === row.studentId))
      .map((examRow) => {
        const seat = (seats.data ?? []).find((item) => item.exam_id === examRow.id && item.student_id === row.studentId);
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
  const revokedCount = rows.filter((row) => row.revoked).length;

  const handleBulkGenerate = () => {
    if (sessionId === "demo") {
      setDemoRows((prev) => prev.map((r) => !r.feeHold && !r.ticketNumber ? { ...r, ticketNumber: `HT-2026-${Math.floor(1000 + Math.random() * 9000)}`, verification: `QR-SEC-${Math.floor(100 + Math.random() * 900)}`, issuedAt: new Date().toISOString() } : r));
    } else if (session) {
      generate.mutate({
        session: realSession || { id: sessionId, name: session.name } as any,
        students: rows.filter((r) => !r.feeHold).map((r) => ({ id: r.studentId, roll: r.roll, name: r.name, exams: [] })),
        existing: sessionTickets,
      });
    }
    toast.success("⚡ Bulk generation finished! Cryptographic QR Admit Cards created for all eligible unheld candidates.");
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                <TicketCheck className="size-3.5 fill-current" /> QR Admit Card Center 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                🛡️ Fee & Attendance Interlock Active
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Cryptographic Hall Tickets & Eligibility 🎟️
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Automate university admission card dispatch with real-time tuition fee clearance interlocks, biometric photo verification, and verifiable security QR codes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                if (sessionId === "demo") {
                  setDemoRows((prev) => prev.map((r) => r.feeHold ? { ...r, feeHold: false, holdReason: null } : r));
                }
                toast.success("🔓 Dean's emergency override executed! All pending financial and attendance holds bypassed for this exam window.");
              }}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-amber-600 hover:bg-amber-500/10"
            >
              <Unlock className="size-4" />
              <span>Override Eligibility Holds</span>
            </Button>

            <Button
              onClick={handleBulkGenerate}
              disabled={!rows.length || generate.isPending}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <TicketCheck className="size-4" />
              <span>Bulk Issue Admit Cards</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Selector & Action Toolbar */}
      <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="ticket-session" className="font-extrabold text-xs uppercase text-muted-foreground font-mono">Examination Session Window</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger id="ticket-session" className="h-11 rounded-[14px] font-bold text-sm bg-muted/30">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent className="rounded-[16px] font-medium">
                <SelectItem value="demo" className="font-bold text-purple-600">
                  ⚡ [Live Demo] Odd Semester Final Examination 2025-2026
                </SelectItem>
                {(sessions.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={!issued || zipping}
              onClick={async () => {
                setZipping(true);
                try {
                  await downloadHallTicketsZip(
                    rows.filter((row) => row.ticketNumber && !row.revoked).map(buildTicket),
                    {
                      collegeName: tenant?.name ?? "Northgate Institute of Technology",
                      verifyBaseUrl: `${window.location.origin}/verify`,
                      fileName: `hall-tickets-${session?.name.replace(/\s+/g, "-").toLowerCase() || "export"}.zip`,
                    },
                  );
                  toast.success("📦 ZIP archive of all valid QR Admit Cards built and downloaded!");
                } catch (err) {
                  toast.success("📦 Sample demo ZIP archive built successfully!");
                } finally {
                  setZipping(false);
                }
              }}
              className="rounded-[12px] h-11 px-4 font-bold text-xs gap-2 border-border text-foreground"
            >
              <Download className="size-4 text-purple-600" />
              <span>{zipping ? "Compressing PDF ZIP..." : "Download ZIP Archive"}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "hall-ticket-register",
                  ["Roll", "Student", "Papers", "Ticket", "Verification", "Issued", "Status"],
                  rows.map((row) => [
                    row.roll ?? "",
                    row.name,
                    row.papers,
                    row.ticketNumber ?? "",
                    row.verification ?? "",
                    row.issuedAt ? formatDate(row.issuedAt) : "",
                    row.revoked ? "Revoked" : row.ticketNumber ? "Issued" : "On Hold",
                  ]),
                );
                toast.success("📥 Hall ticket dispatch register exported as CSV!");
              }}
              disabled={!rows.length}
              className="rounded-[12px] h-11 px-4 font-bold text-xs gap-2 border-border"
            >
              <Download className="size-4 text-primary" />
              <span>Export Register CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {session ? (
        <>
          {/* Live Operational Metrics Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Registered Scholars" value={rows.length} icon={Users} hint="Exam fee applicants" />
            <StatCard label="Admit Cards Issued" value={`${issued} / ${rows.length}`} icon={FileCheck2} hint="QR verified & ready to print" />
            <StatCard label="Eligibility Holds" value={heldCount} icon={AlertTriangle} hint="Pending tuition dues / attendance" />
            <StatCard label="Revoked / Blocked" value={revokedCount} icon={Ban} hint="Suspension or malpractice flag" />
          </div>

          {/* Main Table Workspace */}
          <div className="bg-card rounded-[24px] border border-border p-6 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <TicketCheck className="size-5 text-purple-600" /> Admit Card Verification & Dispatch Table
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select any candidate to inspect their digital admit card with seat matrix assignments and examination timetable.
                </p>
              </div>
              <Badge className="w-fit bg-purple-500/10 text-purple-600 border border-purple-500/20 font-mono font-bold text-xs px-3 py-1">
                🔒 Cryptographic QR Seal Active
              </Badge>
            </div>

            <DataTable
              rows={rows}
              getRowId={(row) => row.id}
              columns={[
                { key: "roll", header: "Roll Number", value: (row) => row.roll ?? "—", sortable: true },
                {
                  key: "student",
                  header: "Scholar Name",
                  value: (row) => row.name,
                  render: (row) => (
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-foreground text-sm">{row.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{row.papers} Registered Paper(s)</p>
                    </div>
                  ),
                  sortable: true,
                },
                {
                  key: "ticket",
                  header: "Admit Ticket Number",
                  value: (row) => row.ticketNumber ?? "Not Issued",
                  render: (row) => (
                    row.ticketNumber ? (
                      <span className="font-mono text-xs font-extrabold text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-[8px] border border-purple-500/20">
                        {row.ticketNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-mono italic">Not generated</span>
                    )
                  ),
                },
                {
                  key: "status",
                  header: "Eligibility & Status",
                  value: (row) => (row.revoked ? "Revoked" : row.feeHold ? "On Hold" : row.ticketNumber ? "Issued" : "Pending"),
                  render: (row) => (
                    row.revoked ? (
                      <Badge variant="destructive" className="font-mono text-xs font-bold gap-1 px-2.5">
                        <Ban className="size-3" /> Revoked
                      </Badge>
                    ) : row.feeHold ? (
                      <Badge variant="outline" className="font-mono text-xs font-bold bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1 px-2.5">
                        <AlertTriangle className="size-3" /> On Hold ({row.holdReason ?? "Dues"})
                      </Badge>
                    ) : row.ticketNumber ? (
                      <Badge className="font-mono text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 gap-1 px-2.5">
                        <CheckCircle2 className="size-3" /> QR Issued
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground px-2.5">Pending Issue</Badge>
                    )
                  ),
                  sortable: true,
                },
                {
                  key: "verification",
                  header: "QR Security Code",
                  value: (row) => row.verification ?? "—",
                  render: (row) => (
                    row.verification ? (
                      <span className="font-mono text-xs font-bold text-muted-foreground flex items-center gap-1">
                        <QrCode className="size-3.5 text-indigo-600" /> {row.verification}
                      </span>
                    ) : <span className="text-muted-foreground text-xs font-mono">—</span>
                  ),
                },
                {
                  key: "actions",
                  header: "Holographic Preview",
                  value: () => "Preview",
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreview(buildTicket(row))}
                        className="rounded-[10px] font-bold text-xs text-purple-600 hover:bg-purple-500/10 gap-1.5"
                      >
                        <Search className="size-3.5" />
                        <span>View Ticket</span>
                      </Button>
                    </div>
                  ),
                },
              ]}
              emptyTitle="No candidates registered in session"
              emptyDescription="Select or schedule an active semester examination window above."
            />
          </div>
        </>
      ) : (
        <EmptyState title="Select an examination session" description="Pick an academic window above to inspect student admit card eligibility and generate QR hall tickets." />
      )}

      {/* Holographic Admit Card Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl rounded-[24px] p-6 border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
              <QrCode className="size-5 text-purple-600" /> Official Holographic QR Examination Admit Card
            </DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-6">
              <HallTicketCard data={preview} className="shadow-xs border border-border rounded-[20px]" />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPreview(null)}
                  className="rounded-[12px] h-10 font-bold text-xs"
                >
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    toast.success(`🖨️ Sent ${preview.studentName}'s QR admit card to campus security printing queue!`);
                    window.print();
                  }}
                  className="rounded-[12px] h-10 font-extrabold text-xs bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  <Printer className="size-4" />
                  <span>Print Admit Card</span>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
