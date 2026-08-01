import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const hostelService = {
  // Hostels
  async getHostels(tenantId: string) {
    const { data, error } = await db.from("hos_hostels").select("*").eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
  async createHostel(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_hostels").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateHostel({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_hostels")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteHostel(id: string) {
    const { error } = await db.from("hos_hostels").delete().eq("id", id);
    if (error) throw error;
  },

  // Floors
  async getFloors(tenantId: string) {
    const { data, error } = await db
      .from("hos_floors")
      .select("*, hos_hostels(name)")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
  async createFloor(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_floors").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateFloor({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_floors")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteFloor(id: string) {
    const { error } = await db.from("hos_floors").delete().eq("id", id);
    if (error) throw error;
  },

  // Rooms
  async getRooms(tenantId: string, hostelId?: string) {
    const query = db
      .from("hos_rooms")
      .select("*, hos_floors(floor_number, hos_hostels(name))")
      .eq("tenant_id", tenantId);
    // Filtering by hostelId is complex if it requires a join in postgrest, leaving as is.
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async createRoom(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_rooms").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateRoom({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_rooms")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteRoom(id: string) {
    const { error } = await db.from("hos_rooms").delete().eq("id", id);
    if (error) throw error;
  },

  // Beds
  async getBeds(tenantId: string) {
    const { data, error } = await db
      .from("hos_beds")
      .select("*, hos_rooms(room_number, capacity, hos_floors(floor_number, hos_hostels(name)))")
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
  async createBed(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_beds").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateBed({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_beds")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteBed(id: string) {
    const { error } = await db.from("hos_beds").delete().eq("id", id);
    if (error) throw error;
  },

  // Allocations
  async getAllocations(tenantId: string) {
    const { data, error } = await db
      .from("hos_allocations")
      .select(
        "*, students(first_name, last_name, enrollment_number), hos_beds(bed_number, hos_rooms(room_number, hos_floors(hos_hostels(name))))",
      )
      .eq("tenant_id", tenantId)
      .order("check_in_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createAllocation(allocation: Record<string, unknown>) {
    const { data, error } = await db.from("hos_allocations").insert(allocation).select().single();
    if (error) throw error;
    return data;
  },
  async updateAllocation({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_allocations")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteAllocation(id: string) {
    const { error } = await db.from("hos_allocations").delete().eq("id", id);
    if (error) throw error;
  },

  // Waiting List
  async getWaitingList(tenantId: string) {
    const { data, error } = await db
      .from("hos_waiting_list")
      .select("*, students(first_name, last_name, enrollment_number), hos_hostels(name)")
      .eq("tenant_id", tenantId)
      .order("application_date", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createWaitingList(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_waiting_list").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateWaitingList({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_waiting_list")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteWaitingList(id: string) {
    const { error } = await db.from("hos_waiting_list").delete().eq("id", id);
    if (error) throw error;
  },

  // Mess Plans
  async getMessPlans(tenantId: string) {
    const { data, error } = await db.from("hos_mess_plans").select("*").eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
  async createMessPlan(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_mess_plans").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateMessPlan({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_mess_plans")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteMessPlan(id: string) {
    const { error } = await db.from("hos_mess_plans").delete().eq("id", id);
    if (error) throw error;
  },

  // Mess Enrollments
  async getMessEnrollments(tenantId: string) {
    const { data, error } = await db
      .from("hos_mess_enrollments")
      .select(
        "*, students(first_name, last_name, enrollment_number), hos_mess_plans(name, cost_per_month)",
      )
      .eq("tenant_id", tenantId);
    if (error) throw error;
    return data;
  },
  async createMessEnrollment(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_mess_enrollments").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateMessEnrollment({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_mess_enrollments")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteMessEnrollment(id: string) {
    const { error } = await db.from("hos_mess_enrollments").delete().eq("id", id);
    if (error) throw error;
  },

  // Complaints
  async getComplaints(tenantId: string) {
    const { data, error } = await db
      .from("hos_complaints")
      .select("*, students(first_name, last_name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createComplaint(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_complaints").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateComplaint({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_complaints")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteComplaint(id: string) {
    const { error } = await db.from("hos_complaints").delete().eq("id", id);
    if (error) throw error;
  },

  // Gate Passes
  async getGatePasses(tenantId: string) {
    const { data, error } = await db
      .from("hos_gate_passes")
      .select("*, students(first_name, last_name, enrollment_number)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createGatePass(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_gate_passes").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateGatePass({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_gate_passes")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteGatePass(id: string) {
    const { error } = await db.from("hos_gate_passes").delete().eq("id", id);
    if (error) throw error;
  },

  // Attendance
  async getAttendance(tenantId: string) {
    const { data, error } = await db
      .from("hos_attendance")
      .select(
        "*, hos_allocations(students(first_name, last_name, enrollment_number), hos_beds(bed_number, hos_rooms(room_number)))",
      )
      .eq("tenant_id", tenantId)
      .order("attendance_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createAttendance(payload: Record<string, unknown>) {
    const { data, error } = await db.from("hos_attendance").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateAttendance({ id, ...payload }: { id: string; [key: string]: unknown }) {
    const { data, error } = await db
      .from("hos_attendance")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteAttendance(id: string) {
    const { error } = await db.from("hos_attendance").delete().eq("id", id);
    if (error) throw error;
  },
};
