import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const libraryService = {
  async getCatalog(tenantId: string) {
    const { data, error } = await db
      .from("lib_items")
      .select("*, lib_categories(name), lib_publishers(name), lib_authors(name)")
      .eq("tenant_id", tenantId)
      .order("title", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getCopies(tenantId: string, itemId?: string) {
    let query = db.from("lib_item_copies").select("*").eq("tenant_id", tenantId);
    if (itemId) query = query.eq("item_id", itemId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getMembers(tenantId: string) {
    const { data, error } = await db
      .from("lib_members")
      .select("*, users(first_name, last_name, email)")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },

  async getCirculation(tenantId: string) {
    const { data, error } = await db
      .from("lib_issue_transactions")
      .select(
        "*, lib_members(member_number, users(first_name, last_name)), lib_item_copies(accession_number, lib_items(title))",
      )
      .eq("tenant_id", tenantId)
      .order("issue_date", { ascending: false });
    if (error) throw error;
    return data;
  },

  async issueItem(transaction: Record<string, unknown>) {
    const { data, error } = await db
      .from("lib_issue_transactions")
      .insert(transaction)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getFines(tenantId: string) {
    const { data, error } = await db
      .from("lib_fines")
      .select("*, lib_members(member_number, users(first_name, last_name))")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createFine(payload: Record<string, unknown>) {
    const { data, error } = await db.from("lib_fines").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async returnItem(transactionId: string, returnDate: string) {
    const { data, error } = await db
      .from("lib_issue_transactions")
      .update({ status: "returned", return_date: returnDate })
      .eq("id", transactionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async renewItem(transactionId: string, newDueDate: string) {
    const { data, error } = await db
      .from("lib_issue_transactions")
      .update({ due_date: newDueDate, status: "issued" })
      .eq("id", transactionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getReservations(tenantId: string) {
    const { data, error } = await db
      .from("lib_reservations")
      .select("*, lib_members(member_number, users(first_name, last_name)), lib_items(title)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async createReservation(payload: Record<string, unknown>) {
    const { data, error } = await db.from("lib_reservations").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
};
