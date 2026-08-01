import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  facultyName,
  labelize,
  optionsFrom,
  useAcademicLookups,
  useRooms,
} from "@/hooks/useAcademics";
import { sessionSelect, useSessionLock, type AttendanceSessionRow } from "@/hooks/useAttendance";
import { attendanceModes, attendeeKinds, classSessionTypes } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/sessions")({
  head: () => ({
    meta: [
      { title: "Attendance sessions — CampusOS" },
      {
        name: "description",
        content: "Every attendance session with its method, geo-fence, QR token and freeze state.",
      },
      { property: "og:title", content: "Attendance sessions — CampusOS" },
      { property: "og:description", content: "Manage, audit and freeze attendance sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { sections, courses, faculty, semesters, academicSessions } = useAcademicLookups();
  const rooms = useRooms();
  const lock = useSessionLock();

  return (
    <>
      <PageHeader
        title="Attendance sessions"
        description="Ad-hoc and timetable-driven sessions, including self check-in windows and geo-fencing."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Sessions" }]}
      />

      <ResourcePage<AttendanceSessionRow>
        hideHeader
        title="Sessions"
        description="Sessions"
        table="attendance_sessions"
        select={sessionSelect}
        orderBy={{ column: "session_date", ascending: false }}
        campusScoped
        managePermission="attendance.manage"
        entityLabel="session"
        storageKey="attendance-sessions"
        columns={[
          { key: "session_date", header: "Date", alwaysVisible: true },
          {
            key: "course_id",
            header: "Subject",
            value: (row) => courses.data?.find((item) => item.id === row.course_id)?.code ?? "—",
          },
          {
            key: "section_id",
            header: "Section",
            value: (row) => sections.data?.find((item) => item.id === row.section_id)?.name ?? "—",
          },
          {
            key: "faculty_id",
            header: "Faculty",
            value: (row) => {
              const member = faculty.data?.find((item) => item.id === row.faculty_id);
              return member ? facultyName(member) : "—";
            },
          },
          { key: "session_type", header: "Type", value: (row) => labelize(row.session_type) },
          { key: "mode", header: "Method", value: (row) => labelize(row.mode) },
          {
            key: "attendee_kind",
            header: "Attendees",
            value: (row) => labelize(row.attendee_kind),
          },
          {
            key: "is_locked",
            header: "State",
            render: (row) => (
              <Badge variant={row.is_locked ? "destructive" : "secondary"}>
                {row.is_locked ? "Frozen" : "Open"}
              </Badge>
            ),
            value: (row) => (row.is_locked ? "frozen" : "open"),
          },
        ]}
        rowExtras={(row) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => lock.mutate({ id: row.id, locked: !row.is_locked })}
          >
            {row.is_locked ? "Unfreeze" : "Freeze"}
          </Button>
        )}
        fields={[
          { name: "session_date", label: "Date", type: "date", required: true },
          {
            name: "attendee_kind",
            label: "Attendees",
            type: "select",
            required: true,
            options: attendeeKinds.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "session_type",
            label: "Session type",
            type: "select",
            required: true,
            options: classSessionTypes.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "mode",
            label: "Method",
            type: "select",
            required: true,
            options: attendanceModes.map((value) => ({ value, label: labelize(value) })),
          },
          {
            name: "section_id",
            label: "Section",
            type: "select",
            options: optionsFrom(sections.data),
          },
          {
            name: "course_id",
            label: "Subject",
            type: "select",
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
          { name: "starts_at", label: "Starts at", placeholder: "09:00" },
          { name: "ends_at", label: "Ends at", placeholder: "10:00" },
          { name: "gps_latitude", label: "Geo-fence latitude", type: "number" },
          { name: "gps_longitude", label: "Geo-fence longitude", type: "number" },
          { name: "gps_radius_m", label: "Geo-fence radius (m)", type: "number" },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        toFormValues={(row) => ({
          session_date: row.session_date,
          attendee_kind: row.attendee_kind,
          session_type: row.session_type,
          mode: row.mode,
          section_id: row.section_id,
          course_id: row.course_id,
          faculty_id: row.faculty_id,
          room_id: row.room_id,
          semester_id: row.semester_id,
          academic_session_id: row.academic_session_id,
          starts_at: row.starts_at?.slice(0, 5) ?? "",
          ends_at: row.ends_at?.slice(0, 5) ?? "",
          gps_latitude: row.gps_latitude,
          gps_longitude: row.gps_longitude,
          gps_radius_m: row.gps_radius_m,
          notes: row.notes,
        })}
      />
    </>
  );
}
