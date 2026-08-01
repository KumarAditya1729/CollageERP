import type { Database } from "@/integrations/supabase/types";

export type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
export type AttendanceMode = Database["public"]["Enums"]["attendance_mode"];
export type ClassSessionType = Database["public"]["Enums"]["class_session_type"];
export type AttendeeKind = Database["public"]["Enums"]["attendee_kind"];
export type LeaveKind = Database["public"]["Enums"]["leave_kind"];
export type ApprovalState = Database["public"]["Enums"]["approval_state"];

export const attendanceStatuses: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
  "on_leave",
  "on_duty",
  "medical",
  "holiday",
];

export const attendanceModes: AttendanceMode[] = [
  "manual",
  "qr",
  "barcode",
  "rfid",
  "biometric",
  "nfc",
  "gps",
  "self_checkin",
  "bulk",
  "import",
];

export const classSessionTypes: ClassSessionType[] = [
  "lecture",
  "practical",
  "lab",
  "seminar",
  "workshop",
  "tutorial",
  "exam",
  "daily",
  "hostel",
  "transport",
  "other",
];

export const attendeeKinds: AttendeeKind[] = ["student", "faculty", "staff"];
export const leaveKinds: LeaveKind[] = [
  "casual",
  "medical",
  "duty",
  "sports",
  "maternity",
  "bereavement",
  "other",
];
export const approvalStates: ApprovalState[] = ["pending", "approved", "rejected", "cancelled"];

export const weekdayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Statuses that count as attended when no policy override applies. */
export const presentLike: AttendanceStatus[] = ["present", "late", "on_duty"];

export interface PolicyLike {
  minimum_percentage: number;
  warning_percentage: number;
  penalty_percentage: number;
  grace_minutes: number;
  late_after_minutes: number;
  late_counts_as_present: boolean;
  count_holidays: boolean;
  approved_leave_counts: boolean;
  medical_leave_counts: boolean;
  duty_leave_counts: boolean;
}

export const defaultPolicy: PolicyLike = {
  minimum_percentage: 75,
  warning_percentage: 80,
  penalty_percentage: 65,
  grace_minutes: 5,
  late_after_minutes: 10,
  late_counts_as_present: true,
  count_holidays: false,
  approved_leave_counts: true,
  medical_leave_counts: true,
  duty_leave_counts: true,
};

/** Does this status count towards "attended" under the given policy? */
export function countsAsPresent(status: AttendanceStatus, policy: PolicyLike): boolean {
  switch (status) {
    case "present":
      return true;
    case "late":
      return policy.late_counts_as_present;
    case "on_duty":
      return policy.duty_leave_counts;
    case "medical":
      return policy.medical_leave_counts;
    case "on_leave":
    case "excused":
      return policy.approved_leave_counts;
    case "holiday":
      return policy.count_holidays;
    default:
      return false;
  }
}

/** Is this status part of the denominator (held sessions)? */
export function countsAsHeld(status: AttendanceStatus, policy: PolicyLike): boolean {
  if (status === "holiday") return policy.count_holidays;
  return true;
}

export interface AttendanceSummary {
  held: number;
  attended: number;
  absent: number;
  late: number;
  percentage: number;
}

export function summarise(
  statuses: AttendanceStatus[],
  policy: PolicyLike = defaultPolicy,
): AttendanceSummary {
  let held = 0;
  let attended = 0;
  let absent = 0;
  let late = 0;
  for (const status of statuses) {
    if (!countsAsHeld(status, policy)) continue;
    held += 1;
    if (countsAsPresent(status, policy)) attended += 1;
    if (status === "absent") absent += 1;
    if (status === "late") late += 1;
  }
  return {
    held,
    attended,
    absent,
    late,
    percentage: held === 0 ? 0 : Math.round((attended / held) * 1000) / 10,
  };
}

export function groupSummaries<T>(
  rows: T[],
  keyOf: (row: T) => string | null,
  statusOf: (row: T) => AttendanceStatus,
  policy: PolicyLike = defaultPolicy,
) {
  const buckets = new Map<string, AttendanceStatus[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(statusOf(row));
    buckets.set(key, list);
  }
  return [...buckets.entries()].map(([key, statuses]) => ({
    key,
    ...summarise(statuses, policy),
  }));
}

export type RiskBand = "critical" | "warning" | "healthy";

export function riskBand(percentage: number, policy: PolicyLike = defaultPolicy): RiskBand {
  if (percentage < policy.penalty_percentage) return "critical";
  if (percentage < policy.warning_percentage) return "warning";
  return "healthy";
}

export function statusTone(
  status: AttendanceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "present") return "default";
  if (status === "absent") return "destructive";
  if (status === "late") return "secondary";
  return "outline";
}

/** Simple linear-trend projection of the end-of-term percentage. */
export function predictPercentage(series: { held: number; attended: number }[]): number {
  if (series.length === 0) return 0;
  const points = series.map((point, index) => ({
    x: index,
    y: point.held === 0 ? 0 : (point.attended / point.held) * 100,
  }));
  const n = points.length;
  if (n === 1) return Math.round(points[0].y * 10) / 10;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return Math.round((sumY / n) * 10) / 10;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const projected = slope * (n + 2) + intercept;
  return Math.round(Math.min(100, Math.max(0, projected)) * 10) / 10;
}

/** Distance in metres between two GPS points (haversine). */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function newQrToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}
