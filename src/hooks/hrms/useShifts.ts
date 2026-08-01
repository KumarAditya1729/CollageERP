import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

export interface ShiftRow {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
  is_night_shift: boolean;
  is_flexi: boolean;
  work_hours: number;
  is_active: boolean;
}

export interface ShiftRosterRow {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  shift_id: string;
  effective_from: string;
  effective_to: string | null;
  days_of_week: number[];
}

export function useShifts() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["shifts", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_shifts")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as ShiftRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<ShiftRow>) => {
      const { data, error } = await supabase
        .from("hr_shifts")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
  });
}

export function useShiftRosters() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["shift_rosters", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_shift_rosters")
        .select("*, hr_shifts(name, code, start_time, end_time)")
        .order("effective_from", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });
}
