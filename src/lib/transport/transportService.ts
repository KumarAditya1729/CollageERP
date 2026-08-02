import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

export const transportService = {
  // Vehicles
  async getVehicles(tenantId: string) {
    const { data, error } = await db
      .from("trn_vehicles")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("registration_number", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createVehicle(payload: any) {
    const { data, error } = await db.from("trn_vehicles").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateVehicle(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_vehicles")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteVehicle(payload: any) {
    const { error } = await db.from("trn_vehicles").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Drivers
  async getDrivers(tenantId: string) {
    const { data, error } = await db
      .from("trn_drivers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("first_name", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createDriver(payload: any) {
    const { data, error } = await db.from("trn_drivers").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateDriver(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_drivers")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteDriver(payload: any) {
    const { error } = await db.from("trn_drivers").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Attendants
  async getAttendants(tenantId: string) {
    const { data, error } = await db
      .from("trn_attendants")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("first_name", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createAttendant(payload: any) {
    const { data, error } = await db.from("trn_attendants").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateAttendant(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_attendants")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteAttendant(payload: any) {
    const { error } = await db.from("trn_attendants").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Routes
  async getRoutes(tenantId: string) {
    const { data, error } = await db
      .from("trn_routes")
      .select("*, trn_vehicles(registration_number)")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createRoute(payload: any) {
    const { data, error } = await db.from("trn_routes").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateRoute(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db.from("trn_routes").update(rest).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteRoute(payload: any) {
    const { error } = await db.from("trn_routes").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Stops
  async getStops(tenantId: string, routeId?: string) {
    let query = db.from("trn_stops").select("*, trn_routes(name)").eq("tenant_id", tenantId);
    if (routeId) query = query.eq("route_id", routeId);
    const { data, error } = await query.order("stop_sequence", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createStop(payload: any) {
    const { data, error } = await db.from("trn_stops").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateStop(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db.from("trn_stops").update(rest).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteStop(payload: any) {
    const { error } = await db.from("trn_stops").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Student Allocations
  async getStudentAllocations(tenantId: string) {
    const { data, error } = await db
      .from("trn_student_allocations")
      .select(
        "*, students(first_name, last_name, enrollment_number), trn_routes(name), pickup_stop:trn_stops!pickup_stop_id(name), drop_stop:trn_stops!drop_stop_id(name)",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createStudentAllocation(payload: any) {
    const { data, error } = await db
      .from("trn_student_allocations")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateStudentAllocation(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_student_allocations")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteStudentAllocation(payload: any) {
    const { error } = await db.from("trn_student_allocations").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Faculty Allocations
  async getFacultyAllocations(tenantId: string) {
    const { data, error } = await db
      .from("trn_faculty_allocations")
      .select(
        "*, employees:staff(first_name, last_name, employee_id), trn_routes(name), pickup_stop:trn_stops!pickup_stop_id(name), drop_stop:trn_stops!drop_stop_id(name)",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createFacultyAllocation(payload: any) {
    const { data, error } = await db
      .from("trn_faculty_allocations")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateFacultyAllocation(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_faculty_allocations")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteFacultyAllocation(payload: any) {
    const { error } = await db.from("trn_faculty_allocations").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Attendance
  async getAttendance(tenantId: string) {
    const { data, error } = await db
      .from("trn_attendance")
      .select("*, trn_routes(name)")
      .eq("tenant_id", tenantId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createAttendance(payload: any) {
    const { data, error } = await db.from("trn_attendance").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateAttendance(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_attendance")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteAttendance(payload: any) {
    const { error } = await db.from("trn_attendance").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Maintenance
  async getMaintenance(tenantId: string) {
    const { data, error } = await db
      .from("trn_maintenance")
      .select("*, trn_vehicles(registration_number)")
      .eq("tenant_id", tenantId)
      .order("maintenance_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createMaintenance(payload: any) {
    const { data, error } = await db.from("trn_maintenance").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateMaintenance(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_maintenance")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteMaintenance(payload: any) {
    const { error } = await db.from("trn_maintenance").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Fuel Logs
  async getFuelLogs(tenantId: string) {
    const { data, error } = await db
      .from("trn_fuel_logs")
      .select("*, trn_vehicles(registration_number)")
      .eq("tenant_id", tenantId)
      .order("fill_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createFuelLog(payload: any) {
    const { data, error } = await db.from("trn_fuel_logs").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateFuelLog(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_fuel_logs")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteFuelLog(payload: any) {
    const { error } = await db.from("trn_fuel_logs").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Documents
  async getDocuments(tenantId: string) {
    const { data, error } = await db
      .from("trn_documents")
      .select("*, trn_vehicles(registration_number), trn_drivers(first_name, last_name)")
      .eq("tenant_id", tenantId)
      .order("expiry_date", { ascending: true });
    if (error) throw error;
    return data;
  },
  async createDocument(payload: any) {
    const { data, error } = await db.from("trn_documents").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateDocument(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_documents")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteDocument(payload: any) {
    const { error } = await db.from("trn_documents").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },

  // Incidents
  async getIncidents(tenantId: string) {
    const { data, error } = await db
      .from("trn_incidents")
      .select(
        "*, trn_vehicles(registration_number), trn_routes(name), trn_drivers(first_name, last_name)",
      )
      .eq("tenant_id", tenantId)
      .order("incident_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  async createIncident(payload: any) {
    const { data, error } = await db.from("trn_incidents").insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async updateIncident(payload: any) {
    const { id, ...rest } = payload;
    const { data, error } = await db
      .from("trn_incidents")
      .update(rest)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteIncident(payload: any) {
    const { error } = await db.from("trn_incidents").delete().eq("id", payload.id);
    if (error) throw error;
    return true;
  },
};
