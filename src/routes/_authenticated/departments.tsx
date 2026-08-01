import { createFileRoute } from "@tanstack/react-router";

import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({
    meta: [
      { title: "Departments — CampusOS" },
      { name: "description", content: "Academic departments, codes, contact details and status." },
      { property: "og:title", content: "Departments — CampusOS" },
      { property: "og:description", content: "Academic departments across your campuses." },
    ],
  }),
  component: DepartmentsPage,
});

interface DepartmentRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  email: string | null;
  phone: string | null;
  established_year: number | null;
  is_active: boolean;
  description: string | null;
}

function DepartmentsPage() {
  return (
    <ResourcePage<DepartmentRow>
      title="Departments"
      description="Academic and administrative departments that organise programmes, courses and people."
      crumbs={[{ label: "Academics" }, { label: "Departments" }]}
      table="departments"
      select="id, name, code, short_name, email, phone, established_year, is_active, description"
      orderBy={{ column: "name" }}
      campusScoped
      managePermission="department.manage"
      entityLabel="department"
      storageKey="departments"
      columns={[
        { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
        { key: "name", header: "Department" },
        { key: "short_name", header: "Short name", defaultHidden: true },
        { key: "email", header: "Email" },
        { key: "phone", header: "Phone", defaultHidden: true },
        { key: "established_year", header: "Established" },
        {
          key: "is_active",
          header: "Status",
          value: (row) => (row.is_active ? "Active" : "Inactive"),
          render: (row) => (
            <Badge variant={row.is_active ? "default" : "secondary"}>
              {row.is_active ? "Active" : "Inactive"}
            </Badge>
          ),
        },
      ]}
      fields={[
        { name: "name", label: "Department name", required: true },
        { name: "code", label: "Code", required: true },
        { name: "short_name", label: "Short name" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        {
          name: "established_year",
          label: "Established year",
          type: "number",
          min: 1800,
          max: 2100,
        },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        name: row.name,
        code: row.code,
        short_name: row.short_name ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        established_year: row.established_year ?? "",
        description: row.description ?? "",
      })}
    />
  );
}
