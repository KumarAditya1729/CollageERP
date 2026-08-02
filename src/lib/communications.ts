export type CommunicationType = "circular" | "email" | "sms";
export type CommunicationStatus = "draft" | "sent" | "scheduled";
export type RecipientStatus = "pending" | "delivered" | "failed";

export interface Communication {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  title: string;
  content: string | null;
  type: CommunicationType;
  status: CommunicationStatus;
  sent_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joins
  sender?: { first_name: string; last_name: string } | null;
  recipient_count?: number;
  read_count?: number;
}

export interface CommunicationRecipient {
  id: string;
  tenant_id: string;
  communication_id: string;
  recipient_id: string;
  read_at: string | null;
  status: RecipientStatus;
  created_at: string;
  updated_at: string;
  // Joins
  profile?: { first_name: string; last_name: string; email: string; phone: string } | null;
}

export const COMMUNICATION_TYPES: { value: CommunicationType; label: string }[] = [
  { value: "circular", label: "Circular / Notice" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

export const COMMUNICATION_STATUSES: { value: CommunicationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "scheduled", label: "Scheduled" },
];
