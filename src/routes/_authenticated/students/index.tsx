import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArchiveRestore,
  BadgeCheck,
  Download,
  GraduationCap,
  IdCard,
  PieChart,
  Plus,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { RecordFormDialog, type RecordValues } from "@/components/common/record-form-dialog";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { useStudentLookups, useStudentMutations, useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, formatDate } from "@/lib/export";
import {
  GENDERS,
  STUDENT_STATUSES,
  generateStudentNumbers,
  humanise,
  statusTone,
  studentName,
  type StudentRecord,
} from "@/lib/students";

export const Route = createFileRoute("/_authenticated/students/")({
  head: () => ({
    meta: [
      { title: "Student register — CampusOS" },
      {
        name: "description",
        content:
          "Search, filter, enrol and manage every student record with programme, department and admission details.",
      },
      { property: "og:title", content: "Student register — CampusOS" },
      { property: "og:description", content: "The complete student register for your college." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentRegisterPage,
});

const ALL = "__all";

function StudentRegisterPage() {
  const navigate = useNavigate();
  const { can, campus, tenant } = useAccess();
  const canManage = can("student.manage");
  const canExport = can("data.export");

  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [programId, setProgramId] = useState(ALL);
  const [gender, setGender] = useState(ALL);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<RecordValues>({});
  const [pendingArchive, setPendingArchive] = useState<string[] | null>(null);
  const [bulk, setBulk] = useState<{ ids: string[]; kind: "assign" | "status" } | null>(null);

  const lookups = useStudentLookups();
  const register = useStudentRegister({ includeArchived: archived });
  const { createStudent, updateStudent, archiveStudents, restoreStudents } = useStudentMutations();

  const departmentName = (id: string | null) =>
    lookups.data?.departments.find((row) => row.id === id)?.name ?? null;
  const programName = (id: string | null) =>
    lookups.data?.programs.find((row) => row.id === id)?.name ?? null;
  const semesterName = (id: string | null) =>
    lookups.data?.semesters.find((row) => row.id === id)?.name ?? null;

  const rows = useMemo(() => {
    const all = register.data ?? [];
    return all.filter((row) => {
      if (archived ? !row.deleted_at : Boolean(row.deleted_at)) return false;
      if (status !== ALL && row.status !== status) return false;
      if (departmentId !== ALL && row.department_id !== departmentId) return false;
      if (programId !== ALL && row.program_id !== programId) return false;
      if (gender !== ALL && row.gender !== gender) return false;
      return true;
    });
  }, [register.data, archived, status, departmentId, programId, gender]);

  const stats = useMemo(() => {
    const live = (register.data ?? []).filter((row) => !row.deleted_at);
    return {
      total: live.length,
      enrolled: live.filter((row) => row.status === "enrolled").length,
      applicants: live.filter((row) => row.status === "applicant").length,
      graduated: live.filter((row) => row.status === "graduated").length,
    };
  }, [register.data]);

  const openCreate = async () => {
    setCreateDefaults({});
    setCreateOpen(true);
    try {
      const numbers = await generateStudentNumbers(tenant!.id, {});

      setCreateDefaults({
        admission_number: numbers.admission_number,
        registration_number: numbers.registration_number,
        roll_number: numbers.roll_number,
        status: "applicant",
        admission_date: new Date().toISOString().slice(0, 10),
      });
    } catch {
      setCreateDefaults({ status: "applicant" });
    }
  };

  const exportRows = (ids?: string[]) => {
    const target = ids ? rows.filter((row) => ids.includes(row.id)) : rows;
    downloadCsv(
      "student-register",
      [
        "Admission number",
        "Registration number",
        "Roll number",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "Status",
        "Programme",
        "Department",
        "Semester",
        "Admitted on",
      ],
      target.map((row) => [
        row.admission_number,
        row.registration_number,
        row.roll_number,
        studentName(row),
        row.email,
        row.phone,
        row.gender,
        row.status,
        programName(row.program_id),
        departmentName(row.department_id),
        semesterName(row.current_semester_id),
        row.admission_date,
      ]),
    );
    toast.success(`${target.length} rows exported`);
  };

  const bulkPromote = async (ids: string[]) => {
    const semesters = lookups.data?.semesters ?? [];
    const targets = rows.filter((row) => ids.includes(row.id));
    let moved = 0;
    for (const row of targets) {
      const current = semesters.find((s) => s.id === row.current_semester_id);
      const programSemesters = semesters
        .filter((s) => s.program_id === row.program_id)
        .sort((a, b) => a.number - b.number);
      const next = current
        ? programSemesters.find((s) => s.number === current.number + 1)
        : programSemesters[0];
      if (!next) continue;
      await updateStudent.mutateAsync({ ids: [row.id], values: { current_semester_id: next.id } });
      moved += 1;
    }
    toast.success(
      moved ? `${moved} students promoted` : "No students had a next semester configured",
    );
  };

  return (
    <>
      <PageHeader
        title="Student register"
        description="Every student record in your college, with admission details, programme, section and current status."
        crumbs={[{ label: "People" }, { label: "Students" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/students/admissions">
                <BadgeCheck className="size-4" />
                Admissions
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/students/reports">
                <PieChart className="size-4" />
                Reports
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/students/id-cards">
                <IdCard className="size-4" />
                ID cards
              </Link>
            </Button>
            {can("data.import") ? (
              <Button variant="outline" asChild>
                <Link to="/students/import">
                  <Upload className="size-4" />
                  Import
                </Link>
              </Button>
            ) : null}
            {canManage ? (
              <Button onClick={() => void openCreate()}>
                <Plus className="size-4" />
                New student
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Students on roll"
          value={stats.total}
          icon={Users}
          loading={register.isLoading}
        />
        <StatCard
          label="Enrolled"
          value={stats.enrolled}
          icon={BadgeCheck}
          loading={register.isLoading}
        />
        <StatCard
          label="Applicants"
          value={stats.applicants}
          icon={Plus}
          loading={register.isLoading}
        />
        <StatCard
          label="Graduated"
          value={stats.graduated}
          icon={GraduationCap}
          loading={register.isLoading}
        />
      </div>

      <DataTable<StudentRecord>
        columns={[
          {
            key: "admission_number",
            header: "Admission no.",
            alwaysVisible: true,
            className: "font-medium",
          },
          { key: "name", header: "Name", value: (row) => studentName(row) },
          { key: "roll_number", header: "Roll no." },
          { key: "registration_number", header: "Registration no.", defaultHidden: true },
          { key: "program_id", header: "Programme", value: (row) => programName(row.program_id) },
          {
            key: "department_id",
            header: "Department",
            value: (row) => departmentName(row.department_id),
          },
          {
            key: "current_semester_id",
            header: "Semester",
            value: (row) => semesterName(row.current_semester_id),
            defaultHidden: true,
          },
          { key: "email", header: "Email", defaultHidden: true },
          { key: "phone", header: "Phone", defaultHidden: true },
          { key: "guardian_name", header: "Guardian", defaultHidden: true },
          {
            key: "gender",
            header: "Gender",
            value: (row) => humanise(row.gender),
            defaultHidden: true,
          },
          {
            key: "status",
            header: "Status",
            value: (row) => row.status,
            render: (row) => (
              <Badge variant={statusTone[row.status] ?? "secondary"} className="capitalize">
                {humanise(row.status)}
              </Badge>
            ),
          },
          {
            key: "admission_date",
            header: "Admitted",
            value: (row) => row.admission_date,
            render: (row) => formatDate(row.admission_date),
          },
        ]}
        rows={rows}
        getRowId={(row) => row.id}
        loading={register.isLoading || lookups.isLoading}
        error={(register.error as Error) ?? null}
        onRetry={() => void register.refetch()}
        onRowClick={(row) =>
          void navigate({ to: "/students/$studentId", params: { studentId: row.id } })
        }
        searchPlaceholder="Search by name, admission no., roll no., email, phone or guardian…"
        storageKey="students-register"
        exportName="student-register"
        emptyTitle={archived ? "No archived students" : "No students yet"}
        emptyDescription={
          canManage
            ? "Create the first student record or import your existing register."
            : "Nothing has been added yet."
        }
        emptyAction={
          canManage ? (
            <Button onClick={() => void openCreate()}>
              <Plus className="size-4" />
              New student
            </Button>
          ) : undefined
        }
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STUDENT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {humanise(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All departments</SelectItem>
                {(lookups.data?.departments ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All programmes</SelectItem>
                {(lookups.data?.programs ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All genders</SelectItem>
                {GENDERS.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {humanise(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={archived ? "default" : "outline"}
              size="sm"
              onClick={() => setArchived((v) => !v)}
            >
              <ArchiveRestore className="size-4" />
              {archived ? "Viewing archive" : "Archive"}
            </Button>
          </div>
        }
        toolbar={
          canExport ? (
            <Button variant="outline" size="sm" onClick={() => exportRows()}>
              <Download className="size-4" />
              Export view
            </Button>
          ) : null
        }
        bulkActions={(ids, clear) => (
          <div className="flex flex-wrap items-center gap-2">
            {canExport ? (
              <Button variant="outline" size="sm" onClick={() => exportRows(ids)}>
                <Download className="size-4" />
                Export
              </Button>
            ) : null}
            {canManage ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Academic</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setBulk({ ids, kind: "assign" })}>
                    Assign programme, department or semester
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void bulkPromote(ids)}>
                    Promote to next semester
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Lifecycle</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setBulk({ ids, kind: "status" })}>
                    Change status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      void updateStudent.mutateAsync({
                        ids,
                        values: {
                          status: "graduated",
                          graduation_date: new Date().toISOString().slice(0, 10),
                        },
                      })
                    }
                  >
                    Graduate
                  </DropdownMenuItem>
                  {archived ? (
                    <DropdownMenuItem
                      onClick={() => {
                        void restoreStudents.mutateAsync(ids);
                        clear();
                      }}
                    >
                      Restore
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setPendingArchive(ids);
                        clear();
                      }}
                    >
                      <Trash2 className="size-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        )}
        rowActions={(row) => (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/students/$studentId" params={{ studentId: row.id }}>
              Open
            </Link>
          </Button>
        )}
      />

      <RecordFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New student"
        description="Admission, registration and roll numbers are generated from your live register and can be edited."
        submitLabel="Create student"
        initialValues={createDefaults}
        fields={[
          { name: "admission_number", label: "Admission number", required: true },
          { name: "registration_number", label: "Registration number" },
          { name: "roll_number", label: "Roll number" },
          { name: "first_name", label: "First name", required: true },
          { name: "middle_name", label: "Middle name" },
          { name: "last_name", label: "Last name" },
          { name: "email", label: "Email", type: "email" },
          { name: "phone", label: "Phone", type: "tel" },
          {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: STUDENT_STATUSES.map((value) => ({ value, label: humanise(value) })),
          },
          {
            name: "gender",
            label: "Gender",
            type: "select",
            options: GENDERS.map((value) => ({ value, label: humanise(value) })),
          },
          { name: "date_of_birth", label: "Date of birth", type: "date" },
          { name: "admission_date", label: "Admission date", type: "date" },
          {
            name: "department_id",
            label: "Department",
            type: "select",
            options: (lookups.data?.departments ?? []).map((row) => ({
              value: row.id,
              label: row.name,
            })),
          },
          {
            name: "program_id",
            label: "Programme",
            type: "select",
            options: (lookups.data?.programs ?? []).map((row) => ({
              value: row.id,
              label: row.name,
            })),
          },
          {
            name: "academic_year_id",
            label: "Academic year",
            type: "select",
            options: (lookups.data?.years ?? []).map((row) => ({ value: row.id, label: row.name })),
          },
          { name: "guardian_name", label: "Guardian name" },
          { name: "guardian_phone", label: "Guardian phone", type: "tel" },
        ]}
        onSubmit={async (values) => {
          const id = await createStudent.mutateAsync({ ...values, campus_id: campus?.id ?? null });
          void navigate({ to: "/students/$studentId", params: { studentId: id } });
        }}
      />

      <RecordFormDialog
        open={bulk?.kind === "assign"}
        onOpenChange={(open) => !open && setBulk(null)}
        title={`Bulk assign ${bulk?.ids.length ?? 0} students`}
        description="Leave a field blank to keep the current value."
        submitLabel="Apply changes"
        fields={[
          {
            name: "department_id",
            label: "Department",
            type: "select",
            options: (lookups.data?.departments ?? []).map((row) => ({
              value: row.id,
              label: row.name,
            })),
          },
          {
            name: "program_id",
            label: "Programme",
            type: "select",
            options: (lookups.data?.programs ?? []).map((row) => ({
              value: row.id,
              label: row.name,
            })),
          },
          {
            name: "current_semester_id",
            label: "Semester",
            type: "select",
            options: (lookups.data?.semesters ?? []).map((row) => ({
              value: row.id,
              label: row.name,
            })),
          },
          {
            name: "academic_year_id",
            label: "Academic year",
            type: "select",
            options: (lookups.data?.years ?? []).map((row) => ({ value: row.id, label: row.name })),
          },
        ]}
        onSubmit={async (values) => {
          const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value));
          if (!Object.keys(payload).length || !bulk) return;
          await updateStudent.mutateAsync({ ids: bulk.ids, values: payload });
          setBulk(null);
        }}
      />

      <RecordFormDialog
        open={bulk?.kind === "status"}
        onOpenChange={(open) => !open && setBulk(null)}
        title={`Change status for ${bulk?.ids.length ?? 0} students`}
        description="Status changes are written to the audit trail and the student timeline."
        submitLabel="Update status"
        fields={[
          {
            name: "status",
            label: "New status",
            type: "select",
            required: true,
            options: STUDENT_STATUSES.map((value) => ({ value, label: humanise(value) })),
          },
        ]}
        onSubmit={async (values) => {
          if (!bulk) return;
          await updateStudent.mutateAsync({ ids: bulk.ids, values: { status: values.status } });
          setBulk(null);
        }}
      />

      <ConfirmDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title={`Archive ${pendingArchive?.length ?? 0} student record${(pendingArchive?.length ?? 0) > 1 ? "s" : ""}?`}
        description="Records are soft deleted, remain in the audit trail and can be restored from the archive view."
        confirmLabel="Archive"
        destructive
        onConfirm={async () => {
          if (pendingArchive) await archiveStudents.mutateAsync(pendingArchive);
          setPendingArchive(null);
        }}
      />
    </>
  );
}
