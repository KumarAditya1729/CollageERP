import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { AttendanceRoster } from "@/components/attendance/attendance-roster";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { facultyName, labelize, useAcademicLookups } from "@/hooks/useAcademics";
import {
  useAttendanceSessions,
  useCreateSession,
  useSessionLock,
  useTimetableEntries,
} from "@/hooks/useAttendance";
import { attendanceModes, newQrToken, todayIso, weekdayLabels } from "@/lib/attendance";

export const Route = createFileRoute("/_authenticated/attendance/mark")({
  head: () => ({
    meta: [
      { title: "Take attendance — CampusOS" },
      {
        name: "description",
        content:
          "Mark class attendance from the timetable with manual, QR, biometric, RFID or GPS methods and offline support.",
      },
      { property: "og:title", content: "Take attendance — CampusOS" },
      { property: "og:description", content: "Roll call for any class, online or offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarkAttendancePage,
});

function MarkAttendancePage() {
  const { can } = useAccess();
  const canManage = can("attendance.manage");
  const sessions = useAttendanceSessions();
  const entries = useTimetableEntries();
  const createSession = useCreateSession();
  const lock = useSessionLock();
  const { courses, sections, faculty } = useAcademicLookups();

  const [date, setDate] = useState(todayIso());
  const [selected, setSelected] = useState<string | null>(null);

  const daySessions = useMemo(
    () => (sessions.data ?? []).filter((row) => row.session_date === date),
    [sessions.data, date],
  );

  const scheduled = useMemo(() => {
    const weekday = new Date(date).getDay();
    return (entries.data ?? []).filter(
      (entry) =>
        !entry.is_cancelled &&
        (entry.kind === "recurring" ? entry.weekday === weekday : entry.override_date === date) &&
        !daySessions.some((session) => session.timetable_entry_id === entry.id),
    );
  }, [entries.data, date, daySessions]);

  const describeEntry = (entryId: string) => {
    const entry = entries.data?.find((row) => row.id === entryId);
    if (!entry) return "Class";
    const course = courses.data?.find((row) => row.id === entry.course_id);
    const section = sections.data?.find((row) => row.id === entry.section_id);
    const teacher = faculty.data?.find((row) => row.id === entry.faculty_id);
    return [
      `${weekdayLabels[entry.weekday]} ${entry.starts_at.slice(0, 5)}`,
      course ? `${course.code} — ${course.title}` : null,
      section?.name,
      teacher ? facultyName(teacher) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const openSession = sessions.data?.find((row) => row.id === selected) ?? null;

  const startSession = async (entryId: string) => {
    const entry = entries.data?.find((row) => row.id === entryId);
    if (!entry) return;
    const created = await createSession.mutateAsync({
      timetable_entry_id: entry.id,
      section_id: entry.section_id,
      course_id: entry.course_id,
      faculty_id: entry.faculty_id,
      room_id: entry.room_id,
      semester_id: entry.semester_id,
      academic_session_id: entry.academic_session_id,
      attendee_kind: "student",
      session_type: entry.session_type,
      session_date: date,
      starts_at: entry.starts_at,
      ends_at: entry.ends_at,
      mode: "manual",
      qr_token: newQrToken(),
    });
    setSelected(created.id);
  };

  return (
    <>
      <PageHeader
        title="Take attendance"
        description="Open a scheduled class, mark the roster and save. Works offline and syncs when you reconnect."
        crumbs={[{ label: "Attendance", to: "/attendance" }, { label: "Take attendance" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Pick a class</CardTitle>
          <CardDescription>
            Sessions already opened for this date, plus classes still to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="attendance-date">Date</Label>
              <Input
                id="attendance-date"
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSelected(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Open session</Label>
              <Select value={selected ?? ""} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={daySessions.length ? "Select a session" : "No sessions yet"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {daySessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.timetable_entry_id
                        ? describeEntry(session.timetable_entry_id)
                        : `${labelize(session.session_type)} · ${session.starts_at?.slice(0, 5) ?? "ad hoc"}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Session state</Label>
              <Button
                variant="outline"
                className="w-full"
                disabled={!openSession || !canManage}
                onClick={() =>
                  openSession && lock.mutate({ id: openSession.id, locked: !openSession.is_locked })
                }
              >
                {openSession?.is_locked ? "Unfreeze session" : "Freeze session"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Not started yet</p>
            {scheduled.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Every scheduled class for this date has a session.
              </p>
            ) : (
              scheduled.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{describeEntry(entry.id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {labelize(entry.session_type)} · {labelize(entry.kind)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={!canManage || createSession.isPending}
                    onClick={() => void startSession(entry.id)}
                  >
                    <CalendarPlus className="size-4" />
                    Start
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            Supported methods:
            {attendanceModes.map((mode) => (
              <Badge key={mode} variant="outline">
                {labelize(mode)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {openSession ? <AttendanceRoster session={openSession} canManage={canManage} /> : null}
    </>
  );
}
