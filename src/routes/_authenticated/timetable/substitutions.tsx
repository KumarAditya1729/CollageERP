import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/useAccess";
import {
  facultyName,
  labelize,
  useAcademicLookups,
  useFacultyWorkload,
  useRooms,
} from "@/hooks/useAcademics";
import {
  useApprovalActions,
  useSubstitutions,
  useTimetableEntries,
  type SubstitutionRow,
} from "@/hooks/useAttendance";
import { weekdayLabels } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/timetable/substitutions")({
  head: () => ({
    meta: [
      { title: "Substitutions — CampusOS" },
      {
        name: "description",
        content:
          "Assign replacement faculty for planned leave or emergencies, with suggestions and an approval trail.",
      },
      { property: "og:title", content: "Substitutions — CampusOS" },
      {
        property: "og:description",
        content: "Replacement faculty, emergency cover and approvals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubstitutionsPage,
});

function SubstitutionsPage() {
  const { can } = useAccess();
  const canManage = can("substitution.manage");
  const { faculty, courses, sections } = useAcademicLookups();
  const rooms = useRooms();
  const entries = useTimetableEntries();
  const substitutions = useSubstitutions();
  const allocations = useFacultyWorkload();
  const { reviewSubstitution } = useApprovalActions();
  const [suggestFor, setSuggestFor] = useState<string | null>(null);

  const entryLabel = (id: string) => {
    const entry = entries.data?.find((row) => row.id === id);
    if (!entry) return "Unknown class";
    const course = courses.data?.find((row) => row.id === entry.course_id);
    const section = sections.data?.find((row) => row.id === entry.section_id);
    return `${weekdayLabels[entry.weekday]} ${entry.starts_at.slice(0, 5)} · ${course?.code ?? "Subject"} · ${section?.name ?? "Section"}`;
  };

  const facultyLabel = (id: string | null) => {
    const member = faculty.data?.find((row) => row.id === id);
    return member ? facultyName(member) : "—";
  };

  /** Faculty free at the same weekday/time who already teach the same subject where possible. */
  const suggestions = useMemo(() => {
    if (!suggestFor) return [];
    const entry = entries.data?.find((row) => row.id === suggestFor);
    if (!entry) return [];
    const busy = new Set(
      (entries.data ?? [])
        .filter(
          (row) =>
            row.id !== entry.id &&
            row.weekday === entry.weekday &&
            row.starts_at < entry.ends_at &&
            entry.starts_at < row.ends_at &&
            row.faculty_id,
        )
        .map((row) => row.faculty_id as string),
    );
    const teachesSubject = new Set(
      (allocations.data ?? [])
        .filter((row) => row.is_active && row.course_id === entry.course_id)
        .map((row) => row.faculty_id),
    );
    return (faculty.data ?? [])
      .filter((member) => member.id !== entry.faculty_id && !busy.has(member.id))
      .map((member) => ({
        id: member.id,
        name: facultyName(member),
        knowsSubject: teachesSubject.has(member.id),
        load: (allocations.data ?? [])
          .filter((row) => row.is_active && row.faculty_id === member.id)
          .reduce((sum, row) => sum + Number(row.hours_per_week ?? 0), 0),
      }))
      .sort((a, b) => Number(b.knowsSubject) - Number(a.knowsSubject) || a.load - b.load)
      .slice(0, 6);
  }, [suggestFor, entries.data, faculty.data, allocations.data]);

  return (
    <>
      <PageHeader
        title="Substitutions"
        description="Cover classes when faculty are on leave — plan replacements, log emergency cover and keep an approval trail."
        crumbs={[{ label: "Timetable", to: "/timetable" }, { label: "Substitutions" }]}
      />

      <ResourcePage<SubstitutionRow>
        hideHeader
        title="Substitutions"
        description="Substitutions"
        table="timetable_substitutions"
        select="id, timetable_entry_id, substitution_date, original_faculty_id, substitute_faculty_id, room_id, reason, is_emergency, status"
        orderBy={{ column: "substitution_date", ascending: false }}
        managePermission="substitution.manage"
        entityLabel="substitution"
        storageKey="substitutions"
        columns={[
          { key: "substitution_date", header: "Date", alwaysVisible: true },
          {
            key: "timetable_entry_id",
            header: "Class",
            value: (row) => entryLabel(row.timetable_entry_id),
          },
          {
            key: "original_faculty_id",
            header: "Original",
            value: (row) => facultyLabel(row.original_faculty_id),
          },
          {
            key: "substitute_faculty_id",
            header: "Substitute",
            value: (row) => facultyLabel(row.substitute_faculty_id),
          },
          {
            key: "is_emergency",
            header: "Emergency",
            render: (row) =>
              row.is_emergency ? <Badge variant="destructive">Emergency</Badge> : <span>—</span>,
            value: (row) => (row.is_emergency ? "yes" : "no"),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge
                variant={
                  row.status === "approved"
                    ? "default"
                    : row.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {labelize(row.status)}
              </Badge>
            ),
            value: (row) => row.status,
          },
        ]}
        rowExtras={(row) =>
          canManage && row.status === "pending" ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => reviewSubstitution.mutate({ id: row.id, status: "approved" })}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => reviewSubstitution.mutate({ id: row.id, status: "rejected" })}
              >
                Reject
              </Button>
            </div>
          ) : null
        }
        fields={[
          {
            name: "timetable_entry_id",
            label: "Class",
            type: "select",
            required: true,
            options: (entries.data ?? []).map((row) => ({
              value: row.id,
              label: entryLabel(row.id),
            })),
          },
          { name: "substitution_date", label: "Date", type: "date", required: true },
          {
            name: "original_faculty_id",
            label: "Original faculty",
            type: "select",
            options: (faculty.data ?? []).map((row) => ({
              value: row.id,
              label: facultyName(row),
            })),
          },
          {
            name: "substitute_faculty_id",
            label: "Substitute faculty",
            type: "select",
            required: true,
            options: (faculty.data ?? []).map((row) => ({
              value: row.id,
              label: facultyName(row),
            })),
          },
          {
            name: "room_id",
            label: "Room change",
            type: "select",
            options: (rooms.data ?? []).map((row) => ({
              value: row.id,
              label: `${row.code} — ${row.name}`,
            })),
          },
          {
            name: "status",
            label: "Approval",
            type: "select",
            required: true,
            options: ["pending", "approved", "rejected", "cancelled"].map((value) => ({
              value,
              label: labelize(value),
            })),
          },
          { name: "reason", label: "Reason", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          timetable_entry_id: row.timetable_entry_id,
          substitution_date: row.substitution_date,
          original_faculty_id: row.original_faculty_id,
          substitute_faculty_id: row.substitute_faculty_id,
          room_id: row.room_id,
          status: row.status,
          reason: row.reason,
        })}
      />

      <Card>
        <CardHeader>
          <CardTitle>Auto-suggest cover</CardTitle>
          <CardDescription>
            Pick a class to see faculty who are free at that time, preferring those who already
            teach the subject and carry the lightest load.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(entries.data ?? []).slice(0, 12).map((entry) => (
              <Button
                key={entry.id}
                size="sm"
                variant={suggestFor === entry.id ? "default" : "outline"}
                onClick={() => setSuggestFor(entry.id)}
              >
                {entryLabel(entry.id)}
              </Button>
            ))}
            {(entries.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Create timetable entries first.</p>
            ) : null}
          </div>

          {suggestFor ? (
            suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody is free in that slot.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.load} h weekly load</p>
                    {suggestion.knowsSubject ? (
                      <Badge variant="secondary" className="mt-2">
                        Already teaches this subject
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
