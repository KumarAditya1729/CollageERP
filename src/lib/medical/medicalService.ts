import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const medicalService = {
  async getRecords(tenantId: string) {
    const { data, error } = await db
      .from("medical_records")
      .select("*, users(first_name, last_name)")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getVisits(tenantId: string) {
    const { data, error } = await db
      .from("medical_visits")
      .select("*, users(first_name, last_name)")
      .eq("tenant_id", tenantId)
      .order("visit_time", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createVisit(visit: Record<string, unknown>) {
    const { data, error } = await db.from("medical_visits").insert(visit).select().single();
    if (error) throw error;
    return data;
  },

  async getVaccinations(tenantId: string) {
    const { data, error } = await db
      .from("vaccinations")
      .select("*, users(first_name, last_name)")
      .eq("tenant_id", tenantId)
      .order("administered_date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getHealthAlerts(tenantId: string) {
    const { data, error } = await db
      .from("health_alerts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async getMedicineInventory(tenantId: string) {
    const { data, error } = await db
      .from("medicine_inventory")
      .select("*, inv_items(name)")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
};
