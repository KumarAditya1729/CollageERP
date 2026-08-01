import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface BudgetRow {
  id: string;
  tenant_id: string;
  academic_year_id: string;
  name: string;
  type: "annual" | "department" | "program" | "project";
  department_id?: string;
  program_id?: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  status: string;
}

export function useBudgets() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ["budgets", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("finance_budgets")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as BudgetRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  return useMutation({
    mutationFn: async (input: Partial<BudgetRow>) => {
      const { data, error } = await supabase
        .from("finance_budgets")
        .insert([{ ...input, tenant_id: tenant?.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
