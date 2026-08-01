import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultPolicy,
  overlaps,
  type AttendanceMode,
  type AttendanceStatus,
  type AttendeeKind,
  type ClassSessionType,
  type PolicyLike,
} from "@/lib/attendance";

/* ------------------------------------------------------------------ */
/* Row shapes                                                          */
/* ------------------------------------------------------------------ */

export interface TimetableEntryRow extends Record<string, unknown> {
  id: string;
  section_id: string | null;
  course_id: string | null;
  faculty_id: string | null;
  room_id: string | null;
  time_slot_id: string | null;
  semester_id: string | null;
  academic_session_id: string | null;
  weekday: number;
  starts_at: string;
  ends_at: string;
  session_type: ClassSessionType;
  kind: "recurring" | "temporary";
  effective_from: string | null;
  effective_to: string | null;
  override_date: string | null;
  skip_on_holiday: boolean;
  is_cancelled: boolean;
  notes: string | null;
}

export interface SubstitutionRow extends Record<string, unknown> {
  id: string;
  timetable_entry_id: string;
  substitution_date: string;
  original_faculty_id: string | null;
  substitute_faculty_id: string | null;
  room_id: string | null;
  reason: string | null;
  is_emergency: boolean;
  status: string;
}

export interface AttendanceSessionRow extends Record<string, unknown> {
  id: string;
  timetable_entry_id: string | null;
  section_id: string | null;
  course_id: string | null;
  faculty_id: string | null;
  room_id: string | null;
  semester_id: string | null;
  academic_session_id: string | null;
  attendee_kind: AttendeeKind;
  session_type: ClassSessionType;
  session_date: string;
  starts_at: string | null;
  ends_at: string | null;
  mode: AttendanceMode;
  qr_token: string | null;
  qr_expires_at: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  gps_radius_m: number | null;
  allow_self_checkin: boolean;
  is_locked: boolean;
  total_expected: number | null;
  notes: string | null;
}

export interface AttendanceRecordRow extends Record<string, unknown> {
  id: string;
  attendance_session_id: string;
  attendee_kind: AttendeeKind;
  student_id: string | null;
  faculty_id: string | null;
  staff_id: string | null;
  status: AttendanceStatus;
  minutes_late: number;
  marked_via: AttendanceMode;
  marked_at: string;
  remarks: string | null;
  is_corrected: boolean;
  leave_request_id: string | null;
}

export interface AttendancePolicyRow extends Record<string, unknown>, PolicyLike {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  program_id: string | null;
  attendee_kind: AttendeeKind;
  corrections_need_approval: boolean;
  freeze_after_days: number | null;
  frozen_until: string | null;
  is_active: boolean;
}

export interface LeaveRequestRow extends Record<string, unknown> {
  id: string;
  attendee_kind: AttendeeKind;
  student_id: string | null;
  faculty_id: string | null;
  staff_id: string | null;
  requested_by: string | null;
  leave_kind: string;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  reason: string | null;
  status: string;
  adjusts_attendance: boolean;
  review_notes: string | null;
}

export interface CorrectionRow extends Record<string, unknown> {
  id: string;
  attendance_record_id: string;
  old_status: AttendanceStatus;
  new_status: AttendanceStatus;
  reason: string | null;
  status: string;
  requested_by: string | null;
  review_notes: string | null;
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export const timetableSelect =
  "id, section_id, course_id, faculty_id, room_id, time_slot_id, semester_id, academic_session_id, weekday, starts_at, ends_at, session_type, kind, effective_from, effective_to, override_date, skip_on_holiday, is_cancelled, notes";

export function useTimetableEntries() {
  return useResourceList<TimetableEntryRow>({
    table: "timetable_entries",
    select: timetableSelect,
    orderBy: { column: "starts_at" },
  });
}

export function useSubstitutions() {
  return useResourceList<SubstitutionRow>({
    table: "timetable_substitutions",
    select:
      "id, timetable_entry_id, substitution_date, original_faculty_id, substitute_faculty_id, room_id, reason, is_emergency, status",
    orderBy: { column: "substitution_date", ascending: false },
  });
}

export const sessionSelect =
  "id, timetable_entry_id, section_id, course_id, faculty_id, room_id, semester_id, academic_session_id, attendee_kind, session_type, session_date, starts_at, ends_at, mode, qr_token, qr_expires_at, gps_latitude, gps_longitude, gps_radius_m, allow_self_checkin, is_locked, total_expected, notes";

export function useAttendanceSessions() {
  return useResourceList<AttendanceSessionRow>({
    table: "attendance_sessions",
    select: sessionSelect,
    orderBy: { column: "session_date", ascending: false },
  });
}

export function useAttendanceRecords() {
  return useResourceList<AttendanceRecordRow>({
    table: "attendance_records",
    select:
      "id, attendance_session_id, attendee_kind, student_id, faculty_id, staff_id, status, minutes_late, marked_via, marked_at, remarks, is_corrected, leave_request_id",
  });
}

export function useAttendancePolicies() {
  return useResourceList<AttendancePolicyRow>({
    table: "attendance_policies",
    select:
      "id, name, description, department_id, program_id, attendee_kind, minimum_percentage, warning_percentage, penalty_percentage, grace_minutes, late_after_minutes, late_counts_as_present, count_holidays, approved_leave_counts, medical_leave_counts, duty_leave_counts, corrections_need_approval, freeze_after_days, frozen_until, is_active",
    orderBy: { column: "name" },
  });
}

export function useLeaveRequests() {
  return useResourceList<LeaveRequestRow>({
    table: "leave_requests",
    select:
      "id, attendee_kind, student_id, faculty_id, staff_id, requested_by, leave_kind, from_date, to_date, is_half_day, reason, status, adjusts_attendance, review_notes",
    orderBy: { column: "from_date", ascending: false },
  });
}

export function useAttendanceCorrections() {
  return useResourceList<CorrectionRow>({
    table: "attendance_corrections",
    select:
      "id, attendance_record_id, old_status, new_status, reason, status, requested_by, review_notes",
    orderBy: { column: "created_at", ascending: false },
  });
}

/** The effective policy for a department/programme, falling back to the tenant default. */
export function useEffectivePolicy(options?: {
  departmentId?: string | null;
  programId?: string | null;
}) {
  const policies = useAttendancePolicies();
  const policy = useMemo(() => {
    const rows = (policies.data ?? []).filter((row) => row.is_active);
    return (
      rows.find((row) => options?.programId && row.program_id === options.programId) ??
      rows.find((row) => options?.departmentId && row.department_id === options.departmentId) ??
      rows.find((row) => !row.program_id && !row.department_id) ??
      null
    );
  }, [policies.data, options?.departmentId, options?.programId]);

  return { policy: (policy ?? defaultPolicy) as PolicyLike, record: policy, query: policies };
}

/* ------------------------------------------------------------------ */
/* Roster + marking                                                    */
/* ------------------------------------------------------------------ */

export interface RosterMember {
  id: string;
  name: string;
  identifier: string | null;
  recordId: string | null;
  status: AttendanceStatus;
  minutesLate: number;
  remarks: string | null;
}

/** Students of a section (or subject enrolment) merged with any marks already saved. */
export function useSessionRoster(session: AttendanceSessionRow | null) {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["attendance-roster", session?.id, tenant?.id],
    enabled: Boolean(session?.id && tenant?.id),
    queryFn: async (): Promise<RosterMember[]> => {
      if (!session) return [];
      let people: { id: string; name: string; identifier: string | null }[] = [];

      if (session.attendee_kind === "student") {
        let ids: string[] | null = null;
        if (session.course_id) {
          const { data, error } = await supabase
            .from("enrollments")
            .select("student_id")
            .eq("tenant_id", tenant!.id)
            .eq("course_id", session.course_id)
            .is("deleted_at", null);
          if (error) throw error;
          ids = (data ?? []).map((row) => row.student_id);
        }
        let builder = supabase
          .from("students")
          .select("id, first_name, last_name, roll_number, admission_number")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null);
        if (session.section_id) builder = builder.eq("section_id", session.section_id);
        else if (ids && ids.length > 0) builder = builder.in("id", ids);
        const { data, error } = await builder.order("first_name").limit(1000);
        if (error) throw error;
        people = (data ?? [])
          .filter((row) =>
            session.section_id && ids && ids.length > 0 ? ids.includes(row.id) : true,
          )
          .map((row) => ({
            id: row.id,
            name: [row.first_name, row.last_name].filter(Boolean).join(" "),
            identifier: row.roll_number ?? row.admission_number,
          }));
      } else if (session.attendee_kind === "faculty") {
        const { data, error } = await supabase
          .from("faculty")
          .select("id, first_name, last_name, employee_code")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("first_name")
          .limit(1000);
        if (error) throw error;
        people = (data ?? []).map((row) => ({
          id: row.id,
          name: [row.first_name, row.last_name].filter(Boolean).join(" "),
          identifier: row.employee_code,
        }));
      } else {
        const { data, error } = await supabase
          .from("staff")
          .select("id, first_name, last_name, employee_code")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .order("first_name")
          .limit(1000);
        if (error) throw error;
        people = (data ?? []).map((row) => ({
          id: row.id,
          name: [row.first_name, row.last_name].filter(Boolean).join(" "),
          identifier: row.employee_code,
        }));
      }

      const { data: marks, error: marksError } = await supabase
        .from("attendance_records")
        .select("id, student_id, faculty_id, staff_id, status, minutes_late, remarks")
        .eq("attendance_session_id", session.id)
        .is("deleted_at", null);
      if (marksError) throw marksError;

      const keyFor = (row: {
        student_id: string | null;
        faculty_id: string | null;
        staff_id: string | null;
      }) => row.student_id ?? row.faculty_id ?? row.staff_id ?? "";
      const marked = new Map((marks ?? []).map((row) => [keyFor(row), row]));

      return people.map((person) => {
        const mark = marked.get(person.id);
        return {
          ...person,
          recordId: mark?.id ?? null,
          status: (mark?.status ?? "present") as AttendanceStatus,
          minutesLate: mark?.minutes_late ?? 0,
          remarks: mark?.remarks ?? null,
        };
      });
    },
  });
}

export interface MarkInput {
  session: AttendanceSessionRow;
  marks: {
    memberId: string;
    status: AttendanceStatus;
    minutesLate?: number;
    remarks?: string | null;
  }[];
  mode?: AttendanceMode;
  notifyAbsentees?: boolean;
}

/** Upsert attendance marks for a session and optionally raise absence notifications. */
export function useMarkAttendance() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ session, marks, mode = "manual", notifyAbsentees }: MarkInput) => {
      if (session.is_locked) throw new Error("This session is frozen and cannot be edited");
      const column =
        session.attendee_kind === "student"
          ? "student_id"
          : session.attendee_kind === "faculty"
            ? "faculty_id"
            : "staff_id";

      const payload = marks.map((mark) => ({
        tenant_id: tenant?.id,
        attendance_session_id: session.id,
        attendee_kind: session.attendee_kind,
        [column]: mark.memberId,
        status: mark.status,
        minutes_late: mark.minutesLate ?? 0,
        marked_via: mode,
        marked_at: new Date().toISOString(),
        marked_by: user?.id,
        remarks: mark.remarks ?? null,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from("attendance_records" as never)
        .upsert(payload as never, { onConflict: `attendance_session_id,${column}` });
      if (error) throw error;

      if (notifyAbsentees) {
        const absentees = marks.filter((mark) => mark.status === "absent");
        if (absentees.length > 0 && session.attendee_kind === "student") {
          const { data: linked } = await supabase
            .from("student_guardians")
            .select("student_id, user_id, full_name")
            .in(
              "student_id",
              absentees.map((mark) => mark.memberId),
            )
            .not("user_id", "is", null);
          const notifications = (linked ?? [])
            .filter((row) => row.user_id)
            .map((row) => ({
              tenant_id: tenant?.id ?? null,
              recipient_id: row.user_id as string,
              title: "Absence recorded",
              body: `Your ward was marked absent for the class on ${session.session_date}.`,
              event_key: "attendance.absent",
              entity_type: "attendance_sessions",
              entity_id: session.id,
              priority: "high" as const,
              action_url: "/attendance/my",
            }));
          if (notifications.length > 0) {
            await supabase.from("notifications").insert(notifications);
          }
        }
      }

      return marks.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} attendance marks saved`);
      void queryClient.invalidateQueries({ queryKey: ["attendance-roster"] });
      void queryClient.invalidateQueries({ queryKey: ["resource", "attendance_records"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Create an attendance session from a timetable entry (or ad hoc). */
export function useCreateSession() {
  const { tenant, campus } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("attendance_sessions" as never)
        .insert({
          tenant_id: tenant?.id,
          campus_id: campus?.id ?? null,
          created_by: user?.id,
          ...values,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      return data as unknown as { id: string };
    },
    onSuccess: () => {
      toast.success("Attendance session created");
      void queryClient.invalidateQueries({ queryKey: ["resource", "attendance_sessions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useSessionLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({ is_locked: locked, locked_at: locked ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.locked ? "Session frozen" : "Session unfrozen");
      void queryClient.invalidateQueries({ queryKey: ["resource", "attendance_sessions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Approve/reject a leave request, correction or substitution and apply its effect. */
export function useApprovalActions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const reviewLeave = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("leave_requests" as never)
        .update({
          status,
          review_notes: notes ?? null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Leave request updated");
      void queryClient.invalidateQueries({ queryKey: ["resource", "leave_requests"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviewCorrection = useMutation({
    mutationFn: async ({
      id,
      recordId,
      newStatus,
      status,
      notes,
    }: {
      id: string;
      recordId: string;
      newStatus: AttendanceStatus;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("attendance_corrections" as never)
        .update({
          status,
          review_notes: notes ?? null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        const { error: recordError } = await supabase
          .from("attendance_records" as never)
          .update({
            status: newStatus,
            is_corrected: true,
            corrected_at: new Date().toISOString(),
            corrected_by: user?.id,
          } as never)
          .eq("id", recordId);
        if (recordError) throw recordError;
      }
    },
    onSuccess: () => {
      toast.success("Correction reviewed");
      void queryClient.invalidateQueries({ queryKey: ["resource", "attendance_corrections"] });
      void queryClient.invalidateQueries({ queryKey: ["resource", "attendance_records"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviewSubstitution = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("timetable_substitutions" as never)
        .update({
          status,
          reason: notes ?? undefined,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Substitution updated");
      void queryClient.invalidateQueries({ queryKey: ["resource", "timetable_substitutions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { reviewLeave, reviewCorrection, reviewSubstitution };
}

/* ------------------------------------------------------------------ */
/* Conflicts                                                           */
/* ------------------------------------------------------------------ */

export interface TimetableConflict {
  kind: "faculty" | "room" | "section" | "duplicate" | "time";
  message: string;
  entryIds: string[];
}

export function useTimetableConflicts() {
  const entries = useTimetableEntries();

  const conflicts = useMemo<TimetableConflict[]>(() => {
    const rows = (entries.data ?? []).filter((row) => !row.is_cancelled);
    const found: TimetableConflict[] = [];

    for (const row of rows) {
      if (row.starts_at >= row.ends_at) {
        found.push({
          kind: "time",
          message: `Slot on ${row.starts_at}–${row.ends_at} ends before it starts`,
          entryIds: [row.id],
        });
      }
    }

    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const a = rows[i];
        const b = rows[j];
        if (a.weekday !== b.weekday) continue;
        if (!overlaps(a.starts_at, a.ends_at, b.starts_at, b.ends_at)) continue;
        if (a.faculty_id && a.faculty_id === b.faculty_id)
          found.push({
            kind: "faculty",
            message: "Same faculty is booked twice",
            entryIds: [a.id, b.id],
          });
        if (a.room_id && a.room_id === b.room_id)
          found.push({
            kind: "room",
            message: "Same room is booked twice",
            entryIds: [a.id, b.id],
          });
        if (a.section_id && a.section_id === b.section_id) {
          if (a.course_id && a.course_id === b.course_id)
            found.push({
              kind: "duplicate",
              message: "Duplicate lecture for the same section and subject",
              entryIds: [a.id, b.id],
            });
          else
            found.push({
              kind: "section",
              message: "Same section has two classes at once",
              entryIds: [a.id, b.id],
            });
        }
      }
    }
    return found;
  }, [entries.data]);

  return { conflicts, entries };
}

/* ------------------------------------------------------------------ */
/* Offline queue                                                       */
/* ------------------------------------------------------------------ */

const QUEUE_KEY = "campusos.attendance.queue";

export interface QueuedBatch {
  id: string;
  sessionId: string;
  savedAt: string;
  marks: { memberId: string; status: AttendanceStatus }[];
}

export function readQueue(): QueuedBatch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedBatch[];
  } catch {
    return [];
  }
}

export function writeQueue(batches: QueuedBatch[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(batches));
}
