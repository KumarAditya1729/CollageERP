import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useAccess } from "@/hooks/useAccess";

export interface BankAccountRow {
  id: string;
  tenant_id: string;
  bank_name: string;
  account_number: string;
  current_balance: number;
}

export function useBankAccounts() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["bank_accounts", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("finance_bank_accounts")
        .select("*")
        .order("bank_name", { ascending: true });

      if (error) throw error;
      return data as BankAccountRow[];
    },
    enabled: !!tenant?.id,
  });
}
