import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const visitorService = {
  async getVisitors(tenantId: string) {
    const { data, error } = await db
      .from("visitors")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createVisitor(visitor: Record<string, unknown>) {
    const { data, error } = await db.from("visitors").insert(visitor).select().single();
    if (error) throw error;
    return data;
  },

  async getVisitorPasses(tenantId: string) {
    const { data, error } = await db
      .from("visitor_passes")
      .select("*, visitors(full_name, phone)")
      .eq("tenant_id", tenantId)
      .order("valid_from", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPass(pass: Record<string, unknown>) {
    const { data, error } = await db.from("visitor_passes").insert(pass).select().single();
    if (error) throw error;
    return data;
  },

  async getLogs(tenantId: string) {
    const { data, error } = await db
      .from("visitor_logs")
      .select("*, visitor_passes(pass_code, visitors(full_name))")
      .eq("tenant_id", tenantId)
      .order("entry_time", { ascending: false });
    if (error) throw error;
    return data;
  },
};
