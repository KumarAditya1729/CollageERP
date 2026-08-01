import { useQuery } from "@tanstack/react-query";

import { useAccess } from "@/hooks/useAccess";
import { useResourceList } from "@/hooks/useResource";
import { supabase } from "@/integrations/supabase/client";

export interface Lookup extends Record<string, unknown> {
  id: string;
  name: string;
  code?: string | null;
}

export const curriculumStatuses = [
  "draft",
  "pending_approval",
  "active",
  "superseded",
  "archived",
] as const;

export const curriculumCategories = [
  "core",
  "elective",
  "open_elective",
  "lab",
  "project",
  "internship",
  "skill",
  "value_added",
  "audit",
  "mandatory_non_credit",
] as const;

export const roomTypes = [
  "classroom",
  "lab",
  "seminar_hall",
  "auditorium",
  "library",
  "office",
  "other",
] as const;

export const allocationRoles = ["lead", "co_faculty", "lab_instructor", "tutor", "guest"] as const;

export const specializationKinds = ["major", "minor", "specialization", "honours"] as const;

export const weekdays = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export function labelize(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Shared read-only lookups used across the academic management screens. */
export function useAcademicLookups() {
  const departments = useResourceList<Lookup>({
    table: "departments",
    select: "id, name, code",
    orderBy: { column: "name" },
  });
  const programs = useResourceList<
    Lookup & { department_id: string | null; total_semesters: number }
  >({
    table: "programs",
    select: "id, name, code, department_id, total_semesters",
    orderBy: { column: "name" },
  });
  const semesters = useResourceList<Lookup & { program_id: string | null; number: number }>({
    table: "semesters",
    select: "id, name, program_id, number",
    orderBy: { column: "number" },
  });
  const courses = useResourceList<
    Lookup & {
      title: string;
      credits: number | null;
      department_id: string | null;
      program_id: string | null;
    }
  >({
    table: "courses",
    select: "id, code, title, credits, department_id, program_id",
    orderBy: { column: "code" },
  });
  const faculty = useResourceList<{
    id: string;
    first_name: string;
    last_name: string | null;
    employee_code: string | null;
    department_id: string | null;
  }>({
    table: "faculty",
    select: "id, first_name, last_name, employee_code, department_id",
    orderBy: { column: "first_name" },
  });
  const sections = useResourceList<Lookup & { program_id: string | null; batch_id: string | null }>(
    {
      table: "sections",
      select: "id, name, code, program_id, batch_id",
      orderBy: { column: "name" },
    },
  );
  const batches = useResourceList<Lookup & { program_id: string | null }>({
    table: "batches",
    select: "id, name, code, program_id",
    orderBy: { column: "name" },
  });
  const academicYears = useResourceList<Lookup & { is_current: boolean }>({
    table: "academic_years",
    select: "id, name, is_current",
    orderBy: { column: "name", ascending: false },
  });
  const academicSessions = useResourceList<Lookup & { academic_year_id: string }>({
    table: "academic_sessions",
    select: "id, name, academic_year_id",
    orderBy: { column: "name" },
  });
  const buildings = useResourceList<Lookup>({
    table: "buildings",
    select: "id, name, code",
    orderBy: { column: "name" },
  });
  const curricula = useResourceList<
    Lookup & { program_id: string; version: string; status: string }
  >({
    table: "curricula",
    select: "id, name, version, program_id, status",
    orderBy: { column: "name" },
  });

  return {
    departments,
    programs,
    semesters,
    courses,
    faculty,
    sections,
    batches,
    academicYears,
    academicSessions,
    buildings,
    curricula,
  };
}

export function facultyName(row: { first_name: string; last_name?: string | null }) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ");
}

export function optionsFrom(rows: Lookup[] | undefined, withCode = true) {
  return (rows ?? []).map((row) => ({
    value: row.id,
    label: withCode && row.code ? `${row.code} — ${row.name}` : row.name,
  }));
}

interface CountSpec {
  key: string;
  table: string;
}

const overviewTables: CountSpec[] = [
  { key: "departments", table: "departments" },
  { key: "programs", table: "programs" },
  { key: "courses", table: "courses" },
  { key: "curricula", table: "curricula" },
  { key: "sections", table: "sections" },
  { key: "batches", table: "batches" },
  { key: "students", table: "students" },
  { key: "faculty", table: "faculty" },
  { key: "allocations", table: "faculty_allocations" },
  { key: "rooms", table: "rooms" },
  { key: "enrollments", table: "enrollments" },
];

/** Live counts for the academic dashboards. */
export function useAcademicOverview() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["academic-overview", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const entries = await Promise.all(
        overviewTables.map(async ({ key, table }) => {
          const { count, error } = await supabase
            .from(table as never)
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id)
            .is("deleted_at", null);
          if (error) throw error;
          return [key, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });
}

export interface AllocationRow extends Record<string, unknown> {
  id: string;
  faculty_id: string;
  course_id: string;
  section_id: string | null;
  semester_id: string | null;
  academic_session_id: string | null;
  role: string;
  hours_per_week: number;
  is_active: boolean;
}

/** Aggregated teaching load per faculty member. */
export function useFacultyWorkload() {
  const allocations = useResourceList<AllocationRow>({
    table: "faculty_allocations",
    select:
      "id, faculty_id, course_id, section_id, semester_id, academic_session_id, role, hours_per_week, is_active",
  });

  return allocations;
}

/* ------------------------------------------------------------------ *
 * Shared record hooks for the academic dashboards, credit engine,
 * workload analytics and scheduling foundation. Every hook reads live
 * tenant-scoped rows through the shared resource layer.
 * ------------------------------------------------------------------ */

export interface CourseCatalogRow extends Record<string, unknown> {
  id: string;
  code: string;
  title: string;
  type: string;
  credits: number | null;
  lecture_hours: number | null;
  tutorial_hours: number | null;
  practical_hours: number | null;
  department_id: string | null;
  program_id: string | null;
  semester_id: string | null;
  is_active: boolean;
}

export function useCourseCatalog() {
  return useResourceList<CourseCatalogRow>({
    table: "courses",
    select:
      "id, code, title, type, credits, lecture_hours, tutorial_hours, practical_hours, department_id, program_id, semester_id, is_active",
    orderBy: { column: "code" },
  });
}

export interface EnrollmentRecord extends Record<string, unknown> {
  id: string;
  student_id: string;
  course_id: string;
  semester_id: string | null;
  section_id: string | null;
  academic_session_id: string | null;
  status: string;
  grade: string | null;
  enrolled_at: string | null;
}

export function useEnrollmentRecords() {
  return useResourceList<EnrollmentRecord>({
    table: "enrollments",
    select:
      "id, student_id, course_id, semester_id, section_id, academic_session_id, status, grade, enrolled_at",
  });
}

export interface StudentRecord extends Record<string, unknown> {
  id: string;
  first_name: string;
  last_name: string | null;
  roll_number: string | null;
  status: string;
  department_id: string | null;
  program_id: string | null;
  section_id: string | null;
  batch_id: string | null;
  created_at: string | null;
}

export function useStudentRecords() {
  return useResourceList<StudentRecord>({
    table: "students",
    select:
      "id, first_name, last_name, roll_number, status, department_id, program_id, section_id, batch_id, created_at",
    orderBy: { column: "first_name" },
  });
}

export function studentLabel(row: { first_name: string; last_name?: string | null }) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ");
}

export interface CurriculumCourseRecord extends Record<string, unknown> {
  id: string;
  curriculum_id: string;
  course_id: string;
  semester_number: number;
  category: string;
  credits: number | null;
  is_mandatory: boolean;
}

export function useCurriculumCourses() {
  return useResourceList<CurriculumCourseRecord>({
    table: "curriculum_courses",
    select: "id, curriculum_id, course_id, semester_number, category, credits, is_mandatory",
    orderBy: { column: "semester_number" },
  });
}

export interface CurriculumRecord extends Record<string, unknown> {
  id: string;
  name: string;
  version: string;
  program_id: string;
  regulation: string | null;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
  total_credits: number | null;
}

export function useCurriculumRecords() {
  return useResourceList<CurriculumRecord>({
    table: "curricula",
    select:
      "id, name, version, program_id, regulation, status, effective_from, effective_to, total_credits",
    orderBy: { column: "name" },
  });
}

export interface PrerequisiteRecord extends Record<string, unknown> {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  kind: string;
}

export function usePrerequisites() {
  return useResourceList<PrerequisiteRecord>({
    table: "course_prerequisites",
    select: "id, course_id, prerequisite_course_id, kind",
  });
}

export function useProgramOutcomes() {
  return useResourceList<{
    id: string;
    program_id: string;
    code: string;
    description: string;
    is_pso: boolean;
  }>({
    table: "program_outcomes",
    select: "id, program_id, code, description, is_pso",
    orderBy: { column: "code" },
  });
}

export function useRooms() {
  return useResourceList<{
    id: string;
    name: string;
    code: string;
    room_type: string;
    capacity: number | null;
    floor: number | null;
    equipment: string | null;
    is_available: boolean;
    building_id: string | null;
    department_id: string | null;
  }>({
    table: "rooms",
    select:
      "id, name, code, room_type, capacity, floor, equipment, is_available, building_id, department_id",
    orderBy: { column: "name" },
    campusScoped: true,
  });
}

export function useTimeSlots() {
  return useResourceList<{
    id: string;
    name: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    slot_order: number;
    is_break: boolean;
    is_active: boolean;
  }>({
    table: "time_slots",
    select: "id, name, day_of_week, start_time, end_time, slot_order, is_break, is_active",
    orderBy: { column: "slot_order" },
    campusScoped: true,
  });
}

export type WorkloadKind = "theory" | "lab" | "tutorial" | "project";

/** Classifies an allocation into a teaching-hour bucket using the subject's L-T-P shape. */
export function workloadKind(
  role: string,
  course?: { type?: string; practical_hours?: number | null; tutorial_hours?: number | null },
): WorkloadKind {
  if (role === "lab_instructor") return "lab";
  if (role === "tutor") return "tutorial";
  if (course?.type === "lab") return "lab";
  if (course?.type === "project" || course?.type === "internship") return "project";
  if (course?.type === "audit" && (course?.tutorial_hours ?? 0) > 0) return "tutorial";
  return "theory";
}

export const MAX_WEEKLY_HOURS = 18;

export interface AcademicConflict {
  id: string;
  kind: "faculty" | "section" | "room" | "slot";
  severity: "high" | "medium";
  title: string;
  detail: string;
}

/** Detects the scheduling conflicts that can be derived before timetable generation. */
export function useAcademicConflicts() {
  const allocations = useFacultyWorkload();
  const courses = useCourseCatalog();
  const rooms = useRooms();
  const slots = useTimeSlots();
  const { faculty, sections } = useAcademicLookups();

  const loading =
    allocations.isLoading ||
    courses.isLoading ||
    rooms.isLoading ||
    slots.isLoading ||
    sections.isLoading;

  const conflicts: AcademicConflict[] = [];
  const active = (allocations.data ?? []).filter((row) => row.is_active);

  // Faculty conflicts — overload and duplicate assignments.
  const perFaculty = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const row of active) {
    perFaculty.set(
      row.faculty_id,
      (perFaculty.get(row.faculty_id) ?? 0) + Number(row.hours_per_week ?? 0),
    );
    const key = `${row.faculty_id}|${row.course_id}|${row.section_id ?? "-"}|${row.semester_id ?? "-"}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const [id, hours] of perFaculty) {
    if (hours > MAX_WEEKLY_HOURS) {
      const member = faculty.data?.find((f) => f.id === id);
      conflicts.push({
        id: `faculty-load-${id}`,
        kind: "faculty",
        severity: "high",
        title: `${member ? facultyName(member) : "Faculty"} is over the weekly limit`,
        detail: `${hours} hours allocated against a ${MAX_WEEKLY_HOURS} hour weekly ceiling.`,
      });
    }
  }
  for (const [key, count] of seen) {
    if (count > 1) {
      const [facultyId, courseId] = key.split("|");
      const member = faculty.data?.find((f) => f.id === facultyId);
      const course = courses.data?.find((c) => c.id === courseId);
      conflicts.push({
        id: `faculty-duplicate-${key}`,
        kind: "faculty",
        severity: "medium",
        title: `Duplicate allocation for ${member ? facultyName(member) : "faculty"}`,
        detail: `${course ? `${course.code} — ${course.title}` : "This subject"} is allocated ${count} times for the same section and semester.`,
      });
    }
  }

  // Section conflicts — more than one lead faculty for the same subject in a section.
  const leads = new Map<string, number>();
  for (const row of active) {
    if (row.role !== "lead" || !row.section_id) continue;
    const key = `${row.section_id}|${row.course_id}`;
    leads.set(key, (leads.get(key) ?? 0) + 1);
  }
  for (const [key, count] of leads) {
    if (count > 1) {
      const [sectionId, courseId] = key.split("|");
      const section = sections.data?.find((s) => s.id === sectionId);
      const course = courses.data?.find((c) => c.id === courseId);
      conflicts.push({
        id: `section-lead-${key}`,
        kind: "section",
        severity: "high",
        title: `Section ${section?.name ?? "unknown"} has ${count} lead faculty`,
        detail: `${course ? `${course.code} — ${course.title}` : "A subject"} must have exactly one lead per section.`,
      });
    }
  }

  // Room conflicts — sections that no available room can seat.
  const availableRooms = (rooms.data ?? []).filter((room) => room.is_available);
  const largest = Math.max(0, ...availableRooms.map((room) => Number(room.capacity ?? 0)));
  for (const section of sections.data ?? []) {
    const capacity = Number((section as { capacity?: number | null }).capacity ?? 0);
    if (capacity > 0 && largest > 0 && capacity > largest) {
      conflicts.push({
        id: `room-capacity-${section.id}`,
        kind: "room",
        severity: "medium",
        title: `No room can seat section ${section.name}`,
        detail: `Section capacity ${capacity} exceeds the largest available room (${largest} seats).`,
      });
    }
  }

  // Slot conflicts — overlapping active periods on the same working day.
  const activeSlots = (slots.data ?? []).filter((slot) => slot.is_active);
  for (let i = 0; i < activeSlots.length; i += 1) {
    for (let j = i + 1; j < activeSlots.length; j += 1) {
      const a = activeSlots[i];
      const b = activeSlots[j];
      if (a.day_of_week !== b.day_of_week) continue;
      if (a.start_time < b.end_time && b.start_time < a.end_time) {
        conflicts.push({
          id: `slot-${a.id}-${b.id}`,
          kind: "slot",
          severity: "medium",
          title: `Periods overlap on ${weekdays.find((d) => d.value === String(a.day_of_week))?.label ?? "a working day"}`,
          detail: `${a.name} (${a.start_time}–${a.end_time}) overlaps ${b.name} (${b.start_time}–${b.end_time}).`,
        });
      }
    }
  }

  return { conflicts, loading };
}
