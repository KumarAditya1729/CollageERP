import { useQuery } from "@tanstack/react-query";
import { Download, FileText, TicketCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { GradeCard, type GradeCardData } from "@/components/exams/grade-card";
import { HallTicketCard, type HallTicketData } from "@/components/exams/hall-ticket-card";
import { EmptyState } from "@/components/common/states";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { downloadHallTicketsZip } from "@/lib/hall-ticket-zip";
import { labelize } from "@/lib/exams";
import { formatDate, formatDateTime } from "@/lib/export";
import { useRequestRevaluation } from "@/hooks/useExams";

interface Props {
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  admissionNumber: string | null;
  photoUrl?: string | null;
  programName: string | null;
  collegeName: string;
  collegeLogo?: string | null;
}

const verifyBase = () =>
  typeof window === "undefined" ? "/verify" : `${window.location.origin}/verify`;

/** Student-facing examination panel: schedule, hall ticket, results, certificates, revaluation. */
export function StudentExamPanel({
  studentId,
  studentName,
  rollNumber,
  admissionNumber,
  photoUrl,
  programName,
  collegeName,
  collegeLogo,
}: Props) {
  const [ticketPreview, setTicketPreview] = useState<HallTicketData | null>(null);
  const [cardPreview, setCardPreview] = useState<GradeCardData | null>(null);
  const [revalExamId, setRevalExamId] = useState("");
  const [revalKind, setRevalKind] = useState("revaluation");
  const [revalReason, setRevalReason] = useState("");
  const requestReval = useRequestRevaluation();

  const registrations = useQuery({
    queryKey: ["student-exam-registrations", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_registrations")
        .select(
          "id, status, exam_id, fee_hold, hold_reason, exams(id, title, exam_date, starts_at, ends_at, max_marks, exam_session_id, courses(code, title))",
        )
        .eq("student_id", studentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const seats = useQuery({
    queryKey: ["student-exam-seats", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_seats")
        .select("exam_id, seat_number, bench_number, exam_rooms(rooms(name))")
        .eq("student_id", studentId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const tickets = useQuery({
    queryKey: ["student-hall-tickets", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hall_tickets")
        .select(
          "id, ticket_number, verification_code, issued_at, valid_until, is_revoked, exam_sessions(name, ends_on)",
        )
        .eq("student_id", studentId)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const results = useQuery({
    queryKey: ["student-results", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select(
          "id, status, sgpa, cgpa, percentage, credits_earned, credits_registered, class_awarded, rank, backlog_count, is_pass, published_at, exam_sessions(name)",
        )
        .eq("student_id", studentId)
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const resultIds = (results.data ?? []).map((row) => row.id);
  const resultCourses = useQuery({
    queryKey: ["student-result-courses", studentId, resultIds.join(",")],
    enabled: resultIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("result_courses")
        .select(
          "id, result_id, credits, internal_marks, external_marks, total_marks, max_marks, grade, grade_point, is_pass, courses(code, title)",
        )
        .in("result_id", resultIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const certificates = useQuery({
    queryKey: ["student-certificates", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("id, kind, certificate_number, verification_code, issued_on, is_revoked, result_id")
        .eq("student_id", studentId)
        .order("issued_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const revaluations = useQuery({
    queryKey: ["student-revaluations", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revaluation_requests")
        .select(
          "id, kind, status, reason, original_marks, revised_marks, payment_status, created_at, reviewed_at, exams(title)",
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const seatFor = (examId: string) => {
    const seat = (seats.data ?? []).find((row) => row.exam_id === examId);
    if (!seat) return { room: null as string | null, seat: null as string | null };
    const rooms = (seat.exam_rooms as { rooms?: { name?: string } | null } | null)?.rooms;
    return { room: rooms?.name ?? null, seat: `${seat.seat_number}` };
  };

  const ticketData = useMemo<HallTicketData[]>(
    () =>
      (tickets.data ?? []).map((ticket) => {
        const session = ticket.exam_sessions as { name?: string; ends_on?: string } | null;
        const lines = (registrations.data ?? [])
          .map((row) => row.exams as Record<string, unknown> | null)
          .filter(Boolean)
          .map((exam) => {
            const course = (exam as { courses?: { code?: string; title?: string } | null }).courses;
            const seat = seatFor(String((exam as { id: string }).id));
            return {
              date: ((exam as { exam_date?: string }).exam_date ?? null) as string | null,
              time: ((exam as { starts_at?: string }).starts_at ?? null) as string | null,
              code: course?.code ?? "—",
              title: course?.title ?? String((exam as { title?: string }).title ?? "Paper"),
              room: seat.room,
              seat: seat.seat,
            };
          });
        return {
          ticketNumber: ticket.ticket_number,
          verificationCode: ticket.verification_code,
          studentName,
          rollNumber,
          admissionNumber,
          photoUrl: photoUrl ?? null,
          programName,
          sessionName: session?.name ?? "Examination",
          validUntil: ticket.valid_until ?? session?.ends_on ?? null,
          isRevoked: ticket.is_revoked,
          exams: lines,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      tickets.data,
      registrations.data,
      seats.data,
      studentName,
      rollNumber,
      admissionNumber,
      programName,
    ],
  );

  const buildGradeCard = (
    resultId: string,
    kindLabel: string,
    certificate?: {
      certificate_number: string;
      verification_code: string;
      issued_on: string | null;
    },
  ): GradeCardData | null => {
    const result = (results.data ?? []).find((row) => row.id === resultId);
    if (!result) return null;
    const lines = (resultCourses.data ?? [])
      .filter((row) => row.result_id === resultId)
      .map((row) => {
        const course = row.courses as { code?: string; title?: string } | null;
        return {
          code: course?.code ?? "—",
          title: course?.title ?? "Course",
          credits: Number(row.credits ?? 0),
          internal: Number(row.internal_marks ?? 0),
          external: Number(row.external_marks ?? 0),
          total: Number(row.total_marks ?? 0),
          max: Number(row.max_marks ?? 100),
          grade: row.grade,
          gradePoint: row.grade_point === null ? null : Number(row.grade_point),
          isPass: Boolean(row.is_pass),
        };
      });
    return {
      certificateNumber: certificate?.certificate_number ?? null,
      verificationCode: certificate?.verification_code ?? null,
      kindLabel,
      studentName,
      rollNumber,
      programName,
      sessionName: (result.exam_sessions as { name?: string } | null)?.name ?? "Examination",
      issuedOn: certificate?.issued_on ?? result.published_at,
      sgpa: result.sgpa === null ? null : Number(result.sgpa),
      cgpa: result.cgpa === null ? null : Number(result.cgpa),
      creditsEarned: Number(result.credits_earned ?? 0),
      creditsRegistered: Number(result.credits_registered ?? 0),
      percentage: result.percentage === null ? null : Number(result.percentage),
      classAwarded: result.class_awarded,
      rank: result.rank,
      backlogs: Number(result.backlog_count ?? 0),
      isPass: Boolean(result.is_pass),
      lines,
    };
  };

  const transcript = (): GradeCardData | null => {
    const first = (results.data ?? [])[0];
    if (!first) return null;
    const base = buildGradeCard(first.id, "Consolidated transcript");
    if (!base) return null;
    const allLines = (resultCourses.data ?? []).map((row) => {
      const course = row.courses as { code?: string; title?: string } | null;
      return {
        code: course?.code ?? "—",
        title: course?.title ?? "Course",
        credits: Number(row.credits ?? 0),
        internal: Number(row.internal_marks ?? 0),
        external: Number(row.external_marks ?? 0),
        total: Number(row.total_marks ?? 0),
        max: Number(row.max_marks ?? 100),
        grade: row.grade,
        gradePoint: row.grade_point === null ? null : Number(row.grade_point),
        isPass: Boolean(row.is_pass),
      };
    });
    return { ...base, lines: allLines, sessionName: "All semesters" };
  };

  const examOptions = (registrations.data ?? []).map((row) => {
    const exam = row.exams as { id?: string; title?: string } | null;
    return { id: exam?.id ?? row.exam_id, title: exam?.title ?? "Paper" };
  });

  return (
    <>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Examinations</CardTitle>
          <CardDescription>
            Your exam schedule, hall tickets, published results, certificates and revaluation
            requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList className="flex-wrap">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="tickets">Hall ticket</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="revaluation">Revaluation</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              {registrations.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2">Paper</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Room</th>
                        <th>Seat</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.data.map((row) => {
                        const exam = row.exams as Record<string, unknown> | null;
                        const course = (
                          exam as { courses?: { code?: string; title?: string } } | null
                        )?.courses;
                        const seat = seatFor(String(row.exam_id));
                        return (
                          <tr key={row.id} className="border-t">
                            <td className="py-2">
                              <span className="font-medium">{course?.code ?? "—"}</span>{" "}
                              {course?.title ?? String((exam as { title?: string })?.title ?? "")}
                            </td>
                            <td>
                              {formatDate((exam as { exam_date?: string })?.exam_date ?? null)}
                            </td>
                            <td>
                              {formatDateTime((exam as { starts_at?: string })?.starts_at ?? null)}
                            </td>
                            <td>{seat.room ?? "—"}</td>
                            <td>{seat.seat ?? "—"}</td>
                            <td>
                              {row.fee_hold ? (
                                <Badge variant="destructive">Hold</Badge>
                              ) : (
                                <Badge variant="outline">{labelize(row.status)}</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No exam registrations"
                  description="Your papers appear once registration is confirmed."
                />
              )}
            </TabsContent>

            <TabsContent value="tickets" className="space-y-3">
              {ticketData.length ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void downloadHallTicketsZip(ticketData, {
                          collegeName,
                          verifyBaseUrl: verifyBase(),
                          fileName: `hall-tickets-${rollNumber ?? studentId.slice(0, 6)}`,
                        })
                      }
                    >
                      <Download className="size-4" />
                      Download ZIP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketPreview(ticketData[0]!)}
                    >
                      <TicketCheck className="size-4" />
                      Open latest
                    </Button>
                  </div>
                  <ul className="divide-y rounded-lg border">
                    {ticketData.map((ticket) => (
                      <li
                        key={ticket.ticketNumber}
                        className="flex items-center justify-between gap-3 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{ticket.ticketNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.sessionName} · valid till {formatDate(ticket.validUntil)}
                          </p>
                        </div>
                        {ticket.isRevoked ? <Badge variant="destructive">Revoked</Badge> : null}
                        <Button size="sm" variant="ghost" onClick={() => setTicketPreview(ticket)}>
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState
                  title="No hall ticket yet"
                  description="Hall tickets are released once eligibility and fee holds are cleared."
                />
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-3">
              {results.data?.length ? (
                <ul className="divide-y rounded-lg border">
                  {results.data.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {(row.exam_sessions as { name?: string } | null)?.name ?? "Examination"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SGPA {row.sgpa ?? "—"} · CGPA {row.cgpa ?? "—"} · {row.percentage ?? "—"}%
                          · {row.class_awarded ?? "—"}
                          {row.rank ? ` · Rank ${row.rank}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={row.is_pass ? "secondary" : "destructive"}>
                          {row.is_pass ? "Pass" : "Fail"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCardPreview(buildGradeCard(row.id, "Grade card"))}
                        >
                          Grade card
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No published results"
                  description="Results appear here as soon as the exam office publishes them."
                />
              )}
              {results.data?.length ? (
                <Button variant="outline" size="sm" onClick={() => setCardPreview(transcript())}>
                  <FileText className="size-4" />
                  Consolidated transcript
                </Button>
              ) : null}
            </TabsContent>

            <TabsContent value="certificates">
              {certificates.data?.length ? (
                <ul className="divide-y rounded-lg border">
                  {certificates.data.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{labelize(row.kind)}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.certificate_number} · issued {formatDate(row.issued_on)} · code{" "}
                          {row.verification_code}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.is_revoked ? <Badge variant="destructive">Revoked</Badge> : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setCardPreview(
                              row.result_id
                                ? buildGradeCard(row.result_id, labelize(row.kind), {
                                    certificate_number: row.certificate_number,
                                    verification_code: row.verification_code,
                                    issued_on: row.issued_on,
                                  })
                                : null,
                            )
                          }
                          disabled={!row.result_id}
                        >
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No certificates issued"
                  description="Marksheets and transcripts appear here once issued."
                />
              )}
            </TabsContent>

            <TabsContent value="revaluation" className="space-y-4">
              <form
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!revalExamId || revalReason.trim().length < 10) return;
                  requestReval.mutate(
                    {
                      examId: revalExamId,
                      studentId,
                      markId: null,
                      kind: revalKind,
                      reason: revalReason.trim(),
                      originalMarks: null,
                    },
                    {
                      onSuccess: () => {
                        setRevalReason("");
                        void revaluations.refetch();
                      },
                    },
                  );
                }}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="reval-exam">Paper</Label>
                  <Select value={revalExamId} onValueChange={setRevalExamId}>
                    <SelectTrigger id="reval-exam">
                      <SelectValue placeholder="Select a paper" />
                    </SelectTrigger>
                    <SelectContent>
                      {examOptions.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="reval-kind">Request type</Label>
                  <Select value={revalKind} onValueChange={setRevalKind}>
                    <SelectTrigger id="reval-kind">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revaluation">Revaluation</SelectItem>
                      <SelectItem value="retotal">Retotal</SelectItem>
                      <SelectItem value="challenge">Challenge evaluation</SelectItem>
                      <SelectItem value="photocopy">Answer script photocopy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="reval-reason">Reason</Label>
                  <Textarea
                    id="reval-reason"
                    value={revalReason}
                    onChange={(event) => setRevalReason(event.target.value.slice(0, 1000))}
                    placeholder="Explain why you are requesting a review (minimum 10 characters)."
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      requestReval.isPending || !revalExamId || revalReason.trim().length < 10
                    }
                  >
                    Submit request
                  </Button>
                </div>
              </form>

              {revaluations.data?.length ? (
                <ul className="divide-y rounded-lg border">
                  {revaluations.data.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {labelize(row.kind)} ·{" "}
                          {(row.exams as { title?: string } | null)?.title ?? "Paper"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatDateTime(row.created_at)} · payment{" "}
                          {labelize(row.payment_status)}
                          {row.revised_marks !== null ? ` · revised to ${row.revised_marks}` : ""}
                        </p>
                      </div>
                      <Badge variant={row.status === "approved" ? "secondary" : "outline"}>
                        {labelize(row.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No revaluation requests"
                  description="Requests you raise appear here with their review status."
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(ticketPreview)}
        onOpenChange={(open) => !open && setTicketPreview(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hall ticket</DialogTitle>
          </DialogHeader>
          {ticketPreview ? (
            <HallTicketCard
              ticket={ticketPreview}
              context={{ collegeName, collegeLogo, verifyBaseUrl: verifyBase() }}
            />
          ) : null}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cardPreview)} onOpenChange={(open) => !open && setCardPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{cardPreview?.kindLabel ?? "Grade card"}</DialogTitle>
          </DialogHeader>
          {cardPreview ? (
            <GradeCard data={cardPreview} collegeName={collegeName} verifyBaseUrl={verifyBase()} />
          ) : null}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
