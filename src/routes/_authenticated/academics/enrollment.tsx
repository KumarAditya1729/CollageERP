import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { labelize, useAcademicLookups } from "@/hooks/useAcademics";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/academics/enrollment")({
  head: () => ({
    meta: [
      { title: "Student enrolment — CampusOS" },
      {
        name: "description",
        content:
          "Enrol students into subjects, drop or withdraw, record repeats and backlogs, and move students between sections.",
      },
      { property: "og:title", content: "Student enrolment — CampusOS" },
      {
        property: "og:description",
        content: "Subject enrolment, drops, repeats and section changes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EnrollmentPage,
});

interface EnrollmentRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  course_id: string;
  semester_id: string | null;
  academic_session_id: string | null;
  section_id: string | null;
  faculty_id: string | null;
  status: string;
  grade: string | null;
  enrolled_at: string | null;
}

interface StudentRow extends Record<string, unknown> {
  id: string;
  first_name: string;
  last_name: string | null;
  roll_number: string | null;
  program_id: string | null;
  section_id: string | null;
  status: string;
}

const enrollmentStatuses = ["registered", "active", "completed", "withdrawn", "failed"];

function studentName(row: StudentRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ");
}

function EnrollmentPage() {
  const { can, tenant } = useAccess();
  const { user } = useAuth();
  const canManage = can("enrollment.manage");
  const queryClient = useQueryClient();
  const { courses, sections, semesters, academicSessions, programs } = useAcademicLookups();

  const students = useResourceList<StudentRow>({
    table: "students",
    select: "id, first_name, last_name, roll_number, program_id, section_id, status",
    orderBy: { column: "first_name" },
  });

  const enrollments = useResourceList<EnrollmentRow>({
    table: "enrollments",
    select:
      "id, student_id, course_id, semester_id, academic_session_id, section_id, faculty_id, status, grade, enrolled_at",
    orderBy: { column: "enrolled_at", ascending: false },
  });

  const [programId, setProgramId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const candidates = useMemo(() => {
    return (students.data ?? []).filter((student) => {
      if (programId && student.program_id !== programId) return false;
      if (sectionId && student.section_id !== sectionId) return false;
      return student.status === "enrolled" || student.status === "applicant";
    });
  }, [students.data, programId, sectionId]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["resource", "enrollments"] });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error("Choose a subject");
      if (picked.length === 0) throw new Error("Select at least one student");
      const existing = new Set(
        (enrollments.data ?? [])
          .filter((row) => row.course_id === courseId && row.semester_id === (semesterId || null))
          .map((row) => row.student_id),
      );
      const payload = picked
        .filter((id) => !existing.has(id))
        .map((studentId) => ({
          tenant_id: tenant?.id,
          student_id: studentId,
          course_id: courseId,
          semester_id: semesterId || null,
          academic_session_id: sessionId || null,
          section_id: sectionId || null,
          status: "registered",
          created_by: user?.id,
        }));
      if (payload.length === 0)
        throw new Error("Those students are already enrolled in this subject");
      const { error } = await supabase.from("enrollments" as never).insert(payload as never);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} students enrolled`);
      setPicked([]);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from("enrollments" as never)
        .update({ status, updated_by: user?.id } as never)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        `Marked ${variables.ids.length} enrolment(s) as ${labelize(variables.status).toLowerCase()}`,
      );
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const moveSection = useMutation({
    mutationFn: async ({ ids, section }: { ids: string[]; section: string }) => {
      const { error } = await supabase
        .from("enrollments" as never)
        .update({ section_id: section, updated_by: user?.id } as never)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Section updated");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

  return (
    <>
      <PageHeader
        title="Student enrolment"
        description="Register students into subjects for a term, and manage drops, withdrawals, repeats and section changes."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Enrolment" }]}
      />

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Bulk enrol</CardTitle>
            <CardDescription>
              Filter the cohort, pick the subject and term, then register every selected student in
              one write.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label>Programme</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All programmes" />
                  </SelectTrigger>
                  <SelectContent>
                    {(programs.data ?? []).map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    {(sections.data ?? []).map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={semesterId} onValueChange={setSemesterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {(semesters.data ?? []).map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Term</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    {(academicSessions.data ?? []).map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses.data ?? []).map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.code} — {row.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2">
              {students.isLoading ? (
                <p className="p-2 text-sm text-muted-foreground">Loading students…</p>
              ) : candidates.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  No students match this filter. Adjust the programme or section.
                </p>
              ) : (
                candidates.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={picked.includes(student.id)}
                      onCheckedChange={() => toggle(student.id)}
                      aria-label={`Select ${studentName(student)}`}
                    />
                    <span className="font-medium">{studentName(student)}</span>
                    <span className="text-muted-foreground">
                      {student.roll_number ?? "no roll number"}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={enroll.isPending || picked.length === 0}
                onClick={() => enroll.mutate()}
              >
                Enrol {picked.length || ""} students
              </Button>
              <Button variant="ghost" onClick={() => setPicked(candidates.map((row) => row.id))}>
                Select all shown
              </Button>
              <Button variant="ghost" onClick={() => setPicked([])}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DataTable<EnrollmentRow>
        columns={[
          {
            key: "student_id",
            header: "Student",
            alwaysVisible: true,
            className: "font-medium",
            value: (row) => {
              const student = students.data?.find((s) => s.id === row.student_id);
              return student ? studentName(student) : null;
            },
          },
          {
            key: "course_id",
            header: "Subject",
            value: (row) => {
              const course = courses.data?.find((c) => c.id === row.course_id);
              return course ? `${course.code} — ${course.title}` : null;
            },
          },
          {
            key: "section_id",
            header: "Section",
            value: (row) => sections.data?.find((s) => s.id === row.section_id)?.name ?? null,
          },
          {
            key: "semester_id",
            header: "Semester",
            value: (row) => semesters.data?.find((s) => s.id === row.semester_id)?.name ?? null,
          },
          {
            key: "academic_session_id",
            header: "Term",
            defaultHidden: true,
            value: (row) =>
              academicSessions.data?.find((s) => s.id === row.academic_session_id)?.name ?? null,
          },
          {
            key: "status",
            header: "Status",
            value: (row) => labelize(row.status),
            render: (row) => (
              <Badge
                variant={
                  row.status === "withdrawn" || row.status === "failed" ? "secondary" : "default"
                }
              >
                {labelize(row.status)}
              </Badge>
            ),
          },
          { key: "grade", header: "Grade" },
        ]}
        rows={enrollments.data}
        getRowId={(row) => row.id}
        loading={enrollments.isLoading}
        error={(enrollments.error as Error) ?? null}
        onRetry={() => void enrollments.refetch()}
        searchPlaceholder="Search enrolments…"
        storageKey="enrollments"
        exportName="enrollments"
        emptyTitle="No enrolments yet"
        emptyDescription="Use bulk enrol above to register students into subjects for the current term."
        bulkActions={
          canManage
            ? (ids, clear) => (
                <>
                  {enrollmentStatuses.map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatus.mutate({ ids, status });
                        clear();
                      }}
                    >
                      {labelize(status)}
                    </Button>
                  ))}
                  {sectionId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        moveSection.mutate({ ids, section: sectionId });
                        clear();
                      }}
                    >
                      Move to selected section
                    </Button>
                  ) : null}
                </>
              )
            : undefined
        }
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Enrolment actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {enrollmentStatuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  disabled={!canManage || row.status === status}
                  onClick={() => setStatus.mutate({ ids: [row.id], status })}
                >
                  Mark {labelize(status).toLowerCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
    </>
  );
}
