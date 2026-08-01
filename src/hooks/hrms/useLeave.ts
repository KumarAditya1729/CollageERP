import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface LeaveTypeRow {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  is_paid: boolean;
  max_days_per_year: number;
  carry_forward: boolean;
  requires_approval: boolean;
  is_active: boolean;
}

export interface LeaveApplicationRow {
  id: string;
  tenant_id: string;
  leave_type_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  from_date: string;
  to_date: string;
  days: number;
  is_half_day: boolean;
  reason: string | null;
  status: string;
  applied_at: string;
  approved_by: string | null;
  approved_at: string | null;
  hr_leave_types: { name: string; code: string };
}

export interface LeaveBalanceRow {
  id: string;
  tenant_id: string;
  leave_type_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  year: number;
  entitled_days: number;
  taken_days: number;
  pending_days: number;
  carried_forward_days: number;
  hr_leave_types?: { name: string; code: string };
}

export interface HolidayRow {
  id: string;
  name: string;
  date: string;
  holiday_type: string;
  hr_holiday_calendars?: { name: string; year: number };
}

export function useLeaveTypes() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["leave_types", tenant?.id],
    queryFn: async (): Promise<LeaveTypeRow[]> => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("hr_leave_types")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LeaveTypeRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useLeaveApplications(filters?: { staffId?: string; status?: string }) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["leave_applications", tenant?.id, filters],
    queryFn: async (): Promise<LeaveApplicationRow[]> => {
      if (!tenant?.id) return [];
      let query = db
        .from("hr_leave_applications")
        .select("*, hr_leave_types(name, code)")
        .eq("tenant_id", tenant.id)
        .order("applied_at", { ascending: false });
      if (filters?.staffId) query = query.eq("staff_id", filters.staffId);
      if (filters?.status) query = query.eq("status", filters.status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as LeaveApplicationRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useLeaveBalances(staffId?: string, year?: number) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["leave_balances", tenant?.id, staffId, year],
    queryFn: async (): Promise<LeaveBalanceRow[]> => {
      if (!tenant?.id) return [];
      let query = db
        .from("hr_leave_balances")
        .select("*, hr_leave_types(name, code)")
        .eq("tenant_id", tenant.id);
      if (staffId) query = query.eq("staff_id", staffId);
      if (year) query = query.eq("year", year);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as LeaveBalanceRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<LeaveApplicationRow>): Promise<LeaveApplicationRow> => {
      const { data, error } = await db
        .from("hr_leave_applications")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data as LeaveApplicationRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave_applications"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string;
      status: "approved" | "rejected";
      rejection_reason?: string;
    }): Promise<LeaveApplicationRow> => {
      const { data, error } = await db
        .from("hr_leave_applications")
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as LeaveApplicationRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave_applications"] });
    },
  });
}

export function useHolidays(year?: number) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["holidays", tenant?.id, year],
    queryFn: async (): Promise<HolidayRow[]> => {
      if (!tenant?.id) return [];
      let query = db
        .from("hr_holidays")
        .select("*, hr_holiday_calendars(name, year)")
        .eq("tenant_id", tenant.id)
        .order("date", { ascending: true });
      if (year) {
        query = query.eq("hr_holiday_calendars.year", year);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as HolidayRow[];
    },
    enabled: !!tenant?.id,
  });
}
