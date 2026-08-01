import { createFileRoute } from "@tanstack/react-router";
import { FileBadge, Printer } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { GradeCard, type GradeCardData } from "@/components/exams/grade-card";
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
import { useAcademicLookups } from "@/hooks/useAcademics";
import {
  useCertificates,
  useExamSessions,
  useIssueCertificates,
  useResultCourses,
  useResults,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, formatDate } from "@/lib/export";
import { certificateKinds, labelize } from "@/lib/exams";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/certificates")({
  head: () => ({
    meta: [
      { title: "Marksheets, transcripts & certificates — CampusOS" },
      {
        name: "description",
        content:
          "Issue marksheets, grade cards, transcripts and provisional certificates with QR verification and public verification codes.",
      },
      { property: "og:title", content: "Marksheets, transcripts & certificates — CampusOS" },
      { property: "og:description", content: "Verifiable academic certificate issuance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CertificatesPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Certificates unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface CertRow extends Record<string, unknown> {
  id: string;
  resultId: string | null;
  studentId: string;
  roll: string | null;
  student: string;
  kind: string;
  number: string | null;
  verification: string | null;
  issuedOn: string | null;
  revoked: boolean;
  status: string;
}

function CertificatesPage() {
  const { can, tenant } = useAccess();
  const sessions = useExamSessions();
  const results = useResults();
  const resultCourses = useResultCourses();
  const certificates = useCertificates();
  const students = useStudentRegister();
  const lookups = useAcademicLookups();
  const issue = useIssueCertificates();

  const [sessionId, setSessionId] = useState("");
  const [kind, setKind] = useState<string>("grade_card");
  const [preview, setPreview] = useState<GradeCardData | null>(null);

  const canIssue = can("certificate.issue") || can("result.publish");
  const session = useMemo(
    () => (sessions.data ?? []).find((row) => row.id === sessionId) ?? null,
    [sessions.data, sessionId],
  );
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

  const sessionResults = useMemo(
    () => (results.data ?? []).filter((row) => row.exam_session_id === sessionId),
    [results.data, sessionId],
  );

  const rows = useMemo<CertRow[]>(
    () =>
      sessionResults.map((result) => {
        const student = studentById.get(result.student_id);
        const cert = (certificates.data ?? []).find(
          (row) => row.result_id === result.id && row.kind === kind,
        );
        return {
          id: result.id,
          resultId: result.id,
          studentId: result.student_id,
          roll: student?.roll_number ?? student?.admission_number ?? null,
          student: student ? studentName(student) : "Unknown student",
          kind,
          number: cert?.certificate_number ?? null,
          verification: cert?.verification_code ?? null,
          issuedOn: cert?.issued_on ?? null,
          revoked: cert?.is_revoked ?? false,
          status: result.status,
        } satisfies CertRow;
      }),
    [sessionResults, studentById, certificates.data, kind],
  );

  const buildCard = (row: CertRow): GradeCardData => {
    const result = sessionResults.find((item) => item.id === row.resultId);
    const student = studentById.get(row.studentId);
    const lines = (resultCourses.data ?? [])
      .filter((item) => item.result_id === row.resultId)
      .map((item) => {
        const course = item.course_id ? courseById.get(item.course_id) : null;
        return {
          code: course?.code ?? "—",
          title: course?.title ?? "Course",
          credits: item.credits,
          internal: item.internal_marks,
          external: item.external_marks,
          total: item.total_marks,
          max: item.max_marks,
          grade: item.grade,
          gradePoint: item.grade_point,
          isPass: item.is_pass,
        };
      });
    return {
      certificateNumber: row.number,
      verificationCode: row.verification,
      kindLabel: labelize(kind),
      studentName: row.student,
      rollNumber: row.roll,
      programName: student?.program_id ? (programById.get(student.program_id)?.name ?? null) : null,
      sessionName: session?.name ?? "",
      issuedOn: row.issuedOn,
      sgpa: result?.sgpa ?? null,
      cgpa: result?.cgpa ?? null,
      creditsEarned: result?.credits_earned ?? 0,
      creditsRegistered: result?.credits_registered ?? 0,
      percentage: result?.percentage ?? null,
      classAwarded: result?.class_awarded ?? null,
      rank: result?.rank ?? null,
      backlogs: result?.backlog_count ?? 0,
      isPass: result?.is_pass ?? false,
      lines,
    };
  };

  const issued = rows.filter((row) => row.number).length;
  const publishedResults = rows.filter((row) => row.status === "published").length;

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Marksheets, grade cards, transcripts and provisional certificates carry a QR code and a public verification code."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Certificates" }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadCsv(
                "certificate-register",
                ["Roll", "Student", "Kind", "Number", "Verification", "Issued"],
                rows.map((row) => [
                  row.roll,
                  row.student,
                  labelize(row.kind),
                  row.number,
                  row.verification,
                  formatDate(row.issuedOn),
                ]),
              )
            }
            disabled={!rows.length}
          >
            Export register
          </Button>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Issue certificates</CardTitle>
          <CardDescription>Only published results are eligible for issuance.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 gap-1.5">
            <Label htmlFor="cert-session">Session</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger id="cert-session">
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
          <div className="grid min-w-48 gap-1.5">
            <Label htmlFor="cert-kind">Certificate</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="cert-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {certificateKinds.map((row) => (
                  <SelectItem key={row} value={row}>
                    {labelize(row)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {session && canIssue ? (
            <Button
              onClick={() =>
                issue.mutate({
                  kind,
                  rows: rows
                    .filter((row) => row.status === "published" && !row.number)
                    .map((row) => ({
                      studentId: row.studentId,
                      resultId: row.resultId,
                      examSessionId: sessionId,
                      payload: buildCard(row) as unknown as Record<string, unknown>,
                    })),
                  existing: certificates.data ?? [],
                })
              }
              disabled={issue.isPending || !publishedResults}
            >
              <FileBadge className="size-4" />
              Bulk issue
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {session ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Candidates" value={rows.length} />
            <StatCard label="Published results" value={publishedResults} />
            <StatCard label="Issued" value={issued} />
            <StatCard label="Pending" value={publishedResults - issued} />
          </div>

          <DataTable<CertRow>
            rows={rows}
            loading={certificates.isLoading}
            storageKey="exam-certificates"
            exportName="certificates"
            getRowId={(row) => row.id}
            columns={[
              { key: "roll", header: "Roll", value: (row) => row.roll ?? "—", sortable: true },
              { key: "student", header: "Student", value: (row) => row.student, sortable: true },
              { key: "number", header: "Certificate no.", value: (row) => row.number ?? "—" },
              {
                key: "verification",
                header: "Verification",
                value: (row) => row.verification ?? "—",
              },
              { key: "issued", header: "Issued", value: (row) => formatDate(row.issuedOn) },
              {
                key: "status",
                header: "Result",
                value: (row) => row.status,
                render: (row) => <Badge variant="outline">{labelize(row.status)}</Badge>,
              },
              {
                key: "actions",
                header: "",
                value: () => "",
                render: (row) => (
                  <Button size="sm" variant="ghost" onClick={() => setPreview(buildCard(row))}>
                    <Printer className="size-4" />
                    View
                  </Button>
                ),
              },
            ]}
            emptyTitle="No results"
            emptyDescription="Publish results for this session to issue certificates."
          />
        </>
      ) : (
        <EmptyState title="Select a session" description="Pick a session to issue certificates." />
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.kindLabel}</DialogTitle>
          </DialogHeader>
          {preview ? (
            <GradeCard
              data={preview}
              collegeName={tenant?.name ?? "CampusOS"}
              verifyBaseUrl={
                typeof window === "undefined" ? "/verify" : `${window.location.origin}/verify`
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
