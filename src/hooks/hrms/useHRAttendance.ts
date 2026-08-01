import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface StaffAttendanceRow {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  shift_id: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  source: string;
  overtime_minutes: number;
  remarks: string | null;
}

export function useHRAttendance(filters?: {
  staffId?: string;
  from?: string;
  to?: string;
}) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["hr_attendance", tenant?.id, filters],
    queryFn: async (): Promise<StaffAttendanceRow[]> => {
      if (!tenant?.id) return [];
      let query = db
        .from("hr_staff_attendance")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("date", { ascending: false });
      if (filters?.staffId) query = query.eq("staff_id", filters.staffId);
      if (filters?.from) query = query.gte("date", filters.from);
      if (filters?.to) query = query.lte("date", filters.to);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as StaffAttendanceRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<StaffAttendanceRow>): Promise<StaffAttendanceRow> => {
      const payload = { ...input, tenant_id: tenant?.id };
      const { data, error } = await db
        .from("hr_staff_attendance")
        .upsert([payload])
        .select()
        .single();
      if (error) throw error;
      return data as StaffAttendanceRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr_attendance"] });
    },
  });
}
