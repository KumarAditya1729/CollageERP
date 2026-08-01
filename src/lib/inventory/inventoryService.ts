import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const inventoryService = {
  async getCategories(tenantId: string) {
    const { data, error } = await db.from("inv_categories").select("*").eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getItems(tenantId: string) {
    const { data, error } = await db
      .from("inv_items")
      .select("*, inv_categories(name)")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getLocations(tenantId: string) {
    const { data, error } = await db.from("inv_locations").select("*").eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getStock(tenantId: string) {
    const { data, error } = await db
      .from("inv_stock")
      .select("*, inv_items(name, sku), inv_locations(name)")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getMovements(tenantId: string) {
    const { data, error } = await db
      .from("inv_movements")
      .select("*, inv_items(name)")
      .eq("tenant_id", tenantId)
      .order("movement_date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createMovement(movement: Record<string, unknown>) {
    const { data, error } = await db.from("inv_movements").insert(movement).select().single();
    if (error) throw error;
    return data;
  },
};
