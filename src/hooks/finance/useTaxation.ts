import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface TaxRuleRow {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  percentage: number;
  is_active: boolean;
}

export function useTaxRules() {
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ["tax_rules", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("finance_tax_rules")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as TaxRuleRow[];
    },
    enabled: !!tenant?.id,
  });
}
