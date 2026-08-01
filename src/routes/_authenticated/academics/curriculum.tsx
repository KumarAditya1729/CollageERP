import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { CurriculumSheet, type CurriculumRow } from "@/components/academics/curriculum-sheet";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import {
  curriculumStatuses,
  labelize,
  optionsFrom,
  useAcademicLookups,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum management — CampusOS" },
      {
        name: "description",
        content:
          "Curriculum versions with effective dates, CBCS and NEP credit structure, subject mapping and approval workflow.",
      },
      { property: "og:title", content: "Curriculum management — CampusOS" },
      { property: "og:description", content: "Versioned curricula with approval workflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CurriculumPage,
});

function CurriculumPage() {
  const { programs } = useAcademicLookups();
  const [selected, setSelected] = useState<CurriculumRow | null>(null);

  return (
    <>
      <ResourcePage<CurriculumRow>
        title="Curriculum"
        description="Versioned curricula per programme — open a version to map subjects, credits and run the approval workflow."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Curriculum" }]}
        table="curricula"
        select="id, tenant_id, name, version, program_id, regulation, status, effective_from, effective_to, total_credits, notes"
        orderBy={{ column: "name" }}
        managePermission="curriculum.manage"
        entityLabel="curriculum version"
        storageKey="curricula"
        onRowClick={(row) => setSelected(row)}
        columns={[
          { key: "name", header: "Curriculum", alwaysVisible: true, className: "font-medium" },
          { key: "version", header: "Version" },
          {
            key: "program_id",
            header: "Programme",
            value: (row) => programs.data?.find((p) => p.id === row.program_id)?.name ?? null,
          },
          { key: "regulation", header: "Regulation" },
          {
            key: "status",
            header: "Status",
            value: (row) => labelize(row.status),
            render: (row) => (
              <Badge variant={row.status === "active" ? "default" : "secondary"}>
                {labelize(row.status)}
              </Badge>
            ),
          },
          { key: "effective_from", header: "Effective from" },
          { key: "effective_to", header: "Effective to", defaultHidden: true },
          { key: "total_credits", header: "Planned credits" },
        ]}
        fields={[
          {
            name: "name",
            label: "Curriculum name",
            required: true,
            placeholder: "B.Tech CSE Curriculum",
          },
          { name: "version", label: "Version", required: true, placeholder: "2026.1" },
          {
            name: "program_id",
            label: "Programme",
            type: "select",
            required: true,
            options: optionsFrom(programs.data),
          },
          { name: "regulation", label: "Regulation", placeholder: "CBCS / NEP 2020" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: curriculumStatuses.map((value) => ({ value, label: labelize(value) })),
          },
          { name: "effective_from", label: "Effective from", type: "date" },
          { name: "effective_to", label: "Effective to", type: "date" },
          { name: "total_credits", label: "Planned credits", type: "number", min: 0, max: 500 },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          name: row.name,
          version: row.version,
          program_id: row.program_id,
          regulation: row.regulation ?? "",
          status: row.status,
          effective_from: row.effective_from ?? "",
          effective_to: row.effective_to ?? "",
          total_credits: row.total_credits ?? "",
          notes: row.notes ?? "",
        })}
      />

      <CurriculumSheet curriculum={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}
