export type StatutoryReportType = "naac" | "ugc" | "aicte" | "gst" | "pf" | "esic" | "audit" | "other";
export type ComplianceStatus = "pending" | "under_review" | "submitted" | "archived";

export interface StatutoryReport {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  title: string;
  report_type: StatutoryReportType;
  period_start: string | null;
  period_end: string | null;
  status: ComplianceStatus;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const STATUTORY_REPORT_TYPES: { value: StatutoryReportType; label: string }[] = [
  { value: "naac", label: "NAAC Accreditation" },
  { value: "ugc", label: "UGC Compliance" },
  { value: "aicte", label: "AICTE Approval" },
  { value: "gst", label: "GST Return" },
  { value: "pf", label: "Provident Fund (PF)" },
  { value: "esic", label: "ESIC" },
  { value: "audit", label: "Internal/External Audit" },
  { value: "other", label: "Other Statutory Filing" },
];

export const COMPLIANCE_STATUSES: { value: ComplianceStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "submitted", label: "Submitted" },
  { value: "archived", label: "Archived" },
];
