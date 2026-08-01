import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArchiveRestore,
  ArrowLeft,
  GraduationCap,
  IdCard,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CustomFieldsPanel } from "@/components/common/custom-fields-panel";
import { EntityComments } from "@/components/common/entity-comments";
import { EntityDocuments } from "@/components/common/entity-documents";
import { EntityTags } from "@/components/common/entity-tags";
import { EntityTimeline } from "@/components/common/entity-timeline";
import { PageHeader } from "@/components/common/page-header";
import { RecordFormDialog, type RecordValues } from "@/components/common/record-form-dialog";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { StudentIdCard } from "@/components/students/student-id-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import {
  useStudent,
  useStudentGuardians,
  useStudentLookups,
  useStudentMutations,
} from "@/hooks/useStudents";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/export";
import {
  GENDERS,
  STUDENT_STATUSES,
  addressToText,
  generateStudentNumbers,
  humanise,
  initials,
  profileCompletion,
  statusTone,
  studentName,
} from "@/lib/students";

export const Route = createFileRoute("/_authenticated/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — CampusOS" },
      {
        name: "description",
        content:
          "Complete student profile: personal details, academic standing, guardians, documents, timeline and notes.",
      },
      { property: "og:title", content: "Student profile — CampusOS" },
      { property: "og:description", content: "A complete student record in CampusOS." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentDetailPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Could not load student" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Student not found" />,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function StudentDetailPage() {
  const { studentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenant, campus, campuses, can } = useAccess();
  const { user } = useAuth();
  const canManage = can("student.manage");

  const student = useStudent(studentId);
  const lookups = useStudentLookups();
  const guardians = useStudentGuardians(studentId);
  const { updateStudent, archiveStudents, restoreStudents } = useStudentMutations();

  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [guardianEditing, setGuardianEditing] = useState<RecordValues | null>(null);
  const [guardianEditId, setGuardianEditId] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const documentsCount = useQuery({
    queryKey: ["student-documents-count", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("entity_type", "students")
        .eq("entity_id", studentId)
        .eq("status", "verified")
        .is("deleted_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const enrollments = useQuery({
    queryKey: ["student-enrollments", studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, status, grade, grade_points, courses(code, title, credits)")
        .eq("student_id", studentId)
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        status: string;
        grade: string | null;
        grade_points: number | null;
        courses: { code: string; title: string; credits: number | null } | null;
      }[];
    },
  });

  const saveGuardian = useMutation({
    mutationFn: async (values: RecordValues) => {
      const payload = {
        tenant_id: tenant!.id,
        student_id: studentId,
        full_name: String(values.full_name ?? ""),
        relation: String(values.relation ?? "guardian"),
        email: values.email ? String(values.email) : null,
        phone: values.phone ? String(values.phone) : null,
        occupation: values.occupation ? String(values.occupation) : null,
        annual_income: values.annual_income ? Number(values.annual_income) : null,
        is_primary: String(values.is_primary ?? "no") === "yes",
        updated_by: user?.id ?? null,
      };
      if (guardianEditId) {
        const { error } = await supabase
          .from("student_guardians")
          .update(payload as never)
          .eq("id", guardianEditId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("student_guardians")
          .insert({ ...payload, created_by: user?.id ?? null } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Guardian saved");
      setGuardianOpen(false);
      setGuardianEditId(null);
      setGuardianEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["student-guardians", studentId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeGuardian = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_guardians")
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Guardian removed");
      void queryClient.invalidateQueries({ queryKey: ["student-guardians", studentId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (student.isLoading) return <InlineLoader label="Loading student" />;
  if (student.error) {
    return (
      <ErrorState
        title="Could not load student"
        description={(student.error as Error).message}
        onRetry={() => void student.refetch()}
      />
    );
  }
  if (!student.data) {
    return (
      <ErrorState
        title="Student not found"
        description="This record may have been archived or belongs to another campus."
      />
    );
  }

  const row = student.data;
  const completion = profileCompletion(row, {
    guardians: guardians.data?.length ?? 0,
    documents: documentsCount.data ?? 0,
  });

  const programName = lookups.data?.programs.find((p) => p.id === row.program_id)?.name ?? null;
  const programCode = lookups.data?.programs.find((p) => p.id === row.program_id)?.code ?? null;
  const departmentName =
    lookups.data?.departments.find((d) => d.id === row.department_id)?.name ?? null;
  const semesterName =
    lookups.data?.semesters.find((s) => s.id === row.current_semester_id)?.name ?? null;
  const yearName = lookups.data?.years.find((y) => y.id === row.academic_year_id)?.name ?? null;
  const campusName = campuses.find((c) => c.id === row.campus_id)?.name ?? campus?.name ?? null;
  const masterLabel = (list: { id: string; label: string }[] | undefined, id: string | null) =>
    list?.find((item) => item.id === id)?.label ?? null;

  const credits = (enrollments.data ?? []).reduce(
    (total, item) => total + (item.courses?.credits ?? 0),
    0,
  );
  const gradePoints = (enrollments.data ?? []).filter((item) => item.grade_points !== null);
  const cgpa = gradePoints.length
    ? (
        gradePoints.reduce((total, item) => total + Number(item.grade_points), 0) /
        gradePoints.length
      ).toFixed(2)
    : null;

  const generateNumbers = async () => {
    const numbers = await generateStudentNumbers(tenant!.id, { programCode });
    await updateStudent.mutateAsync({
      ids: [row.id],
      values: {
        admission_number: row.admission_number || numbers.admission_number,
        registration_number: row.registration_number ?? numbers.registration_number,
        roll_number: row.roll_number ?? numbers.roll_number,
      },
    });
  };

  return (
    <>
      <PageHeader
        title={studentName(row)}
        description={`${row.admission_number}${row.roll_number ? ` · Roll ${row.roll_number}` : ""}${programName ? ` · ${programName}` : ""}`}
        crumbs={[
          { label: "People" },
          { label: "Students", to: "/students" },
          { label: studentName(row) },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/students">
                <ArrowLeft className="size-4" />
                Register
              </Link>
            </Button>
            {canManage ? (
              <>
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Student actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Lifecycle</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() =>
                        void updateStudent.mutateAsync({
                          ids: [row.id],
                          values: { status: "enrolled" },
                        })
                      }
                    >
                      <UserCheck className="size-4" />
                      Mark enrolled
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTransferOpen(true)}>
                      Transfer
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        void updateStudent.mutateAsync({
                          ids: [row.id],
                          values: {
                            status: "graduated",
                            graduation_date: new Date().toISOString().slice(0, 10),
                          },
                        })
                      }
                    >
                      <GraduationCap className="size-4" />
                      Graduate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        void updateStudent.mutateAsync({
                          ids: [row.id],
                          values: { status: "suspended" },
                        })
                      }
                    >
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        void updateStudent.mutateAsync({
                          ids: [row.id],
                          values: { status: "dropped" },
                        })
                      }
                    >
                      Record dropout
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void generateNumbers()}>
                      Generate missing numbers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {row.deleted_at ? (
                      <DropdownMenuItem onClick={() => void restoreStudents.mutateAsync([row.id])}>
                        <ArchiveRestore className="size-4" />
                        Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirmArchive(true)}
                      >
                        <Trash2 className="size-4" />
                        Archive
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card className="shadow-none">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <Avatar className="size-14">
                  <AvatarImage src={row.photo_url ?? undefined} alt={studentName(row)} />
                  <AvatarFallback>{initials(row)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{studentName(row)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant={statusTone[row.status] ?? "secondary"} className="capitalize">
                      {humanise(row.status)}
                    </Badge>
                    {row.deleted_at ? <Badge variant="destructive">Archived</Badge> : null}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Profile completion</span>
                  <span className="font-medium tabular-nums">{completion.percent}%</span>
                </div>
                <Progress value={completion.percent} />
                {completion.missing.length ? (
                  <p className="text-xs text-muted-foreground">
                    Missing: {completion.missing.slice(0, 4).join(", ")}
                    {completion.missing.length > 4 ? ` +${completion.missing.length - 4} more` : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">All key fields captured.</p>
                )}
              </div>

              <div className="grid gap-3 border-t pt-4">
                <Field label="Email" value={row.email ?? "—"} />
                <Field label="Phone" value={row.phone ?? "—"} />
                <Field label="Campus" value={campusName ?? "—"} />
                <Field label="Academic year" value={yearName ?? "—"} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
              <CardDescription>Group students for reporting and outreach.</CardDescription>
            </CardHeader>
            <CardContent>
              <EntityTags entityType="students" entityId={row.id} canManage={canManage} />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="guardians">Guardians</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="custom">Custom fields</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="id">ID card</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Personal details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Field label="Full name" value={studentName(row)} />
                <Field label="Gender" value={humanise(row.gender)} />
                <Field label="Date of birth" value={formatDate(row.date_of_birth)} />
                <Field
                  label="Blood group"
                  value={masterLabel(lookups.data?.bloodGroups, row.blood_group_id)}
                />
                <Field
                  label="Category"
                  value={masterLabel(lookups.data?.categories, row.category_id)}
                />
                <Field label="Caste" value={masterLabel(lookups.data?.castes, row.caste_id)} />
                <Field
                  label="Religion"
                  value={masterLabel(lookups.data?.religions, row.religion_id)}
                />
                <Field
                  label="Nationality"
                  value={masterLabel(lookups.data?.nationalities, row.nationality_id)}
                />
                <Field label="ABC ID" value={row.abc_id ?? "—"} />
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Contact & address</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" value={row.email ?? "—"} />
                <Field label="Phone" value={row.phone ?? "—"} />
                <Field label="Emergency contact" value={row.emergency_contact ?? "—"} />
                <Field label="Address" value={addressToText(row.address)} />
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Family summary</CardTitle>
                <CardDescription>
                  Detailed guardian records live in the Guardians tab.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Field label="Father" value={row.father_name ?? "—"} />
                <Field label="Mother" value={row.mother_name ?? "—"} />
                <Field label="Guardian" value={row.guardian_name ?? "—"} />
                <Field label="Guardian phone" value={row.guardian_phone ?? "—"} />
                <Field label="Guardian email" value={row.guardian_email ?? "—"} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="mt-4 space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Academic profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Field label="Department" value={departmentName ?? "—"} />
                <Field label="Programme" value={programName ?? "—"} />
                <Field label="Semester" value={semesterName ?? "—"} />
                <Field label="Academic year" value={yearName ?? "—"} />
                <Field label="Admission number" value={row.admission_number} />
                <Field label="Registration number" value={row.registration_number ?? "—"} />
                <Field label="Roll number" value={row.roll_number ?? "—"} />
                <Field label="Admitted on" value={formatDate(row.admission_date)} />
                <Field label="Graduated on" value={formatDate(row.graduation_date)} />
                <Field label="Credits registered" value={credits || "—"} />
                <Field label="CGPA" value={cgpa ?? "Awaiting results"} />
                <Field
                  label="Academic standing"
                  value={
                    row.status === "enrolled"
                      ? cgpa && Number(cgpa) < 5
                        ? "Needs support"
                        : "Good standing"
                      : humanise(row.status)
                  }
                />
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Registered courses</CardTitle>
                <CardDescription>Live enrolments from the academic records.</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollments.isLoading ? <InlineLoader /> : null}
                {!enrollments.isLoading && !(enrollments.data ?? []).length ? (
                  <p className="text-sm text-muted-foreground">No course registrations yet.</p>
                ) : null}
                <ul className="space-y-2">
                  {(enrollments.data ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <span>
                        <span className="font-medium">{item.courses?.code}</span> ·{" "}
                        {item.courses?.title}
                      </span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {item.courses?.credits ? `${item.courses.credits} credits` : null}
                        <Badge variant="outline" className="capitalize">
                          {humanise(item.status)}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guardians" className="mt-4">
            <Card className="shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm">Guardians</CardTitle>
                  <CardDescription>Parents, guardians and emergency contacts.</CardDescription>
                </div>
                {canManage ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setGuardianEditId(null);
                      setGuardianEditing(null);
                      setGuardianOpen(true);
                    }}
                  >
                    Add guardian
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {guardians.isLoading ? <InlineLoader /> : null}
                {!guardians.isLoading && !(guardians.data ?? []).length ? (
                  <p className="text-sm text-muted-foreground">No guardian records yet.</p>
                ) : null}
                {(guardians.data ?? []).map((guardian) => (
                  <div
                    key={guardian.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{guardian.full_name}</p>
                        <Badge variant="outline" className="capitalize">
                          {humanise(guardian.relation)}
                        </Badge>
                        {guardian.is_primary ? <Badge>Primary</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[guardian.phone, guardian.email, guardian.occupation]
                          .filter(Boolean)
                          .join(" · ") || "No contact details"}
                        {guardian.annual_income
                          ? ` · annual income ${Number(guardian.annual_income).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    {canManage ? (
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGuardianEditId(guardian.id);
                            setGuardianEditing({
                              full_name: guardian.full_name,
                              relation: guardian.relation,
                              email: guardian.email ?? "",
                              phone: guardian.phone ?? "",
                              occupation: guardian.occupation ?? "",
                              annual_income: guardian.annual_income ?? "",
                              is_primary: guardian.is_primary ? "yes" : "no",
                            });
                            setGuardianOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeGuardian.mutate(guardian.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Student documents</CardTitle>
                <CardDescription>
                  Verification status, expiry tracking and version history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EntityDocuments
                  entityType="students"
                  entityId={row.id}
                  canManage={canManage}
                  canVerify={can("document.manage")}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Custom fields</CardTitle>
                <CardDescription>
                  Institution-specific data captured for every student.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomFieldsPanel entityType="students" entityId={row.id} canManage={canManage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Timeline</CardTitle>
                <CardDescription>Audit trail and activity feed for this student.</CardDescription>
              </CardHeader>
              <CardContent>
                <EntityTimeline entityType="students" entityId={row.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion" className="mt-4">
            <Card className="shadow-none">
              <CardContent className="pt-6">
                <EntityComments entityType="students" entityId={row.id} canManage={canManage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="id" className="mt-4">
            <Card className="shadow-none">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm">Digital identity card</CardTitle>
                  <CardDescription>
                    QR verification payload and Code128 admission barcode.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <IdCard className="size-4" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/students/id-cards">Batch print</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <StudentIdCard
                  student={row}
                  context={{
                    collegeName: tenant?.name ?? "CampusOS",
                    collegeLogo: tenant?.logo_url,
                    campusName,
                    programName,
                    departmentName,
                    validUntil: row.graduation_date,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RecordFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit student"
        description="Changes are audited and appear on the student timeline."
        submitLabel="Save changes"
        initialValues={{
          admission_number: row.admission_number,
          registration_number: row.registration_number ?? "",
          roll_number: row.roll_number ?? "",
          abc_id: row.abc_id ?? "",
          first_name: row.first_name,
          middle_name: row.middle_name ?? "",
          last_name: row.last_name ?? "",
          email: row.email ?? "",
          phone: row.phone ?? "",
          gender: row.gender ?? "",
          date_of_birth: row.date_of_birth ?? "",
          status: row.status,
          admission_date: row.admission_date ?? "",
          graduation_date: row.graduation_date ?? "",
          department_id: row.department_id ?? "",
          program_id: row.program_id ?? "",
          current_semester_id: row.current_semester_id ?? "",
          academic_year_id: row.academic_year_id ?? "",
          blood_group_id: row.blood_group_id ?? "",
          category_id: row.category_id ?? "",
          religion_id: row.religion_id ?? "",
          caste_id: row.caste_id ?? "",
          nationality_id: row.nationality_id ?? "",
          father_name: row.father_name ?? "",
          mother_name: row.mother_name ?? "",
          guardian_name: row.guardian_name ?? "",
          guardian_phone: row.guardian_phone ?? "",
          guardian_email: row.guardian_email ?? "",
          emergency_contact: row.emergency_contact ?? "",
          photo_url: row.photo_url ?? "",
          address_line1: String((row.address as Record<string, unknown> | null)?.line1 ?? ""),
          address_city: String((row.address as Record<string, unknown> | null)?.city ?? ""),
          address_state: String((row.address as Record<string, unknown> | null)?.state ?? ""),
          address_postal_code: String(
            (row.address as Record<string, unknown> | null)?.postal_code ?? "",
          ),
          address_country: String((row.address as Record<string, unknown> | null)?.country ?? ""),
        }}
        fields={[
          { name: "admission_number", label: "Admission number", required: true },
          { name: "registration_number", label: "Registration number" },
          { name: "roll_number", label: "Roll number" },
          { name: "abc_id", label: "ABC ID" },
          { name: "first_name", label: "First name", required: true },
          { name: "middle_name", label: "Middle name" },
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
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: STUDENT_STATUSES.map((value) => ({ value, label: humanise(value) })),
          },
          { name: "admission_date", label: "Admission date", type: "date" },
          { name: "graduation_date", label: "Graduation date", type: "date" },
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
            name: "current_semester_id",
            label: "Semester",
            type: "select",
            options: (lookups.data?.semesters ?? []).map((item) => ({
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
          {
            name: "blood_group_id",
            label: "Blood group",
            type: "select",
            options: (lookups.data?.bloodGroups ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            })),
          },
          {
            name: "category_id",
            label: "Category",
            type: "select",
            options: (lookups.data?.categories ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            })),
          },
          {
            name: "religion_id",
            label: "Religion",
            type: "select",
            options: (lookups.data?.religions ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            })),
          },
          {
            name: "caste_id",
            label: "Caste",
            type: "select",
            options: (lookups.data?.castes ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            })),
          },
          {
            name: "nationality_id",
            label: "Nationality",
            type: "select",
            options: (lookups.data?.nationalities ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            })),
          },
          { name: "father_name", label: "Father's name" },
          { name: "mother_name", label: "Mother's name" },
          { name: "guardian_name", label: "Guardian name" },
          { name: "guardian_phone", label: "Guardian phone", type: "tel" },
          { name: "guardian_email", label: "Guardian email", type: "email" },
          { name: "emergency_contact", label: "Emergency contact" },
          { name: "photo_url", label: "Photograph URL", full: true },
          { name: "address_line1", label: "Address line", full: true },
          { name: "address_city", label: "City" },
          { name: "address_state", label: "State" },
          { name: "address_postal_code", label: "Postal code" },
          { name: "address_country", label: "Country" },
        ]}
        onSubmit={async (values) => {
          const {
            address_line1,
            address_city,
            address_state,
            address_postal_code,
            address_country,
            ...rest
          } = values;
          await updateStudent.mutateAsync({
            ids: [row.id],
            values: {
              ...rest,
              address: {
                line1: address_line1 ?? null,
                city: address_city ?? null,
                state: address_state ?? null,
                postal_code: address_postal_code ?? null,
                country: address_country ?? null,
              },
            },
          });
        }}
      />

      <RecordFormDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        title="Transfer student"
        description="Move the student to another campus, department or programme. The change is audited."
        submitLabel="Transfer"
        initialValues={{
          campus_id: row.campus_id ?? "",
          department_id: row.department_id ?? "",
          program_id: row.program_id ?? "",
        }}
        fields={[
          {
            name: "campus_id",
            label: "Campus",
            type: "select",
            options: campuses.map((item) => ({ value: item.id, label: item.name })),
          },
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
            name: "current_semester_id",
            label: "Semester",
            type: "select",
            options: (lookups.data?.semesters ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          },
        ]}
        onSubmit={async (values) => {
          const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value));
          await updateStudent.mutateAsync({
            ids: [row.id],
            values: { ...payload, status: "transferred" },
          });
          setTransferOpen(false);
        }}
      />

      <RecordFormDialog
        open={guardianOpen}
        onOpenChange={(open) => {
          setGuardianOpen(open);
          if (!open) {
            setGuardianEditId(null);
            setGuardianEditing(null);
          }
        }}
        title={guardianEditId ? "Edit guardian" : "Add guardian"}
        description="Guardians can be linked to a portal account later for parent access."
        submitLabel={guardianEditId ? "Save guardian" : "Add guardian"}
        initialValues={guardianEditing ?? { relation: "guardian", is_primary: "no" }}
        fields={[
          { name: "full_name", label: "Full name", required: true },
          {
            name: "relation",
            label: "Relationship",
            type: "select",
            required: true,
            options: ["father", "mother", "guardian", "sibling", "other"].map((value) => ({
              value,
              label: humanise(value),
            })),
          },
          { name: "phone", label: "Phone", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "occupation", label: "Occupation" },
          { name: "annual_income", label: "Annual income", type: "number", min: 0 },
          {
            name: "is_primary",
            label: "Primary contact",
            type: "select",
            required: true,
            options: [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ],
          },
        ]}
        onSubmit={async (values) => {
          await saveGuardian.mutateAsync(values);
        }}
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive this student?"
        description="The record is soft deleted, stays in the audit trail and can be restored from the archive view."
        confirmLabel="Archive"
        destructive
        onConfirm={async () => {
          await archiveStudents.mutateAsync([row.id]);
          setConfirmArchive(false);
          void navigate({ to: "/students" });
        }}
      />
    </>
  );
}
