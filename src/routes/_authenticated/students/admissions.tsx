import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { StatCard } from "@/components/common/stat-card";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useStudentLookups, useStudentMutations, useStudentRegister } from "@/hooks/useStudents";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/export";
import {
  GENDERS,
  generateStudentNumbers,
  humanise,
  studentName,
  type StudentRecord,
} from "@/lib/students";

export const Route = createFileRoute("/_authenticated/students/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions pipeline — CampusOS" },
      {
        name: "description",
        content:
          "Track applications from enquiry through document verification and approval into enrolment.",
      },
      { property: "og:title", content: "Admissions pipeline — CampusOS" },
      {
        property: "og:description",
        content: "Applications, verification and approvals in one board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdmissionsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Could not load admissions" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

type Stage = "applied" | "verification" | "approval" | "enrolled";

const STAGES: { key: Stage; title: string; hint: string }[] = [
  { key: "applied", title: "Applied", hint: "New applications awaiting document upload" },
  {
    key: "verification",
    title: "Document verification",
    hint: "Documents uploaded, pending verification",
  },
  { key: "approval", title: "Pending approval", hint: "Verified and waiting on an approver" },
  { key: "enrolled", title: "Enrolled", hint: "Admitted with identifiers issued" },
];

function AdmissionsPage() {
  const { tenant, campus, can } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = can("student.manage");

  const register = useStudentRegister();
  const lookups = useStudentLookups();
  const { createStudent, updateStudent } = useStudentMutations();
  const [createOpen, setCreateOpen] = useState(false);

  const applicants = useMemo(
    () => (register.data ?? []).filter((row) => row.status === "applicant"),
    [register.data],
  );
  const applicantIds = applicants.map((row) => row.id);

  const docs = useQuery({
    queryKey: ["admission-documents", tenant?.id, applicantIds.join(",")],
    enabled: applicantIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("entity_id, status")
        .eq("entity_type", "students")
        .in("entity_id", applicantIds)
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as { entity_id: string; status: string }[];
    },
  });

  const instances = useQuery({
    queryKey: ["admission-workflow-instances", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_instances")
        .select("id, entity_id, status, subject, created_at")
        .eq("tenant_id", tenant!.id)
        .eq("entity_type", "students")
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        entity_id: string;
        status: string;
        subject: string | null;
        created_at: string;
      }[];
    },
  });

  const admissionWorkflow = useQuery({
    queryKey: ["admission-workflow", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, key, name, current_version")
        .eq("tenant_id", tenant!.id)
        .eq("entity_type", "students")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; key: string; name: string; current_version: number } | null;
    },
  });

  const docSummary = useMemo(() => {
    const map = new Map<string, { total: number; verified: number }>();
    for (const doc of docs.data ?? []) {
      const entry = map.get(doc.entity_id) ?? { total: 0, verified: 0 };
      entry.total += 1;
      if (doc.status === "verified") entry.verified += 1;
      map.set(doc.entity_id, entry);
    }
    return map;
  }, [docs.data]);

  const instanceFor = (studentId: string) =>
    (instances.data ?? []).find((item) => item.entity_id === studentId) ?? null;

  const stageOf = (row: StudentRecord): Stage => {
    const summary = docSummary.get(row.id);
    if (!summary || summary.total === 0) return "applied";
    if (summary.verified === 0) return "verification";
    return "approval";
  };

  const board = useMemo(() => {
    const grouped: Record<Stage, StudentRecord[]> = {
      applied: [],
      verification: [],
      approval: [],
      enrolled: [],
    };
    for (const row of applicants) grouped[stageOf(row)].push(row);
    grouped.enrolled = (register.data ?? [])
      .filter((row) => row.status === "enrolled")
      .sort((a, b) => String(b.admission_date ?? "").localeCompare(String(a.admission_date ?? "")))
      .slice(0, 12);
    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicants, register.data, docSummary]);

  const requestApproval = useMutation({
    mutationFn: async (row: StudentRecord) => {
      const workflow = admissionWorkflow.data;
      if (!workflow)
        throw new Error("No active admission workflow is configured for this college.");
      const { error } = await supabase.from("workflow_instances").insert({
        tenant_id: tenant!.id,
        campus_id: row.campus_id ?? campus?.id ?? null,
        workflow_id: workflow.id,
        version: workflow.current_version,
        entity_type: "students",
        entity_id: row.id,
        subject: `Admission approval — ${studentName(row)} (${row.admission_number})`,
        status: "pending",
        requested_by: user?.id ?? null,
        created_by: user?.id ?? null,
        payload: { admission_number: row.admission_number },
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sent for approval");
      void queryClient.invalidateQueries({ queryKey: ["admission-workflow-instances"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const admit = useMutation({
    mutationFn: async (row: StudentRecord) => {
      const programCode = lookups.data?.programs.find((p) => p.id === row.program_id)?.code ?? null;
      const numbers = await generateStudentNumbers(tenant!.id, { programCode });
      await updateStudent.mutateAsync({
        ids: [row.id],
        values: {
          status: "enrolled",
          admission_date: row.admission_date ?? new Date().toISOString().slice(0, 10),
          registration_number: row.registration_number ?? numbers.registration_number,
          roll_number: row.roll_number ?? numbers.roll_number,
        },
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (register.error) {
    return (
      <ErrorState
        title="Could not load the admissions pipeline"
        description={(register.error as Error).message}
        onRetry={() => void register.refetch()}
      />
    );
  }

  const thisYear = new Date().getFullYear();
  const admittedThisYear = (register.data ?? []).filter(
    (row) => row.admission_date && new Date(row.admission_date).getFullYear() === thisYear,
  ).length;

  return (
    <>
      <PageHeader
        title="Admissions"
        description="Applications move from enquiry through document verification and approval into the register."
        crumbs={[
          { label: "People" },
          { label: "Students", to: "/students" },
          { label: "Admissions" },
        ]}
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="size-4" />
              New application
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open applications" value={applicants.length} hint="Status: applicant" />
        <StatCard
          label="Awaiting verification"
          value={board.verification.length}
          hint="Documents uploaded"
        />
        <StatCard
          label="Pending approval"
          value={board.approval.length}
          hint="Verified documents"
        />
        <StatCard
          label={`Admitted in ${thisYear}`}
          value={admittedThisYear}
          hint="Enrolment confirmed"
        />
      </div>

      {register.isLoading ? <InlineLoader label="Loading pipeline" /> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {STAGES.map((stage) => (
          <Card key={stage.key} className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                {stage.title}
                <Badge variant="secondary">{board[stage.key].length}</Badge>
              </CardTitle>
              <CardDescription className="text-xs">{stage.hint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!board[stage.key].length ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Nothing at this stage.
                </p>
              ) : null}
              {board[stage.key].map((row) => {
                const summary = docSummary.get(row.id);
                const instance = instanceFor(row.id);
                return (
                  <div key={row.id} className="space-y-2 rounded-lg border p-3">
                    <Link
                      to="/students/$studentId"
                      params={{ studentId: row.id }}
                      className="block text-sm font-medium hover:underline"
                    >
                      {studentName(row)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.admission_number}
                      {row.admission_date ? ` · applied ${formatDate(row.admission_date)}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[11px]">
                        {summary ? `${summary.verified}/${summary.total} verified` : "No documents"}
                      </Badge>
                      {instance ? (
                        <Badge variant="secondary" className="text-[11px] capitalize">
                          {humanise(instance.status)}
                        </Badge>
                      ) : null}
                    </div>

                    {canManage && stage.key !== "enrolled" ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/students/$studentId" params={{ studentId: row.id }}>
                            <FileCheck2 className="size-3.5" />
                            Documents
                          </Link>
                        </Button>
                        {stage.key === "approval" && !instance ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => requestApproval.mutate(row)}
                            disabled={requestApproval.isPending}
                          >
                            Send for approval
                          </Button>
                        ) : null}
                        {stage.key === "approval" ? (
                          <Button
                            size="sm"
                            onClick={() => admit.mutate(row)}
                            disabled={admit.isPending}
                          >
                            <CheckCircle2 className="size-3.5" />
                            Admit
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <RecordFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New application"
        description="Creates an applicant record. Identifiers are issued automatically when the student is admitted."
        submitLabel="Create application"
        initialValues={{ admission_date: new Date().toISOString().slice(0, 10) }}
        fields={[
          { name: "first_name", label: "First name", required: true },
          { name: "last_name", label: "Last name" },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone", type: "tel" },
          {
            name: "gender",
            label: "Gender",
            type: "select",
            options: GENDERS.map((value) => ({ value, label: humanise(value) })),
          },
          { name: "date_of_birth", label: "Date of birth", type: "date" },
          { name: "admission_date", label: "Application date", type: "date" },
          {
            name: "department_id",
            label: "Department",
            type: "select",
            options: (lookups.data?.departments ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          },
          {
            name: "program_id",
            label: "Programme",
            type: "select",
            options: (lookups.data?.programs ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          },
          {
            name: "academic_year_id",
            label: "Academic year",
            type: "select",
            options: (lookups.data?.years ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          },
          { name: "guardian_name", label: "Guardian name" },
          { name: "guardian_phone", label: "Guardian phone", type: "tel" },
        ]}
        onSubmit={async (values) => {
          const programCode =
            lookups.data?.programs.find((p) => p.id === values.program_id)?.code ?? null;
          const numbers = await generateStudentNumbers(tenant!.id, { programCode });
          await createStudent.mutateAsync({
            ...values,
            admission_number: numbers.admission_number,
            status: "applicant",
            campus_id: campus?.id ?? null,
          });
        }}
      />
    </>
  );
}
