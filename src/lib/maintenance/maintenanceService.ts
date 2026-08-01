import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const maintenanceService = {
  async getRequests(tenantId: string) {
    const { data, error } = await db
      .from("maintenance_requests")
      .select("*, maintenance_assets(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createRequest(request: Record<string, unknown>) {
    const { data, error } = await db.from("maintenance_requests").insert(request).select().single();
    if (error) throw error;
    return data;
  },

  async updateRequest(payload: { id: string; [key: string]: unknown }) {
    const { id, ...updates } = payload;
    const { data, error } = await db
      .from("maintenance_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createTask(task: Record<string, unknown>) {
    const { data, error } = await db.from("maintenance_tasks").insert(task).select().single();
    if (error) throw error;
    return data;
  },

  async getTasks(tenantId: string) {
    const { data, error } = await db
      .from("maintenance_tasks")
      .select("*, maintenance_requests(title)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getSchedules(tenantId: string) {
    const { data, error } = await db
      .from("maintenance_schedules")
      .select("*, maintenance_assets(name)")
      .eq("tenant_id", tenantId)
      .order("next_due_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getAssets(tenantId: string) {
    const { data, error } = await db
      .from("maintenance_assets")
      .select("*")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getVendors(tenantId: string) {
    const { data, error } = await db
      .from("maintenance_vendors")
      .select("*")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
};
