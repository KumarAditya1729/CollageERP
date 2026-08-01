import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { StatCard } from "@/components/common/stat-card";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  facultyName,
  labelize,
  optionsFrom,
  useAcademicLookups,
  useRooms,
} from "@/hooks/useAcademics";
import {
  timetableSelect,
  useTimetableConflicts,
  type TimetableEntryRow,
} from "@/hooks/useAttendance";
import { classSessionTypes, weekdayLabels } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/timetable/")({
  head: () => ({
    meta: [
      { title: "Timetable — CampusOS" },
      {
        name: "description",
        content:
          "Weekly class timetable with section, subject, faculty and room allocation plus live conflict detection.",
      },
      { property: "og:title", content: "Timetable — CampusOS" },
      {
        property: "og:description",
        content: "Schedule classes and catch clashes before they happen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TimetablePage,
});

const weekdayOptions = weekdayLabels.map((label, index) => ({ value: String(index), label }));

function TimetablePage() {
  const { sections, courses, faculty, semesters, academicSessions } = useAcademicLookups();
  const rooms = useRooms();
  const { conflicts, entries } = useTimetableConflicts();
  const [sectionFilter, setSectionFilter] = useState("all");

  const conflictIds = useMemo(
    () => new Set(conflicts.flatMap((conflict) => conflict.entryIds)),
    [conflicts],
  );

  const nameOf = {
    section: (id: string | null) =>
      sections.data?.find((row) => row.id === id)?.name ?? "Unassigned section",
    course: (id: string | null) => {
      const course = courses.data?.find((row) => row.id === id);
      return course ? `${course.code} — ${course.title}` : "Unassigned subject";
    },
    faculty: (id: string | null) => {
      const member = faculty.data?.find((row) => row.id === id);
      return member ? facultyName(member) : "Unassigned faculty";
    },
    room: (id: string | null) => rooms.data?.find((row) => row.id === id)?.name ?? "No room",
  };

  const gridEntries = useMemo(
    () =>
      (entries.data ?? [])
        .filter((entry) => sectionFilter === "all" || entry.section_id === sectionFilter)
        .map((entry) => ({
          id: entry.id,
          weekday: entry.weekday,
          starts_at: entry.starts_at,
          ends_at: entry.ends_at,
          title: nameOf.course(entry.course_id),
          subtitle: `${nameOf.section(entry.section_id)} · ${nameOf.faculty(entry.faculty_id)} · ${nameOf.room(entry.room_id)}`,
          tone: conflictIds.has(entry.id) ? ("warning" as const) : ("default" as const),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      entries.data,
      sectionFilter,
      conflictIds,
      sections.data,
      courses.data,
      faculty.data,
      rooms.data,
    ],
  );

  const workingDays = useMemo(() => {
    const days = new Set((entries.data ?? []).map((entry) => entry.weekday));
    if (days.size === 0) return [1, 2, 3, 4, 5];
    return [...days].sort((a, b) => a - b);
  }, [entries.data]);

  const recurring = (entries.data ?? []).filter((row) => row.kind === "recurring").length;
  const temporary = (entries.data ?? []).filter((row) => row.kind === "temporary").length;

  return (
    <>
      <PageHeader
        title="Timetable"
        description="Recurring and temporary class schedules built on your sections, subjects, faculty allocations and rooms."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Timetable" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Scheduled classes"
          value={entries.data?.length ?? 0}
          hint={`${workingDays.length} working days`}
        />
        <StatCard label="Recurring" value={recurring} hint="Repeat every week" />
        <StatCard label="Temporary" value={temporary} hint="One-off or override slots" />
        <StatCard
          label="Conflicts"
          value={conflicts.length}
          hint={conflicts.length ? "Resolve before publishing" : "Schedule is clean"}
        />
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="grid">Weekly grid</TabsTrigger>
          <TabsTrigger value="entries">Schedule entries</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {(sections.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TimetableGrid entries={gridEntries} workingDays={workingDays} />
        </TabsContent>

        <TabsContent value="entries">
          <ResourcePage<TimetableEntryRow>
            hideHeader
            title="Schedule entries"
            description="Schedule entries"
            table="timetable_entries"
            select={timetableSelect}
            orderBy={{ column: "weekday" }}
            campusScoped
            managePermission="timetable.manage"
            entityLabel="class"
            storageKey="timetable-entries"
            columns={[
              {
                key: "weekday",
                header: "Day",
                alwaysVisible: true,
                value: (row) => weekdayLabels[row.weekday] ?? String(row.weekday),
              },
              {
                key: "time",
                header: "Time",
                value: (row) => `${row.starts_at.slice(0, 5)}–${row.ends_at.slice(0, 5)}`,
              },
              {
                key: "section_id",
                header: "Section",
                value: (row) => nameOf.section(row.section_id),
              },
              { key: "course_id", header: "Subject", value: (row) => nameOf.course(row.course_id) },
              {
                key: "faculty_id",
                header: "Faculty",
                value: (row) => nameOf.faculty(row.faculty_id),
              },
              { key: "room_id", header: "Room", value: (row) => nameOf.room(row.room_id) },
              {
                key: "session_type",
                header: "Type",
                render: (row) => <Badge variant="outline">{labelize(row.session_type)}</Badge>,
                value: (row) => row.session_type,
              },
              {
                key: "kind",
                header: "Kind",
                render: (row) => (
                  <Badge variant={row.kind === "recurring" ? "secondary" : "outline"}>
                    {labelize(row.kind)}
                  </Badge>
                ),
                value: (row) => row.kind,
              },
              {
                key: "status",
                header: "Status",
                render: (row) =>
                  row.is_cancelled ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : conflictIds.has(row.id) ? (
                    <Badge variant="destructive">Conflict</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  ),
                value: (row) => (row.is_cancelled ? "cancelled" : "active"),
              },
            ]}
            fields={[
              {
                name: "section_id",
                label: "Section",
                type: "select",
                required: true,
                options: optionsFrom(sections.data),
              },
              {
                name: "course_id",
                label: "Subject",
                type: "select",
                required: true,
                options: optionsFrom(courses.data),
              },
              {
                name: "faculty_id",
                label: "Faculty",
                type: "select",
                options: (faculty.data ?? []).map((row) => ({
                  value: row.id,
                  label: facultyName(row),
                })),
              },
              {
                name: "room_id",
                label: "Room",
                type: "select",
                options: (rooms.data ?? []).map((row) => ({
                  value: row.id,
                  label: `${row.code} — ${row.name}`,
                })),
              },
              {
                name: "weekday",
                label: "Day",
                type: "select",
                required: true,
                options: weekdayOptions,
              },
              { name: "starts_at", label: "Starts at", placeholder: "09:00", required: true },
              { name: "ends_at", label: "Ends at", placeholder: "10:00", required: true },
              {
                name: "session_type",
                label: "Session type",
                type: "select",
                required: true,
                options: classSessionTypes.map((value) => ({ value, label: labelize(value) })),
              },
              {
                name: "kind",
                label: "Kind",
                type: "select",
                required: true,
                options: [
                  { value: "recurring", label: "Recurring" },
                  { value: "temporary", label: "Temporary" },
                ],
              },
              {
                name: "semester_id",
                label: "Semester",
                type: "select",
                options: optionsFrom(semesters.data, false),
              },
              {
                name: "academic_session_id",
                label: "Term",
                type: "select",
                options: optionsFrom(academicSessions.data, false),
              },
              { name: "effective_from", label: "Effective from", type: "date" },
              { name: "effective_to", label: "Effective to", type: "date" },
              {
                name: "override_date",
                label: "Override date",
                type: "date",
                help: "For a one-off temporary class.",
              },
              { name: "notes", label: "Notes", type: "textarea", full: true },
            ]}
            toFormValues={(row) => ({
              section_id: row.section_id,
              course_id: row.course_id,
              faculty_id: row.faculty_id,
              room_id: row.room_id,
              weekday: String(row.weekday),
              starts_at: row.starts_at?.slice(0, 5) ?? "",
              ends_at: row.ends_at?.slice(0, 5) ?? "",
              session_type: row.session_type,
              kind: row.kind,
              semester_id: row.semester_id,
              academic_session_id: row.academic_session_id,
              effective_from: row.effective_from,
              effective_to: row.effective_to,
              override_date: row.override_date,
              notes: row.notes,
            })}
          />
        </TabsContent>

        <TabsContent value="conflicts">
          <Card>
            <CardHeader>
              <CardTitle>Conflict detection</CardTitle>
              <CardDescription>
                Faculty, room, lab, section, duplicate-lecture and invalid-time clashes across the
                whole schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {conflicts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conflicts detected.</p>
              ) : (
                conflicts.map((conflict, index) => {
                  const involved = (entries.data ?? []).filter((row) =>
                    conflict.entryIds.includes(row.id),
                  );
                  return (
                    <div
                      key={`${conflict.kind}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          <Badge variant="destructive" className="mr-2">
                            {labelize(conflict.kind)}
                          </Badge>
                          {conflict.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {involved
                            .map(
                              (row) =>
                                `${weekdayLabels[row.weekday]} ${row.starts_at.slice(0, 5)}–${row.ends_at.slice(0, 5)} · ${nameOf.course(row.course_id)} · ${nameOf.section(row.section_id)}`,
                            )
                            .join("  ↔  ")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
