import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AuditAction = Database["public"]["Enums"]["audit_action"];
type NotificationPriority = Database["public"]["Enums"]["notification_priority"];

export const integrationService = {
  async insertAuditLog({
    tenant_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    entity_label,
    old_data,
    new_data,
    changed_fields,
    module,
  }: {
    tenant_id: string;
    actor_id: string | null;
    action: AuditAction;
    entity_type: string;
    entity_id?: string;
    entity_label?: string;
    old_data?: Record<string, unknown>;
    new_data?: Record<string, unknown>;
    changed_fields?: string[];
    module?: string;
  }) {
    if (!tenant_id) return;
    const { error } = await supabase.from("audit_logs").insert({
      tenant_id,
      actor_id,
      action,
      entity_type,
      entity_id,
      entity_label,
      old_data,
      new_data,
      changed_fields,
      module,
    } as unknown as never);
    if (error) console.error("Failed to insert audit log:", error);
  },

  async insertSearchIndex({
    tenant_id,
    entity_type,
    entity_id,
    title,
    subtitle,
    url,
    module,
  }: {
    tenant_id: string;
    entity_type: string;
    entity_id: string;
    title: string;
    subtitle?: string;
    url?: string;
    module?: string;
  }) {
    if (!tenant_id || !entity_id) return;
    const { error } = await supabase.from("search_index" as unknown as never).insert({
      id: crypto.randomUUID(),
      tenant_id,
      entity_type,
      entity_id,
      title,
      subtitle,
      url,
      module,
    } as unknown as never);
    if (error) console.error("Failed to insert search index:", error);
  },

  async sendNotification({
    tenant_id,
    recipient_id,
    title,
    body,
    priority = "normal",
    event_key,
    action_url,
  }: {
    tenant_id: string;
    recipient_id: string;
    title: string;
    body?: string;
    priority?: NotificationPriority;
    event_key?: string;
    action_url?: string;
  }) {
    if (!tenant_id || !recipient_id) return;
    const { error } = await supabase.from("notifications" as unknown as never).insert({
      id: crypto.randomUUID(),
      tenant_id,
      recipient_id,
      title,
      body,
      priority,
      event_key,
      action_url,
    } as unknown as never);
    if (error) console.error("Failed to send notification:", error);
  },

  async insertTimelineEntry({
    tenant_id,
    actor_id,
    entity_type,
    entity_id,
    module,
    verb,
    summary,
    data,
  }: {
    tenant_id: string;
    actor_id: string | null;
    entity_type: string;
    entity_id: string;
    module: string;
    verb: string;
    summary: string;
    data?: Record<string, unknown>;
  }) {
    if (!tenant_id || !entity_id) return;
    const { error } = await supabase.from("activity_feed" as unknown as never).insert({
      id: crypto.randomUUID(),
      tenant_id,
      actor_id,
      entity_type,
      entity_id,
      module,
      verb,
      summary,
      data,
      created_at: new Date().toISOString(),
    } as unknown as never);
    if (error) console.error("Failed to insert timeline entry:", error);
  },
};
