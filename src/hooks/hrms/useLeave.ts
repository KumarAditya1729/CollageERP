import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";

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
}

export function useLeaveTypes() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["leave_types", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_leave_types")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as LeaveTypeRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useLeaveApplications(filters?: { staffId?: string; status?: string }) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["leave_applications", tenant?.id, filters],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase
        .from("hr_leave_applications")
        .select("*, hr_leave_types(name, code)")
        .order("applied_at", { ascending: false });
      if (filters?.staffId) query = query.eq("staff_id", filters.staffId);
      if (filters?.status) query = query.eq("status", filters.status);
      const { data, error } = await query;
      if (error) throw error;
      return data as (LeaveApplicationRow & {
        hr_leave_types: { name: string; code: string };
      })[];
    },
    enabled: !!tenant?.id,
  });
}

export function useLeaveBalances(staffId?: string, year?: number) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["leave_balances", tenant?.id, staffId, year],
    queryFn: async () => {
      if (!tenant?.id) return [];
      let query = supabase.from("hr_leave_balances").select("*, hr_leave_types(name, code)");
      if (staffId) query = query.eq("staff_id", staffId);
      if (year) query = query.eq("year", year);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<LeaveApplicationRow>) => {
      const { data, error } = await supabase
        .from("hr_leave_applications")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
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
    }) => {
      const { data, error } = await supabase
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
      return data;
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
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_holidays")
        .select("*, hr_holiday_calendars(name, year)")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}
