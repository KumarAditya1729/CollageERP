import { Database } from "@/integrations/supabase/types";

export type CRMLeadSource = "walk_in" | "website" | "referral" | "social_media" | "other";
export type CRMLeadStatus = "new" | "contacted" | "interested" | "applied" | "enrolled" | "closed_lost";
export type CRMFollowupType = "call" | "email" | "meeting" | "whatsapp";

export interface CRMLead {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: CRMLeadSource;
  status: CRMLeadStatus;
  assigned_to: string | null;
  program_interest_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joins
  assigned_profile?: { first_name: string; last_name: string } | null;
  program?: { name: string } | null;
}

export interface CRMFollowup {
  id: string;
  tenant_id: string;
  lead_id: string;
  date: string;
  type: CRMFollowupType;
  notes: string | null;
  next_followup_date: string | null;
  logged_by: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  logger?: { first_name: string; last_name: string } | null;
}

export const CRM_LEAD_STATUSES: { value: CRMLeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "enrolled", label: "Enrolled" },
  { value: "closed_lost", label: "Closed / Lost" },
];

export const CRM_LEAD_SOURCES: { value: CRMLeadSource; label: string }[] = [
  { value: "walk_in", label: "Walk-in" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social_media", label: "Social Media" },
  { value: "other", label: "Other" },
];

export const CRM_FOLLOWUP_TYPES: { value: CRMFollowupType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "whatsapp", label: "WhatsApp" },
];
