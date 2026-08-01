import { createFileRoute } from "@tanstack/react-router";

import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { useResourceList } from "@/hooks/useResource";

export const Route = createFileRoute("/_authenticated/programs")({
  head: () => ({
    meta: [
      { title: "Programmes — CampusOS" },
      {
        name: "description",
        content: "Degree programmes with level, duration, credits and intake capacity.",
      },
      { property: "og:title", content: "Programmes — CampusOS" },
      { property: "og:description", content: "Degree programmes offered by your college." },
    ],
  }),
  component: ProgramsPage,
});

interface ProgramRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  level: string;
  duration_years: number;
  total_semesters: number;
  total_credits: number | null;
  intake_capacity: number | null;
  is_active: boolean;
  department_id: string | null;
  description: string | null;
}

const levels = [
  "certificate",
  "diploma",
  "undergraduate",
  "postgraduate",
  "doctorate",
  "postdoctoral",
];

function ProgramsPage() {
  const departments = useResourceList<{ id: string; name: string }>({
    table: "departments",
    select: "id, name",
    orderBy: { column: "name" },
  });

  return (
    <ResourcePage<ProgramRow>
      title="Programmes"
      description="Degree and diploma programmes, their duration, credit load and intake capacity."
      crumbs={[{ label: "Academics" }, { label: "Programmes" }]}
      table="programs"
      select="id, name, code, level, duration_years, total_semesters, total_credits, intake_capacity, is_active, department_id, description"
      orderBy={{ column: "name" }}
      campusScoped
      managePermission="program.manage"
      entityLabel="programme"
      storageKey="programs"
      columns={[
        { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
        { key: "name", header: "Programme" },
        {
          key: "level",
          header: "Level",
          render: (row) => <span className="capitalize">{row.level?.replace(/_/g, " ") ?? "-"}</span>,
        },
        {
          key: "department_id",
          header: "Department",
          value: (row) => departments.data?.find((d) => d.id === row.department_id)?.name ?? null,
        },
        { key: "duration_years", header: "Years" },
        { key: "total_semesters", header: "Semesters" },
        { key: "total_credits", header: "Credits", defaultHidden: true },
        { key: "intake_capacity", header: "Intake" },
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
        { name: "name", label: "Programme name", required: true },
        { name: "code", label: "Code", required: true },
        {
          name: "level",
          label: "Level",
          type: "select",
          required: true,
          options: levels.map((value) => ({ value, label: value })),
        },
        {
          name: "department_id",
          label: "Department",
          type: "select",
          options: (departments.data ?? []).map((row) => ({ value: row.id, label: row.name })),
        },
        {
          name: "duration_years",
          label: "Duration (years)",
          type: "number",
          required: true,
          min: 1,
          max: 10,
        },
        {
          name: "total_semesters",
          label: "Total semesters",
          type: "number",
          required: true,
          min: 1,
          max: 20,
        },
        { name: "total_credits", label: "Total credits", type: "number", min: 0, max: 500 },
        { name: "intake_capacity", label: "Intake capacity", type: "number", min: 0, max: 5000 },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        name: row.name,
        code: row.code,
        level: row.level,
        department_id: row.department_id ?? "",
        duration_years: row.duration_years,
        total_semesters: row.total_semesters,
        total_credits: row.total_credits ?? "",
        intake_capacity: row.intake_capacity ?? "",
        description: row.description ?? "",
      })}
    />
  );
}
