import { supabase } from "@/integrations/supabase/client";

export const STUDENT_STATUSES = [
  "applicant",
  "enrolled",
  "on_leave",
  "graduated",
  "dropped",
  "suspended",
  "transferred",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const GENDERS = ["male", "female", "other", "undisclosed"] as const;

export const statusTone: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  enrolled: "default",
  applicant: "secondary",
  graduated: "outline",
  on_leave: "secondary",
  dropped: "destructive",
  suspended: "destructive",
  transferred: "outline",
};

export function humanise(value: string | null | undefined) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export interface StudentRecord extends Record<string, unknown> {
  id: string;
  tenant_id?: string;
  campus_id: string | null;
  department_id: string | null;
  program_id: string | null;
  current_semester_id: string | null;
  academic_year_id: string | null;
  user_id: string | null;
  admission_number: string;
  roll_number: string | null;
  registration_number: string | null;
  abc_id: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  blood_group_id: string | null;
  religion_id: string | null;
  caste_id: string | null;
  category_id: string | null;
  nationality_id: string | null;
  status: string;
  admission_date: string | null;
  graduation_date: string | null;
  photo_url: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  emergency_contact: string | null;
  address: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export const STUDENT_SELECT =
  "id, campus_id, department_id, program_id, current_semester_id, academic_year_id, user_id, admission_number, roll_number, registration_number, abc_id, first_name, middle_name, last_name, email, phone, gender, date_of_birth, blood_group_id, religion_id, caste_id, category_id, nationality_id, status, admission_date, graduation_date, photo_url, father_name, mother_name, guardian_name, guardian_phone, guardian_email, emergency_contact, address, metadata, created_at, updated_at, deleted_at";

export function studentName(row: Pick<StudentRecord, "first_name" | "middle_name" | "last_name">) {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ");
}

export function initials(row: Pick<StudentRecord, "first_name" | "last_name">) {
  return `${row.first_name?.[0] ?? ""}${row.last_name?.[0] ?? ""}`.toUpperCase() || "S";
}

const COMPLETION_CHECKS: { key: string; label: string; test: (row: StudentRecord) => boolean }[] = [
  { key: "email", label: "Email address", test: (r) => Boolean(r.email) },
  { key: "phone", label: "Phone number", test: (r) => Boolean(r.phone) },
  { key: "dob", label: "Date of birth", test: (r) => Boolean(r.date_of_birth) },
  { key: "gender", label: "Gender", test: (r) => Boolean(r.gender) },
  { key: "photo", label: "Photograph", test: (r) => Boolean(r.photo_url) },
  {
    key: "address",
    label: "Address",
    test: (r) => Boolean((r.address as Record<string, unknown> | null)?.line1),
  },
  { key: "program", label: "Programme", test: (r) => Boolean(r.program_id) },
  { key: "department", label: "Department", test: (r) => Boolean(r.department_id) },
  { key: "roll", label: "Roll number", test: (r) => Boolean(r.roll_number) },
  {
    key: "registration",
    label: "Registration number",
    test: (r) => Boolean(r.registration_number),
  },
  { key: "category", label: "Category", test: (r) => Boolean(r.category_id) },
  { key: "blood", label: "Blood group", test: (r) => Boolean(r.blood_group_id) },
  { key: "emergency", label: "Emergency contact", test: (r) => Boolean(r.emergency_contact) },
];

export function profileCompletion(
  row: StudentRecord,
  extras: { guardians: number; documents: number } = { guardians: 0, documents: 0 },
) {
  const checks = [
    ...COMPLETION_CHECKS.map((check) => ({ label: check.label, done: check.test(row) })),
    { label: "Guardian record", done: extras.guardians > 0 },
    { label: "Verified document", done: extras.documents > 0 },
  ];
  const done = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => c.label),
    checks,
  };
}

function pad(value: number, size = 4) {
  return String(value).padStart(size, "0");
}

/** Sequential identifiers derived from the live register, scoped to the tenant. */
export async function generateStudentNumbers(
  tenantId: string,
  options: { prefix?: string; year?: number; programCode?: string | null } = {},
) {
  const year = options.year ?? new Date().getFullYear();
  const prefix = (options.prefix ?? "ADM").toUpperCase();

  const { count, error } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", `${year}-01-01`)
    .lte("created_at", `${year}-12-31T23:59:59`);
  if (error) throw error;

  const next = (count ?? 0) + 1;
  const programSegment = (options.programCode ?? "GEN")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  return {
    admission_number: `${prefix}${year}${pad(next)}`,
    registration_number: `${year}${programSegment}${pad(next, 3)}`,
    roll_number: `${programSegment}${String(year).slice(-2)}${pad(next, 3)}`,
  };
}

export function addressToText(address: Record<string, unknown> | null | undefined) {
  if (!address) return "—";
  const parts = ["line1", "line2", "city", "state", "country", "postal_code"]
    .map((key) => address[key])
    .filter((value) => typeof value === "string" && value.trim().length > 0);
  return parts.length ? parts.join(", ") : "—";
}
