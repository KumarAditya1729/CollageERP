import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useResourceList } from "@/hooks/useResource";
import { useAttendanceRecords, useAttendanceSessions } from "@/hooks/useAttendance";
import { countsAsHeld, countsAsPresent, defaultPolicy } from "@/lib/attendance";
import { supabase } from "@/integrations/supabase/client";
import {
  computeSgpa,
  classAward,
  creditsEarned,
  defaultGradeBands,
  gradeFor,
  percentage,
  rankRows,
  round2,
  sequentialNumber,
  timeOverlaps,
  verificationCode,
  type ExamConflict,
  type GradeBand,
  type MarkComponent,
} from "@/lib/exams";

/* ------------------------------------------------------------------ *
 * Row shapes
 * ------------------------------------------------------------------ */

export interface AssessmentTypeRow extends Record<string, unknown> {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string | null;
  default_max_marks: number;
  default_weightage: number;
  passing_percentage: number;
  is_internal: boolean;
  is_credit_linked: boolean;
  requires_approval: boolean;
  allows_grace: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface GradingScaleRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  program_id: string | null;
  description: string | null;
  max_grade_point: number;
  passing_grade_point: number;
  is_default: boolean;
  is_active: boolean;
}

export interface GradeBandRow extends Record<string, unknown>, GradeBand {
  id: string;
  grading_scale_id: string;
  remark: string | null;
  sort_order: number;
}

export interface AssessmentRow extends Record<string, unknown> {
  id: string;
  academic_session_id: string | null;
  semester_id: string | null;
  course_id: string | null;
  section_id: string | null;
  assessment_type_id: string | null;
  faculty_id: string | null;
  rubric_id: string | null;
  title: string;
  description: string | null;
  max_marks: number;
  weightage: number;
  passing_marks: number | null;
  scheduled_on: string | null;
  due_on: string | null;
  status: string;
  is_published: boolean;
}

export interface ExamSessionRow extends Record<string, unknown> {
  id: string;
  academic_session_id: string | null;
  semester_id: string | null;
  name: string;
  code: string;
  category: string;
  starts_on: string;
  ends_on: string;
  registration_opens_on: string | null;
  registration_closes_on: string | null;
  hall_ticket_release_on: string | null;
  result_expected_on: string | null;
  status: string;
  instructions: string | null;
}

export interface ExamRow extends Record<string, unknown> {
  id: string;
  exam_session_id: string;
  course_id: string | null;
  program_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  assessment_type_id: string | null;
  grading_scale_id: string | null;
  title: string;
  exam_date: string | null;
  starts_at: string | null;
  ends_at: string | null;
  duration_minutes: number | null;
  max_marks: number;
  passing_marks: number;
  internal_weightage: number;
  external_weightage: number;
  min_attendance_percentage: number | null;
  status: string;
  instructions: string | null;
}

export interface ExamRegistrationRow extends Record<string, unknown> {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  attempt_number: number;
  is_backlog: boolean;
  attendance_percentage: number | null;
  eligibility_reason: string | null;
  registered_at: string | null;
  fee_hold: boolean;
  hold_reason: string | null;
}

export interface ExamRoomRow extends Record<string, unknown> {
  id: string;
  exam_id: string;
  room_id: string | null;
  building_id: string | null;
  seat_capacity: number;
  seats_allocated: number;
  seat_prefix: string | null;
  notes: string | null;
  floor: number | null;
  block_label: string | null;
  is_special_needs: boolean;
}

export interface ExamSeatRow extends Record<string, unknown> {
  id: string;
  exam_room_id: string;
  exam_id: string;
  student_id: string;
  seat_number: string;
  row_label: string | null;
  bench_number: number | null;
  is_special_needs: boolean;
  verification_code: string | null;
}

export interface ExamInvigilatorRow extends Record<string, unknown> {
  id: string;
  exam_id: string;
  exam_room_id: string | null;
  faculty_id: string | null;
  staff_id: string | null;
  duty_role: string;
  reported_at: string | null;
  departed_at: string | null;
  attendance_status: string;
  swapped_from: string | null;
  notes: string | null;
}

export interface QuestionRow extends Record<string, unknown> {
  id: string;
  course_id: string | null;
  course_outcome_id: string | null;
  program_outcome_id: string | null;
  unit: string | null;
  topic: string | null;
  body: string;
  answer_key: string | null;
  marks: number;
  difficulty: string;
  bloom: string;
  question_type: string;
  usage_count: number;
  is_active: boolean;
}

export interface QuestionPaperRow extends Record<string, unknown> {
  id: string;
  exam_id: string | null;
  course_id: string | null;
  title: string;
  code: string | null;
  version: number;
  set_label: string;
  status: string;
  total_marks: number;
  duration_minutes: number;
  blueprint: Record<string, unknown>;
  instructions: string | null;
  is_encrypted: boolean;
  setter_id: string | null;
  approver_id: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  release_at: string | null;
  created_at: string;
}

export interface PaperQuestionRow extends Record<string, unknown> {
  id: string;
  question_paper_id: string;
  question_id: string;
  section_label: string;
  question_number: string | null;
  marks: number;
  is_optional: boolean;
  sort_order: number;
}

export interface MarkRow extends Record<string, unknown> {
  id: string;
  exam_id: string | null;
  assessment_id: string | null;
  student_id: string;
  course_id: string | null;
  component: string;
  max_marks: number;
  marks_obtained: number | null;
  grace_marks: number;
  moderation_delta: number;
  final_marks: number;
  is_absent: boolean;
  is_malpractice: boolean;
  status: string;
  remarks: string | null;
  approved_at: string | null;
  published_at: string | null;
}

export interface MarkEvaluationRow extends Record<string, unknown> {
  id: string;
  mark_id: string;
  evaluator_id: string | null;
  kind: string;
  round: number;
  marks_awarded: number | null;
  is_blind: boolean;
  remarks: string | null;
  evaluated_at: string;
}

export interface RevaluationRow extends Record<string, unknown> {
  id: string;
  exam_id: string;
  student_id: string;
  mark_id: string | null;
  kind: string;
  reason: string;
  status: string;
  fee_amount: number;
  original_marks: number | null;
  revised_marks: number | null;
  reviewed_at: string | null;
  review_notes: string | null;
  payment_status: string;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface ResultRow extends Record<string, unknown> {
  id: string;
  exam_session_id: string | null;
  student_id: string;
  program_id: string | null;
  semester_id: string | null;
  credits_registered: number;
  credits_earned: number;
  total_marks: number;
  max_marks: number;
  percentage: number | null;
  sgpa: number | null;
  cgpa: number | null;
  backlog_count: number;
  rank: number | null;
  class_awarded: string | null;
  is_pass: boolean;
  status: string;
  published_at: string | null;
  remarks: string | null;
  is_frozen: boolean;
  is_locked: boolean;
  frozen_at: string | null;
  locked_at: string | null;
}

export interface ResultCourseRow extends Record<string, unknown> {
  id: string;
  result_id: string;
  course_id: string | null;
  exam_id: string | null;
  credits: number;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  max_marks: number;
  grade: string | null;
  grade_point: number | null;
  is_pass: boolean;
  attempt_number: number;
}

export interface HallTicketRow extends Record<string, unknown> {
  id: string;
  exam_session_id: string;
  student_id: string;
  ticket_number: string;
  verification_code: string;
  issued_at: string;
  valid_until: string | null;
  is_revoked: boolean;
  revoked_reason: string | null;
  payload: Record<string, unknown>;
}

export interface CertificateRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  result_id: string | null;
  exam_session_id: string | null;
  kind: string;
  certificate_number: string;
  verification_code: string;
  issued_on: string;
  signature_ref: string | null;
  is_revoked: boolean;
  payload: Record<string, unknown>;
}

export interface RubricRow extends Record<string, unknown> {
  id: string;
  course_id: string | null;
  name: string;
  description: string | null;
  total_points: number;
  is_active: boolean;
}

export interface RubricCriterionRow extends Record<string, unknown> {
  id: string;
  rubric_id: string;
  course_outcome_id: string | null;
  title: string;
  description: string | null;
  max_points: number;
  sort_order: number;
}

export interface CourseOutcomeRow extends Record<string, unknown> {
  id: string;
  course_id: string;
  code: string;
  description: string;
  bloom_level: string | null;
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export function useAssessmentTypes() {
  return useResourceList<AssessmentTypeRow>({
    table: "assessment_types",
    select:
      "id, key, name, category, description, default_max_marks, default_weightage, passing_percentage, is_internal, is_credit_linked, requires_approval, allows_grace, is_active, sort_order",
    orderBy: { column: "sort_order" },
  });
}

export function useGradingScales() {
  return useResourceList<GradingScaleRow>({
    table: "grading_scales",
    select:
      "id, name, code, program_id, description, max_grade_point, passing_grade_point, is_default, is_active",
    orderBy: { column: "name" },
  });
}

export function useGradeBands() {
  return useResourceList<GradeBandRow>({
    table: "grade_bands",
    select:
      "id, grading_scale_id, grade, min_percentage, max_percentage, grade_point, is_pass, remark, sort_order",
    orderBy: { column: "min_percentage", ascending: false },
  });
}

export function useAssessments() {
  return useResourceList<AssessmentRow>({
    table: "assessments",
    select:
      "id, academic_session_id, semester_id, course_id, section_id, assessment_type_id, faculty_id, rubric_id, title, description, max_marks, weightage, passing_marks, scheduled_on, due_on, status, is_published",
    orderBy: { column: "scheduled_on", ascending: false },
  });
}

export function useExamSessions() {
  return useResourceList<ExamSessionRow>({
    table: "exam_sessions",
    select:
      "id, academic_session_id, semester_id, name, code, category, starts_on, ends_on, registration_opens_on, registration_closes_on, hall_ticket_release_on, result_expected_on, status, instructions",
    orderBy: { column: "starts_on", ascending: false },
  });
}

export function useExams() {
  return useResourceList<ExamRow>({
    table: "exams",
    select:
      "id, exam_session_id, course_id, program_id, semester_id, section_id, assessment_type_id, grading_scale_id, title, exam_date, starts_at, ends_at, duration_minutes, max_marks, passing_marks, internal_weightage, external_weightage, min_attendance_percentage, status, instructions",
    orderBy: { column: "exam_date" },
  });
}

export function useExamRegistrations() {
  return useResourceList<ExamRegistrationRow>({
    table: "exam_registrations",
    select:
      "id, exam_id, student_id, status, attempt_number, is_backlog, attendance_percentage, eligibility_reason, registered_at, fee_hold, hold_reason",
  });
}

export function useExamRooms() {
  return useResourceList<ExamRoomRow>({
    table: "exam_rooms",
    select:
      "id, exam_id, room_id, building_id, seat_capacity, seats_allocated, seat_prefix, notes, floor, block_label, is_special_needs",
  });
}

export function useExamSeats() {
  return useResourceList<ExamSeatRow>({
    table: "exam_seats",
    select:
      "id, exam_room_id, exam_id, student_id, seat_number, row_label, bench_number, is_special_needs, verification_code",
  });
}

export function useExamInvigilators() {
  return useResourceList<ExamInvigilatorRow>({
    table: "exam_invigilators",
    select:
      "id, exam_id, exam_room_id, faculty_id, staff_id, duty_role, reported_at, departed_at, attendance_status, swapped_from, notes",
  });
}

export function useQuestions() {
  return useResourceList<QuestionRow>({
    table: "questions",
    select:
      "id, course_id, course_outcome_id, program_outcome_id, unit, topic, body, answer_key, marks, difficulty, bloom, question_type, usage_count, is_active",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useQuestionPapers() {
  return useResourceList<QuestionPaperRow>({
    table: "question_papers",
    select:
      "id, exam_id, course_id, title, code, version, set_label, status, total_marks, duration_minutes, blueprint, instructions, is_encrypted, setter_id, approver_id, approved_at, rejection_reason, release_at, created_at",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function usePaperQuestions() {
  return useResourceList<PaperQuestionRow>({
    table: "question_paper_questions",
    select:
      "id, question_paper_id, question_id, section_label, question_number, marks, is_optional, sort_order",
    orderBy: { column: "sort_order" },
  });
}

export function useMarks() {
  return useResourceList<MarkRow>({
    table: "marks",
    select:
      "id, exam_id, assessment_id, student_id, course_id, component, max_marks, marks_obtained, grace_marks, moderation_delta, final_marks, is_absent, is_malpractice, status, remarks, approved_at, published_at",
  });
}

export function useMarkEvaluations() {
  return useResourceList<MarkEvaluationRow>({
    table: "mark_evaluations",
    select:
      "id, mark_id, evaluator_id, kind, round, marks_awarded, is_blind, remarks, evaluated_at",
  });
}

export function useRevaluations() {
  return useResourceList<RevaluationRow>({
    table: "revaluation_requests",
    select:
      "id, exam_id, student_id, mark_id, kind, reason, status, fee_amount, original_marks, revised_marks, reviewed_at, review_notes, payment_status, payment_reference, paid_at, created_at",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useResults() {
  return useResourceList<ResultRow>({
    table: "results",
    select:
      "id, exam_session_id, student_id, program_id, semester_id, credits_registered, credits_earned, total_marks, max_marks, percentage, sgpa, cgpa, backlog_count, rank, class_awarded, is_pass, status, published_at, remarks, is_frozen, is_locked, frozen_at, locked_at",
  });
}

export function useResultCourses() {
  return useResourceList<ResultCourseRow>({
    table: "result_courses",
    select:
      "id, result_id, course_id, exam_id, credits, internal_marks, external_marks, total_marks, max_marks, grade, grade_point, is_pass, attempt_number",
  });
}

export function useHallTickets() {
  return useResourceList<HallTicketRow>({
    table: "hall_tickets",
    select:
      "id, exam_session_id, student_id, ticket_number, verification_code, issued_at, valid_until, is_revoked, revoked_reason, payload",
  });
}

export function useCertificates() {
  return useResourceList<CertificateRow>({
    table: "certificates",
    select:
      "id, student_id, result_id, exam_session_id, kind, certificate_number, verification_code, issued_on, signature_ref, is_revoked, payload",
    orderBy: { column: "issued_on", ascending: false },
  });
}

export function useRubrics() {
  return useResourceList<RubricRow>({
    table: "rubrics",
    select: "id, course_id, name, description, total_points, is_active",
    orderBy: { column: "name" },
  });
}

export function useRubricCriteria() {
  return useResourceList<RubricCriterionRow>({
    table: "rubric_criteria",
    select: "id, rubric_id, course_outcome_id, title, description, max_points, sort_order",
    orderBy: { column: "sort_order" },
  });
}

export function useCourseOutcomes() {
  return useResourceList<CourseOutcomeRow>({
    table: "course_outcomes",
    select: "id, course_id, code, description, bloom_level",
    orderBy: { column: "code" },
  });
}

/** Grade bands for a scale, falling back to the shared CBCS defaults. */
export function useEffectiveBands(gradingScaleId?: string | null) {
  const scales = useGradingScales();
  const bands = useGradeBands();

  return useMemo(() => {
    const scale =
      (gradingScaleId ? (scales.data ?? []).find((row) => row.id === gradingScaleId) : null) ??
      (scales.data ?? []).find((row) => row.is_default && row.is_active) ??
      null;
    const rows = (bands.data ?? []).filter((row) => scale && row.grading_scale_id === scale.id);
    return {
      scale,
      bands: rows.length ? (rows as GradeBand[]) : defaultGradeBands,
      loading: scales.isLoading || bands.isLoading,
    };
  }, [scales.data, scales.isLoading, bands.data, bands.isLoading, gradingScaleId]);
}

/* ------------------------------------------------------------------ *
 * Attendance-driven eligibility
 * ------------------------------------------------------------------ */

export interface EligibilityRow {
  studentId: string;
  courseId: string;
  held: number;
  attended: number;
  percentage: number;
}

/** Per-student, per-course attendance percentages computed from live sessions. */
export function useAttendanceEligibility() {
  const sessions = useAttendanceSessions();
  const records = useAttendanceRecords();

  const map = useMemo(() => {
    const byId = new Map((sessions.data ?? []).map((row) => [row.id, row]));
    const totals = new Map<string, EligibilityRow>();
    for (const record of records.data ?? []) {
      if (!record.student_id) continue;
      const session = byId.get(record.attendance_session_id);
      if (!session?.course_id) continue;
      const key = `${record.student_id}:${session.course_id}`;
      const current =
        totals.get(key) ??
        ({
          studentId: record.student_id,
          courseId: session.course_id,
          held: 0,
          attended: 0,
          percentage: 0,
        } satisfies EligibilityRow);
      if (countsAsHeld(record.status, defaultPolicy)) current.held += 1;
      if (countsAsPresent(record.status, defaultPolicy)) current.attended += 1;
      current.percentage = current.held ? round2((current.attended / current.held) * 100) : 0;
      totals.set(key, current);
    }
    return totals;
  }, [sessions.data, records.data]);

  return {
    map,
    loading: sessions.isLoading || records.isLoading,
    get: (studentId: string, courseId: string) => map.get(`${studentId}:${courseId}`) ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Conflict detection
 * ------------------------------------------------------------------ */

export function useExamConflicts() {
  const exams = useExams();
  const registrations = useExamRegistrations();
  const rooms = useExamRooms();
  const invigilators = useExamInvigilators();

  const conflicts = useMemo<ExamConflict[]>(() => {
    const rows = (exams.data ?? []).filter(
      (exam) => exam.exam_date && exam.starts_at && exam.ends_at,
    );
    const found: ExamConflict[] = [];

    const studentsByExam = new Map<string, Set<string>>();
    for (const reg of registrations.data ?? []) {
      if (["cancelled", "ineligible"].includes(reg.status)) continue;
      const set = studentsByExam.get(reg.exam_id) ?? new Set<string>();
      set.add(reg.student_id);
      studentsByExam.set(reg.exam_id, set);
    }
    const backlogByExam = new Map<string, Set<string>>();
    for (const reg of registrations.data ?? []) {
      if (!reg.is_backlog) continue;
      const set = backlogByExam.get(reg.exam_id) ?? new Set<string>();
      set.add(reg.student_id);
      backlogByExam.set(reg.exam_id, set);
    }

    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const a = rows[i]!;
        const b = rows[j]!;
        if (a.exam_date !== b.exam_date) continue;
        if (!timeOverlaps(a.starts_at!, a.ends_at!, b.starts_at!, b.ends_at!)) continue;

        const aStudents = studentsByExam.get(a.id) ?? new Set<string>();
        const bStudents = studentsByExam.get(b.id) ?? new Set<string>();
        const shared = [...aStudents].filter((id) => bStudents.has(id));
        if (shared.length) {
          const backlogShared = shared.filter(
            (id) => backlogByExam.get(a.id)?.has(id) || backlogByExam.get(b.id)?.has(id),
          );
          found.push({
            kind: backlogShared.length ? "backlog" : "student",
            severity: "error",
            message: `${shared.length} student${shared.length > 1 ? "s are" : " is"} scheduled for “${a.title}” and “${b.title}” at the same time${backlogShared.length ? ` (${backlogShared.length} backlog)` : ""}.`,
            examIds: [a.id, b.id],
          });
        }

        const aRooms = (rooms.data ?? []).filter((row) => row.exam_id === a.id && row.room_id);
        const bRooms = (rooms.data ?? []).filter((row) => row.exam_id === b.id && row.room_id);
        const sharedRoom = aRooms.filter((row) =>
          bRooms.some((other) => other.room_id === row.room_id),
        );
        if (sharedRoom.length) {
          found.push({
            kind: "room",
            severity: "error",
            message: `${sharedRoom.length} room${sharedRoom.length > 1 ? "s are" : " is"} double-booked between “${a.title}” and “${b.title}”.`,
            examIds: [a.id, b.id],
          });
        }

        const aStaff = (invigilators.data ?? []).filter((row) => row.exam_id === a.id);
        const bStaff = (invigilators.data ?? []).filter((row) => row.exam_id === b.id);
        const sharedStaff = aStaff.filter((row) =>
          bStaff.some((other) => other.faculty_id && other.faculty_id === row.faculty_id),
        );
        if (sharedStaff.length) {
          found.push({
            kind: "faculty",
            severity: "warning",
            message: `${sharedStaff.length} invigilator${sharedStaff.length > 1 ? "s have" : " has"} overlapping duty in “${a.title}” and “${b.title}”.`,
            examIds: [a.id, b.id],
          });
        }
      }
    }
    return found;
  }, [exams.data, registrations.data, rooms.data, invigilators.data]);

  return {
    conflicts,
    loading:
      exams.isLoading || registrations.isLoading || rooms.isLoading || invigilators.isLoading,
  };
}

/* ------------------------------------------------------------------ *
 * Mutations
 * ------------------------------------------------------------------ */

function useInvalidate() {
  const queryClient = useQueryClient();
  return (tables: string[]) => {
    for (const table of tables) {
      void queryClient.invalidateQueries({ queryKey: ["resource", table] });
    }
  };
}

export interface MarkInput {
  studentId: string;
  marksObtained: number | null;
  graceMarks?: number;
  moderationDelta?: number;
  isAbsent?: boolean;
  isMalpractice?: boolean;
  remarks?: string | null;
  rubricScores?: Record<string, number>;
}

/** Bulk upsert of an exam or internal-assessment marks sheet. */
export function useSaveMarks() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      examId,
      assessmentId,
      courseId,
      component,
      maxMarks,
      status,
      entries,
    }: {
      examId?: string | null;
      assessmentId?: string | null;
      courseId?: string | null;
      component: MarkComponent;
      maxMarks: number;
      status?: string;
      entries: MarkInput[];
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const payload = entries.map((entry) => ({
        tenant_id: tenant.id,
        exam_id: examId ?? null,
        assessment_id: assessmentId ?? null,
        student_id: entry.studentId,
        course_id: courseId ?? null,
        component,
        max_marks: maxMarks,
        marks_obtained: entry.isAbsent ? null : entry.marksObtained,
        grace_marks: entry.graceMarks ?? 0,
        moderation_delta: entry.moderationDelta ?? 0,
        is_absent: entry.isAbsent ?? false,
        is_malpractice: entry.isMalpractice ?? false,
        remarks: entry.remarks ?? null,
        rubric_scores: entry.rubricScores ?? {},
        status: status ?? "draft",
        entered_by: user?.id ?? null,
      }));
      const { error } = await supabase.from("marks").upsert(payload as never, {
        onConflict: assessmentId ? "assessment_id,student_id" : "exam_id,student_id,component",
      });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} mark${count === 1 ? "" : "s"} saved`);
      invalidate(["marks"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Moves a marks sheet through submit → moderation → approval → publication. */
export function useMarkWorkflow() {
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "approved") {
        patch["approved_by"] = user?.id ?? null;
        patch["approved_at"] = new Date().toISOString();
      }
      if (status === "published") patch["published_at"] = new Date().toISOString();
      const { error } = await supabase
        .from("marks")
        .update(patch as never)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, variables) => {
      toast.success(`${count} record${count === 1 ? "" : "s"} ${variables.status}`);
      invalidate(["marks"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Records an evaluation round (first/second/blind/revaluation) against a mark. */
export function useRecordEvaluation() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async (input: {
      markId: string;
      evaluatorId?: string | null;
      kind: string;
      round: number;
      marksAwarded: number | null;
      isBlind?: boolean;
      remarks?: string | null;
      applyToMark?: boolean;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const { error } = await supabase.from("mark_evaluations").upsert(
        {
          tenant_id: tenant.id,
          mark_id: input.markId,
          evaluator_id: input.evaluatorId ?? null,
          kind: input.kind,
          round: input.round,
          marks_awarded: input.marksAwarded,
          is_blind: input.isBlind ?? false,
          remarks: input.remarks ?? null,
        } as never,
        { onConflict: "mark_id,kind,round" },
      );
      if (error) throw error;
      if (input.applyToMark && input.marksAwarded !== null) {
        const { error: markError } = await supabase
          .from("marks")
          .update({ marks_obtained: input.marksAwarded, status: "under_moderation" } as never)
          .eq("id", input.markId);
        if (markError) throw markError;
      }
    },
    onSuccess: () => {
      toast.success("Evaluation recorded");
      invalidate(["mark_evaluations", "marks"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Creates exam registrations from live enrolments, applying attendance eligibility. */
export function useGenerateRegistrations() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      exam,
      candidates,
    }: {
      exam: ExamRow;
      candidates: {
        studentId: string;
        attendancePercentage: number | null;
        isBacklog?: boolean;
        attemptNumber?: number;
      }[];
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const threshold = exam.min_attendance_percentage;
      const payload = candidates.map((candidate) => {
        const eligible = threshold === null || (candidate.attendancePercentage ?? 0) >= threshold;
        return {
          tenant_id: tenant.id,
          exam_id: exam.id,
          student_id: candidate.studentId,
          attempt_number: candidate.attemptNumber ?? 1,
          is_backlog: candidate.isBacklog ?? false,
          attendance_percentage: candidate.attendancePercentage,
          status: eligible ? "eligible" : "ineligible",
          eligibility_reason: eligible
            ? null
            : `Attendance ${candidate.attendancePercentage ?? 0}% is below the required ${threshold}%`,
        };
      });
      const { error } = await supabase
        .from("exam_registrations")
        .upsert(payload as never, { onConflict: "exam_id,student_id,attempt_number" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} registration${count === 1 ? "" : "s"} generated`);
      invalidate(["exam_registrations"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useConfirmRegistrations() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from("exam_registrations")
        .update({
          status,
          registered_at: status === "registered" ? new Date().toISOString() : null,
        } as never)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, variables) => {
      toast.success(`${count} registration${count === 1 ? "" : "s"} ${variables.status}`);
      invalidate(["exam_registrations"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface SeatCandidate {
  studentId: string;
  specialNeeds?: boolean;
}

/**
 * Automatic seating: special-needs candidates are placed first into rooms
 * flagged for them, the remainder fill rooms in roll-number order. Every seat
 * gets a bench number (two per bench) and its own QR/barcode verification code.
 */
export function useAllocateSeats() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      examId,
      rooms,
      candidates,
    }: {
      examId: string;
      rooms: ExamRoomRow[];
      candidates: SeatCandidate[];
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      if (!rooms.length) throw new Error("Add at least one exam room first");
      const capacity = rooms.reduce((sum, room) => sum + room.seat_capacity, 0);
      if (candidates.length > capacity)
        throw new Error(
          `Capacity is ${capacity} seats but ${candidates.length} candidates are registered`,
        );

      const specialRooms = rooms.filter((room) => room.is_special_needs);
      const generalRooms = rooms.filter((room) => !room.is_special_needs);
      const orderedRooms = [...specialRooms, ...generalRooms];
      const special = candidates.filter((row) => row.specialNeeds);
      const general = candidates.filter((row) => !row.specialNeeds);
      const queue = [...special, ...general];

      const seats: Record<string, unknown>[] = [];
      let cursor = 0;
      for (const room of orderedRooms) {
        const slice = queue.slice(cursor, cursor + room.seat_capacity);
        slice.forEach((candidate, index) => {
          seats.push({
            tenant_id: tenant.id,
            exam_room_id: room.id,
            exam_id: examId,
            student_id: candidate.studentId,
            seat_number: `${room.seat_prefix ?? "S"}${String(index + 1).padStart(3, "0")}`,
            row_label: String.fromCharCode(65 + Math.floor(index / 6)),
            bench_number: Math.floor(index / 2) + 1,
            is_special_needs: Boolean(candidate.specialNeeds),
            verification_code: verificationCode(8),
          });
        });
        cursor += slice.length;
      }

      const { error: clearError } = await supabase
        .from("exam_seats")
        .delete()
        .eq("exam_id", examId);
      if (clearError) throw clearError;
      if (seats.length) {
        const { error } = await supabase.from("exam_seats").insert(seats as never);
        if (error) throw error;
      }

      for (const room of rooms) {
        const allocated = seats.filter((seat) => seat["exam_room_id"] === room.id).length;
        const { error: roomError } = await supabase
          .from("exam_rooms")
          .update({ seats_allocated: allocated } as never)
          .eq("id", room.id);
        if (roomError) throw roomError;
      }
      return seats.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} seats allocated`);
      invalidate(["exam_seats", "exam_rooms"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Manual seating overrides — move a candidate to a specific room and seat. */
export function useSeatMutations() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  const assign = useMutation({
    mutationFn: async (input: {
      examId: string;
      examRoomId: string;
      studentId: string;
      seatNumber: string;
      rowLabel?: string | null;
      benchNumber?: number | null;
      specialNeeds?: boolean;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const { error } = await supabase.from("exam_seats").upsert(
        {
          tenant_id: tenant.id,
          exam_id: input.examId,
          exam_room_id: input.examRoomId,
          student_id: input.studentId,
          seat_number: input.seatNumber,
          row_label: input.rowLabel ?? null,
          bench_number: input.benchNumber ?? null,
          is_special_needs: input.specialNeeds ?? false,
          verification_code: verificationCode(8),
        } as never,
        { onConflict: "exam_id,student_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Seat updated");
      invalidate(["exam_seats", "exam_rooms"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clear = useMutation({
    mutationFn: async (examId: string) => {
      const { error } = await supabase.from("exam_seats").delete().eq("exam_id", examId);
      if (error) throw error;
      const { error: roomError } = await supabase
        .from("exam_rooms")
        .update({ seats_allocated: 0 } as never)
        .eq("exam_id", examId);
      if (roomError) throw roomError;
    },
    onSuccess: () => {
      toast.success("Seating cleared");
      invalidate(["exam_seats", "exam_rooms"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { assign, clear };
}

/** Invigilation duty roster: allocate, swap, release and record duty attendance. */
export function useInvigilationMutations() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  const assign = useMutation({
    mutationFn: async (input: {
      examId: string;
      examRoomId: string | null;
      facultyId: string | null;
      staffId?: string | null;
      dutyRole: string;
      notes?: string | null;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const { error } = await supabase.from("exam_invigilators").insert({
        tenant_id: tenant.id,
        exam_id: input.examId,
        exam_room_id: input.examRoomId,
        faculty_id: input.facultyId,
        staff_id: input.staffId ?? null,
        duty_role: input.dutyRole,
        notes: input.notes ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Duty allocated");
      invalidate(["exam_invigilators"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const swap = useMutation({
    mutationFn: async ({ id, facultyId }: { id: string; facultyId: string }) => {
      const { error } = await supabase
        .from("exam_invigilators")
        .update({ faculty_id: facultyId, swapped_from: id, attendance_status: "pending" } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Duty swapped");
      invalidate(["exam_invigilators"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const attendance = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("exam_invigilators")
        .update({
          attendance_status: status,
          reported_at: status === "reported" ? now : null,
          departed_at: status === "completed" ? now : null,
        } as never)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} duty record${count === 1 ? "" : "s"} updated`);
      invalidate(["exam_invigilators"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const release = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("exam_invigilators")
        .update({ deleted_at: new Date().toISOString() } as never)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Duty released");
      invalidate(["exam_invigilators"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { assign, swap, attendance, release };
}

/** Fee / attendance holds applied to a candidate before the hall ticket is issued. */
export function useRegistrationHolds() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      ids,
      feeHold,
      reason,
    }: {
      ids: string[];
      feeHold: boolean;
      reason?: string | null;
    }) => {
      const { error } = await supabase
        .from("exam_registrations")
        .update({
          fee_hold: feeHold,
          hold_reason: feeHold ? (reason ?? "Outstanding examination fee") : null,
          status: feeHold ? "withheld" : "eligible",
        } as never)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, variables) => {
      toast.success(
        `${count} candidate${count === 1 ? "" : "s"} ${variables.feeHold ? "held" : "released"}`,
      );
      invalidate(["exam_registrations"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Revoke or restore issued hall tickets. */
export function useHallTicketMutations() {
  const invalidate = useInvalidate();

  const revoke = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string | null }) => {
      const { error } = await supabase
        .from("hall_tickets")
        .update({ is_revoked: Boolean(reason), revoked_reason: reason } as never)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} hall ticket${count === 1 ? "" : "s"} updated`);
      invalidate(["hall_tickets"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { revoke };
}

/** Result freeze, lock, withhold and publication controls. */
export function useResultControls() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      ids,
      action,
      remarks,
    }: {
      ids: string[];
      action: "freeze" | "unfreeze" | "lock" | "unlock" | "withhold" | "publish" | "approve";
      remarks?: string | null;
    }) => {
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = {};
      if (action === "freeze") Object.assign(patch, { is_frozen: true, frozen_at: now });
      if (action === "unfreeze") Object.assign(patch, { is_frozen: false, frozen_at: null });
      if (action === "lock") Object.assign(patch, { is_locked: true, locked_at: now });
      if (action === "unlock") Object.assign(patch, { is_locked: false, locked_at: null });
      if (action === "withhold")
        Object.assign(patch, { status: "withheld", remarks: remarks ?? null });
      if (action === "approve") Object.assign(patch, { status: "approved", approved_at: now });
      if (action === "publish")
        Object.assign(patch, { status: "published", published_at: now, is_frozen: true });
      const { error } = await supabase
        .from("results")
        .update(patch as never)
        .in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, variables) => {
      toast.success(`${count} result${count === 1 ? "" : "s"} ${variables.action}d`);
      invalidate(["results"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Records the revaluation fee payment before the request enters review. */
export function useRevaluationPayment() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({ id, reference }: { id: string; reference: string }) => {
      const { error } = await supabase
        .from("revaluation_requests")
        .update({
          payment_status: "paid",
          payment_reference: reference,
          paid_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      invalidate(["revaluation_requests"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Timed release of an approved question paper. */
export function usePaperRelease() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({ id, releaseAt }: { id: string; releaseAt: string | null }) => {
      const { error } = await supabase
        .from("question_papers")
        .update({ release_at: releaseAt } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Release window updated");
      invalidate(["question_papers"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Applies moderation, grace, scaling or normalisation across a marks sheet. */
export function useMarkAdjustments() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      rows,
    }: {
      rows: { id: string; graceMarks?: number; moderationDelta?: number }[];
    }) => {
      for (const row of rows) {
        const patch: Record<string, unknown> = { status: "under_moderation" };
        if (row.graceMarks !== undefined) patch["grace_marks"] = row.graceMarks;
        if (row.moderationDelta !== undefined) patch["moderation_delta"] = row.moderationDelta;
        const { error } = await supabase
          .from("marks")
          .update(patch as never)
          .eq("id", row.id);
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} record${count === 1 ? "" : "s"} adjusted`);
      invalidate(["marks"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Public verification of a hall ticket or certificate code. */
export function useVerification(code: string) {
  return useQuery({
    queryKey: ["exam-verification", code],
    enabled: code.trim().length >= 6,
    queryFn: async () => {
      const trimmed = code.trim().toUpperCase();
      const [ticket, certificate] = await Promise.all([
        supabase
          .from("hall_tickets")
          .select("ticket_number, verification_code, issued_at, valid_until, is_revoked, payload")
          .eq("verification_code", trimmed)
          .maybeSingle(),
        supabase
          .from("certificates")
          .select("certificate_number, verification_code, kind, issued_on, is_revoked, payload")
          .eq("verification_code", trimmed)
          .maybeSingle(),
      ]);
      if (ticket.error) throw ticket.error;
      if (certificate.error) throw certificate.error;
      return { ticket: ticket.data, certificate: certificate.data };
    },
  });
}

/** Issues hall tickets with verification codes for the selected students. */
export function useGenerateHallTickets() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      session,
      students,
      existing,
    }: {
      session: ExamSessionRow;
      students: { id: string; roll: string | null; name: string; exams: string[] }[];
      existing: HallTicketRow[];
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const numbers = existing.map((row) => row.ticket_number);
      const payload = students.map((student, index) => {
        const number = sequentialNumber(`HT-${session.code}-`, [
          ...numbers,
          ...Array.from({ length: index }, (_unused, i) => `HT-${session.code}-${i}`),
        ]);
        numbers.push(number);
        return {
          tenant_id: tenant.id,
          exam_session_id: session.id,
          student_id: student.id,
          ticket_number: number,
          verification_code: verificationCode(),
          valid_until: session.ends_on,
          payload: {
            student_name: student.name,
            roll_number: student.roll,
            exams: student.exams,
            session: session.name,
          },
        };
      });
      const { error } = await supabase
        .from("hall_tickets")
        .upsert(payload as never, { onConflict: "exam_session_id,student_id" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} hall ticket${count === 1 ? "" : "s"} issued`);
      invalidate(["hall_tickets"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface ComputedCourseResult {
  courseId: string;
  examId: string | null;
  credits: number;
  internal: number;
  external: number;
  total: number;
  max: number;
  grade: string;
  gradePoint: number;
  isPass: boolean;
}

export interface ComputedResult {
  studentId: string;
  programId: string | null;
  semesterId: string | null;
  courses: ComputedCourseResult[];
  total: number;
  max: number;
  percent: number;
  sgpa: number;
  creditsRegistered: number;
  creditsEarned: number;
  backlogs: number;
  isPass: boolean;
}

/** Pure computation of semester results from live marks; used by preview and publish. */
export function computeResults({
  exams,
  marks,
  courseCredits,
  students,
  bands,
}: {
  exams: ExamRow[];
  marks: MarkRow[];
  courseCredits: Map<string, number>;
  students: { id: string; program_id: string | null }[];
  bands: GradeBand[];
}): ComputedResult[] {
  const examById = new Map(exams.map((exam) => [exam.id, exam]));
  const byStudent = new Map<string, MarkRow[]>();
  for (const mark of marks) {
    if (!mark.exam_id || !examById.has(mark.exam_id)) continue;
    const list = byStudent.get(mark.student_id) ?? [];
    list.push(mark);
    byStudent.set(mark.student_id, list);
  }

  const results: ComputedResult[] = [];
  for (const [studentId, rows] of byStudent) {
    const byExam = new Map<string, MarkRow[]>();
    for (const row of rows) {
      const list = byExam.get(row.exam_id!) ?? [];
      list.push(row);
      byExam.set(row.exam_id!, list);
    }

    const courses: ComputedCourseResult[] = [];
    for (const [examId, examMarks] of byExam) {
      const exam = examById.get(examId)!;
      const internal = examMarks
        .filter((row) => row.component !== "external")
        .reduce((sum, row) => sum + Number(row.final_marks ?? 0), 0);
      const external = examMarks
        .filter((row) => row.component === "external")
        .reduce((sum, row) => sum + Number(row.final_marks ?? 0), 0);
      const total = round2(internal + external);
      const max = Number(exam.max_marks) || 100;
      const percent = percentage(total, max);
      const band = gradeFor(percent, bands);
      const credits = courseCredits.get(exam.course_id ?? "") ?? 0;
      const absent = examMarks.some((row) => row.is_absent || row.is_malpractice);
      const isPass = !absent && band.is_pass && total >= Number(exam.passing_marks ?? 0);
      courses.push({
        courseId: exam.course_id ?? "",
        examId,
        credits,
        internal: round2(internal),
        external: round2(external),
        total,
        max,
        grade: isPass ? band.grade : "F",
        gradePoint: isPass ? band.grade_point : 0,
        isPass,
      });
    }

    const total = round2(courses.reduce((sum, row) => sum + row.total, 0));
    const max = round2(courses.reduce((sum, row) => sum + row.max, 0));
    const gradeInputs = courses.map((row) => ({
      credits: row.credits,
      gradePoint: row.gradePoint,
      isPass: row.isPass,
    }));
    const student = students.find((row) => row.id === studentId);
    const exam = examById.get(courses[0]?.examId ?? "");
    results.push({
      studentId,
      programId: student?.program_id ?? exam?.program_id ?? null,
      semesterId: exam?.semester_id ?? null,
      courses,
      total,
      max,
      percent: percentage(total, max),
      sgpa: computeSgpa(gradeInputs),
      creditsRegistered: round2(courses.reduce((sum, row) => sum + row.credits, 0)),
      creditsEarned: creditsEarned(gradeInputs),
      backlogs: courses.filter((row) => !row.isPass).length,
      isPass: courses.every((row) => row.isPass),
    });
  }

  return results;
}

/** Persists computed results plus per-subject grade rows with merit ranking. */
export function usePublishResults() {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      examSessionId,
      gradingScaleId,
      results,
      status,
      priorSemesters,
    }: {
      examSessionId: string;
      gradingScaleId: string | null;
      results: ComputedResult[];
      status: "draft" | "provisional" | "approved" | "published";
      priorSemesters?: Map<string, { credits: number; sgpa: number }[]>;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      if (!results.length) throw new Error("Nothing to publish — compute results first");
      const ranks = rankRows(results, (row) => row.percent);

      const payload = results.map((row) => {
        const history = [
          ...(priorSemesters?.get(row.studentId) ?? []),
          { credits: row.creditsRegistered, sgpa: row.sgpa },
        ];
        const totalCredits = history.reduce((sum, item) => sum + item.credits, 0);
        const cgpa = totalCredits
          ? round2(history.reduce((sum, item) => sum + item.credits * item.sgpa, 0) / totalCredits)
          : row.sgpa;
        return {
          tenant_id: tenant.id,
          exam_session_id: examSessionId,
          student_id: row.studentId,
          program_id: row.programId,
          semester_id: row.semesterId,
          grading_scale_id: gradingScaleId,
          credits_registered: row.creditsRegistered,
          credits_earned: row.creditsEarned,
          total_marks: row.total,
          max_marks: row.max,
          percentage: row.percent,
          sgpa: row.sgpa,
          cgpa,
          backlog_count: row.backlogs,
          rank: ranks.get(row) ?? null,
          class_awarded: classAward(row.percent),
          is_pass: row.isPass,
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
          approved_by: ["approved", "published"].includes(status) ? (user?.id ?? null) : null,
          approved_at: ["approved", "published"].includes(status) ? new Date().toISOString() : null,
        };
      });

      const { data, error } = await supabase
        .from("results")
        .upsert(payload as never, { onConflict: "exam_session_id,student_id" })
        .select("id, student_id");
      if (error) throw error;

      const idByStudent = new Map(
        ((data ?? []) as { id: string; student_id: string }[]).map((row) => [
          row.student_id,
          row.id,
        ]),
      );
      const courseRows = results.flatMap((row) => {
        const resultId = idByStudent.get(row.studentId);
        if (!resultId) return [];
        return row.courses.map((course) => ({
          tenant_id: tenant.id,
          result_id: resultId,
          course_id: course.courseId || null,
          exam_id: course.examId,
          credits: course.credits,
          internal_marks: course.internal,
          external_marks: course.external,
          total_marks: course.total,
          max_marks: course.max,
          grade: course.grade,
          grade_point: course.gradePoint,
          is_pass: course.isPass,
        }));
      });
      if (courseRows.length) {
        const { error: courseError } = await supabase
          .from("result_courses")
          .upsert(courseRows as never, { onConflict: "result_id,course_id" });
        if (courseError) throw courseError;
      }
      return payload.length;
    },
    onSuccess: (count, variables) => {
      toast.success(`${count} result${count === 1 ? "" : "s"} ${variables.status}`);
      invalidate(["results", "result_courses"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Issues grade cards, marksheets or transcripts with verification codes. */
export function useIssueCertificates() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      kind,
      rows,
      existing,
    }: {
      kind: string;
      rows: {
        studentId: string;
        resultId: string | null;
        examSessionId: string | null;
        payload: Record<string, unknown>;
      }[];
      existing: CertificateRow[];
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const numbers = existing.map((row) => row.certificate_number);
      const prefix = `${kind.toUpperCase().slice(0, 2)}-`;
      const payload = rows.map((row) => {
        const number = sequentialNumber(prefix, numbers, 6);
        numbers.push(number);
        return {
          tenant_id: tenant.id,
          student_id: row.studentId,
          result_id: row.resultId,
          exam_session_id: row.examSessionId,
          kind,
          certificate_number: number,
          verification_code: verificationCode(12),
          payload: row.payload,
        };
      });
      const { error } = await supabase.from("certificates").insert(payload as never);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} certificate${count === 1 ? "" : "s"} issued`);
      invalidate(["certificates"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Approve or reject revaluation / challenge requests and post the revised mark. */
export function useReviewRevaluation() {
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      revisedMarks,
      notes,
      markId,
    }: {
      id: string;
      status: "approved" | "rejected" | "cancelled";
      revisedMarks?: number | null;
      notes?: string;
      markId?: string | null;
    }) => {
      const { error } = await supabase
        .from("revaluation_requests")
        .update({
          status,
          revised_marks: revisedMarks ?? null,
          review_notes: notes ?? null,
          reviewer_id: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
      if (status === "approved" && markId && revisedMarks !== null && revisedMarks !== undefined) {
        const { error: markError } = await supabase
          .from("marks")
          .update({ marks_obtained: revisedMarks, status: "under_moderation" } as never)
          .eq("id", markId);
        if (markError) throw markError;
      }
    },
    onSuccess: () => {
      toast.success("Request reviewed");
      invalidate(["revaluation_requests", "marks"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Student-facing request for revaluation, challenge, retotal or a photocopy. */
export function useRequestRevaluation() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async (input: {
      examId: string;
      studentId: string;
      markId: string | null;
      kind: string;
      reason: string;
      originalMarks: number | null;
      feeAmount?: number;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const { error } = await supabase.from("revaluation_requests").insert({
        tenant_id: tenant.id,
        exam_id: input.examId,
        student_id: input.studentId,
        mark_id: input.markId,
        kind: input.kind,
        reason: input.reason,
        original_marks: input.originalMarks,
        fee_amount: input.feeAmount ?? 0,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request submitted");
      invalidate(["revaluation_requests"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Approve / reject a question paper, keeping the version history intact. */
export function usePaperWorkflow() {
  const { user } = useAuth();
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { error } = await supabase
        .from("question_papers")
        .update({
          status,
          approver_id: ["approved", "rejected"].includes(status) ? (user?.id ?? null) : null,
          approved_at: status === "approved" ? new Date().toISOString() : null,
          rejection_reason: status === "rejected" ? (reason ?? null) : null,
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question paper updated");
      invalidate(["question_papers"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/** Attach or detach questions on a paper. */
export function usePaperQuestionMutations() {
  const { tenant } = useAccess();
  const invalidate = useInvalidate();

  const add = useMutation({
    mutationFn: async ({
      paperId,
      questions,
      sectionLabel,
    }: {
      paperId: string;
      questions: QuestionRow[];
      sectionLabel: string;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const payload = questions.map((question, index) => ({
        tenant_id: tenant.id,
        question_paper_id: paperId,
        question_id: question.id,
        section_label: sectionLabel,
        marks: question.marks,
        sort_order: index,
      }));
      const { error } = await supabase
        .from("question_paper_questions")
        .upsert(payload as never, { onConflict: "question_paper_id,question_id" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} question${count === 1 ? "" : "s"} added`);
      invalidate(["question_paper_questions"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("question_paper_questions").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question removed");
      invalidate(["question_paper_questions"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { add, remove };
}

/** Live counts powering the examination control tower. */
export function useExamOverview() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["exam-overview", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const tables = [
        "exam_sessions",
        "exams",
        "exam_registrations",
        "question_papers",
        "marks",
        "results",
        "hall_tickets",
        "revaluation_requests",
        "certificates",
      ];
      const entries = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table as never)
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id)
            .is("deleted_at", null);
          if (error) throw error;
          return [table, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });
}

/** Fan-out through the notification engine (in-app) for exam events. */
export function useExamNotify() {
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async ({
      recipientIds,
      title,
      body,
      actionUrl,
      eventKey,
      priority = "normal",
    }: {
      recipientIds: string[];
      title: string;
      body: string;
      actionUrl?: string;
      eventKey: string;
      priority?: string;
    }) => {
      if (!tenant?.id) throw new Error("No active institution");
      const unique = [...new Set(recipientIds.filter(Boolean))];
      if (!unique.length) return 0;
      const { error } = await supabase.from("notifications").insert(
        unique.map((recipient) => ({
          tenant_id: tenant.id,
          recipient_id: recipient,
          title,
          body,
          action_url: actionUrl ?? null,
          event_key: eventKey,
          priority,
        })) as never,
      );
      if (error) throw error;
      return unique.length;
    },
    onSuccess: (count) => {
      if (count) toast.success(`${count} notification${count === 1 ? "" : "s"} sent`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
