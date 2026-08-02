export type TemplateType = "certificate" | "id_card" | "document";

export interface DesignTemplate {
  id: string;
  tenant_id: string;
  campus_id: string | null;
  name: string;
  type: TemplateType;
  content: any; // JSONB structure storing layout, HTML, styles, variables
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const TEMPLATE_TYPES: { value: TemplateType; label: string }[] = [
  { value: "certificate", label: "Certificate" },
  { value: "id_card", label: "ID Card" },
  { value: "document", label: "Document" },
];
