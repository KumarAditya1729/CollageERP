import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";

export interface PurchaseRequestRow {
  id: string;
  tenant_id: string;
  department_id: string;
  requested_by: string;
  request_date: string;
  required_by_date: string;
  status: string;
}

export function usePurchaseRequests() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["purchase_requests", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("finance_purchase_requests")
        .select("*")
        .order("request_date", { ascending: false });

      if (error) throw error;
      return data as PurchaseRequestRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Partial<PurchaseRequestRow>) => {
      if (!user) throw new Error("No user");
      const { data, error } = await db
        .from("finance_purchase_requests")
        .insert([{ ...input, tenant_id: tenant?.id, requested_by: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_requests"] });
    },
  });
}
