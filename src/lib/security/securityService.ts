import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const securityService = {
  async getIncidents(tenantId: string) {
    const { data, error } = await db
      .from("security_incidents")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("incident_time", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createIncident(incident: Record<string, unknown>) {
    const { data, error } = await db.from("security_incidents").insert(incident).select().single();
    if (error) throw error;
    return data;
  },

  async getReports(tenantId: string, incidentId?: string) {
    let query = db.from("incident_reports").select("*").eq("tenant_id", tenantId);
    if (incidentId) query = query.eq("incident_id", incidentId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getEmergencyContacts(tenantId: string) {
    const { data, error } = await db
      .from("emergency_contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);
    if (error) throw error;
    return data;
  },

  async getPanicAlerts(tenantId: string) {
    const { data, error } = await db
      .from("panic_alerts")
      .select("*, users(first_name, last_name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
};
