import { createFileRoute } from "@tanstack/react-router";

import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { useResourceList } from "@/hooks/useResource";
import { formatDate } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty — CampusOS" },
      {
        name: "description",
        content: "Manage teaching staff, designations, departments and employment records.",
      },
      { property: "og:title", content: "Faculty — CampusOS" },
      { property: "og:description", content: "Teaching staff directory and employment records." },
    ],
  }),
  component: FacultyPage,
});

interface FacultyRow extends Record<string, unknown> {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  specialization: string | null;
  employment_status: string;
  employment_type: string;
  date_of_joining: string | null;
  department_id: string | null;
}

const employmentStatuses = ["active", "probation", "on_leave", "resigned", "terminated", "retired"];
const employmentTypes = ["full_time", "part_time", "contract", "visiting", "guest", "intern"];

function FacultyPage() {
  const departments = useResourceList<{ id: string; name: string }>({
    table: "departments",
    select: "id, name",
    orderBy: { column: "name" },
  });

  const departmentName = (id: string | null) =>
    departments.data?.find((row) => row.id === id)?.name ?? null;

  return (
    <ResourcePage<FacultyRow>
      title="Faculty"
      description="Teaching staff across departments, with designation, qualification and employment status."
      crumbs={[{ label: "People" }, { label: "Faculty" }]}
      table="faculty"
      select="id, employee_code, first_name, last_name, designation, email, phone, qualification, specialization, employment_status, employment_type, date_of_joining, department_id"
      orderBy={{ column: "employee_code" }}
      campusScoped
      managePermission="faculty.manage"
      entityLabel="faculty member"
      storageKey="faculty"
      columns={[
        {
          key: "employee_code",
          header: "Employee code",
          alwaysVisible: true,
          className: "font-medium",
        },
        {
          key: "name",
          header: "Name",
          value: (row) => [row.first_name, row.last_name].filter(Boolean).join(" "),
        },
        { key: "designation", header: "Designation" },
        {
          key: "department_id",
          header: "Department",
          value: (row) => departmentName(row.department_id),
        },
        { key: "qualification", header: "Qualification", defaultHidden: true },
        { key: "specialization", header: "Specialisation", defaultHidden: true },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone", defaultHidden: true },
        {
          key: "employment_status",
          header: "Status",
          render: (row) => (
            <Badge
              variant={row.employment_status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {row.employment_status?.replace(/_/g, " ") ?? "-"}
            </Badge>
          ),
        },
        {
          key: "date_of_joining",
          header: "Joined",
          value: (row) => row.date_of_joining,
          render: (row) => formatDate(row.date_of_joining),
        },
      ]}
      fields={[
        { name: "employee_code", label: "Employee code", required: true },
        { name: "first_name", label: "First name", required: true },
        { name: "last_name", label: "Last name" },
        { name: "designation", label: "Designation" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "qualification", label: "Qualification" },
        { name: "specialization", label: "Specialisation" },
        {
          name: "department_id",
          label: "Department",
          type: "select",
          options: (departments.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        {
          name: "employment_status",
          label: "Employment status",
          type: "select",
          required: true,
          options: employmentStatuses.map((value) => ({ value, label: value.replace(/_/g, " ") })),
        },
        {
          name: "employment_type",
          label: "Employment type",
          type: "select",
          required: true,
          options: employmentTypes.map((value) => ({ value, label: value.replace(/_/g, " ") })),
        },
        { name: "date_of_joining", label: "Date of joining", type: "date" },
        { name: "experience_years", label: "Experience (years)", type: "number", min: 0, max: 60 },
      ]}
      toFormValues={(row) => ({
        employee_code: row.employee_code,
        first_name: row.first_name,
        last_name: row.last_name ?? "",
        designation: row.designation ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        qualification: row.qualification ?? "",
        specialization: row.specialization ?? "",
        department_id: row.department_id ?? "",
        employment_status: row.employment_status,
        employment_type: row.employment_type,
        date_of_joining: row.date_of_joining ?? "",
      })}
    />
  );
}
