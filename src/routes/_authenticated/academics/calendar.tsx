import { createFileRoute } from "@tanstack/react-router";

import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";

import { labelize } from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/calendar")({
  head: () => ({
    meta: [
      { title: "Academic calendar — CampusOS" },
      {
        name: "description",
        content:
          "Semester dates, registration windows, exam windows, holidays and academic events.",
      },
      { property: "og:title", content: "Academic calendar — CampusOS" },
      { property: "og:description", content: "Holidays, exam windows and academic milestones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademicCalendarPage,
});

interface EventRow extends Record<string, unknown> {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
  is_public: boolean;
}

const eventTypes = [
  "academic",
  "exam",
  "holiday",
  "event",
  "meeting",
  "deadline",
  "personal",
  "other",
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AcademicCalendarPage() {
  return (
    <ResourcePage<EventRow>
      title="Academic calendar"
      description="Semester dates, registration and exam windows, holidays and institutional events."
      crumbs={[{ label: "Academics", to: "/academics" }, { label: "Calendar" }]}
      table="calendar_events"
      select="id, title, description, event_type, location, starts_at, ends_at, is_public"
      orderBy={{ column: "starts_at", ascending: false }}
      campusScoped
      managePermission="calendar.manage"
      entityLabel="calendar entry"
      storageKey="academic-calendar"
      columns={[
        { key: "title", header: "Entry", alwaysVisible: true, className: "font-medium" },
        {
          key: "event_type",
          header: "Type",
          render: (row) => <Badge variant="outline">{labelize(row.event_type)}</Badge>,
        },
        { key: "starts_at", header: "Starts", value: (row) => formatDate(row.starts_at) },
        { key: "ends_at", header: "Ends", value: (row) => formatDate(row.ends_at) },
        { key: "location", header: "Location", defaultHidden: true },
        {
          key: "is_public",
          header: "Visibility",
          value: (row) => (row.is_public ? "Public" : "Internal"),
          render: (row) => (
            <Badge variant={row.is_public ? "default" : "secondary"}>
              {row.is_public ? "Public" : "Internal"}
            </Badge>
          ),
        },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        {
          name: "event_type",
          label: "Type",
          type: "select",
          required: true,
          options: eventTypes.map((value) => ({ value, label: labelize(value) })),
        },
        { name: "starts_at", label: "Start date", type: "date", required: true },
        { name: "ends_at", label: "End date", type: "date", required: true },
        { name: "location", label: "Location" },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      toFormValues={(row) => ({
        title: row.title,
        event_type: row.event_type,
        starts_at: row.starts_at.slice(0, 10),
        ends_at: row.ends_at.slice(0, 10),
        location: row.location ?? "",
        description: row.description ?? "",
      })}
    />
  );
}
