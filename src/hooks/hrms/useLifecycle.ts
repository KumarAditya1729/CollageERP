import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

export interface TransferRow {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  transfer_type: string;
  from_department_id: string | null;
  to_department_id: string | null;
  from_campus_id: string | null;
  to_campus_id: string | null;
  effective_date: string;
  reason: string | null;
  status: string;
  workflow_instance_id: string | null;
}

export interface ExitRow {
  id: string;
  tenant_id: string;
  staff_id: string | null;
  faculty_id: string | null;
  exit_type: string;
  resignation_date: string | null;
  last_working_date: string | null;
  reason: string | null;
  status: string;
  workflow_instance_id: string | null;
}

export function useTransfers() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["transfers", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_transfers")
        .select("*")
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return data as TransferRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useExits() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["exits", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("hr_exits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExitRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useInitiateTransfer() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<TransferRow>) => {
      const { data, error } = await supabase
        .from("hr_transfers")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

export function useInitiateExit() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (input: Partial<ExitRow>) => {
      const { data, error } = await supabase
        .from("hr_exits")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exits"] });
    },
  });
}
