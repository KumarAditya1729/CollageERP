import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface RefundRequestRow {
  id: string;
  tenant_id: string;
  student_id: string;
  amount: number;
  reason: string;
  status: string;
}

export function useRefunds() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ["refunds", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("finance_refund_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RefundRequestRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  return useMutation({
    mutationFn: async (input: Partial<RefundRequestRow>) => {
      const { data, error } = await supabase
        .from("finance_refund_requests")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
    },
  });
}
