import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultPolicy, summarise, type AttendanceStatus, type PolicyLike } from "@/lib/attendance";

export interface WardAttendance {
  studentId: string;
  name: string;
  rollNumber: string | null;
  percentage: number;
  attended: number;
  held: number;
  recent: { date: string; status: AttendanceStatus; subject: string | null }[];
}

/**
 * Parent / guardian portal read. Returns attendance for every student the
 * signed-in user is linked to through `student_guardians`. RLS applies as the
 * caller, so a guardian can only ever see their own wards.
 */
export const getWardAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WardAttendance[]> => {
    const { supabase, userId } = context;

    const { data: links, error: linkError } = await supabase
      .from("student_guardians")
      .select("student_id")
      .eq("user_id", userId);
    if (linkError) throw linkError;

    const studentIds = (links ?? []).map((row) => row.student_id).filter(Boolean) as string[];
    if (studentIds.length === 0) return [];

    const [
      { data: students, error: studentError },
      { data: records, error: recordError },
      { data: policies },
    ] = await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, roll_number")
        .in("id", studentIds),
      supabase
        .from("attendance_records")
        .select("student_id, status, attendance_session_id, marked_at")
        .in("student_id", studentIds)
        .order("marked_at", { ascending: false }),
      supabase
        .from("attendance_policies")
        .select(
          "minimum_percentage, warning_percentage, penalty_percentage, grace_minutes, late_after_minutes, late_counts_as_present, count_holidays, approved_leave_counts, medical_leave_counts, duty_leave_counts",
        )
        .eq("is_active", true)
        .limit(1),
    ]);
    if (studentError) throw studentError;
    if (recordError) throw recordError;

    const policy = (policies?.[0] as PolicyLike | undefined) ?? defaultPolicy;

    const sessionIds = [...new Set((records ?? []).map((row) => row.attendance_session_id))].slice(
      0,
      500,
    );
    const { data: sessions } = sessionIds.length
      ? await supabase
          .from("attendance_sessions")
          .select("id, session_date, course_id")
          .in("id", sessionIds)
      : { data: [] as { id: string; session_date: string; course_id: string | null }[] };

    const courseIds = [
      ...new Set((sessions ?? []).map((row) => row.course_id).filter(Boolean)),
    ] as string[];
    const { data: courses } = courseIds.length
      ? await supabase.from("courses").select("id, code, title").in("id", courseIds)
      : { data: [] as { id: string; code: string; title: string }[] };

    const sessionById = new Map((sessions ?? []).map((row) => [row.id, row]));
    const courseById = new Map((courses ?? []).map((row) => [row.id, row]));

    return (students ?? []).map((student) => {
      const mine = (records ?? []).filter((row) => row.student_id === student.id);
      const summary = summarise(
        mine.map((row) => row.status as AttendanceStatus),
        policy,
      );
      return {
        studentId: student.id,
        name: `${student.first_name} ${student.last_name ?? ""}`.trim(),
        rollNumber: student.roll_number,
        percentage: summary.percentage,
        attended: summary.attended,
        held: summary.held,
        recent: mine.slice(0, 20).map((row) => {
          const session = sessionById.get(row.attendance_session_id);
          const course = session?.course_id ? courseById.get(session.course_id) : null;
          return {
            date: session?.session_date ?? String(row.marked_at).slice(0, 10),
            status: row.status as AttendanceStatus,
            subject: course ? `${course.code} — ${course.title}` : null,
          };
        }),
      };
    });
  });
