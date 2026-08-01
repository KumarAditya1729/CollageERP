import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface BankAccountRow {
  id: string;
  tenant_id: string;
  bank_name: string;
  account_number: string;
  current_balance: number;
}

export function useBankAccounts() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ["bank_accounts", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("finance_bank_accounts")
        .select("*")
        .order("bank_name", { ascending: true });

      if (error) throw error;
      return data as BankAccountRow[];
    },
    enabled: !!tenant?.id,
  });
}
