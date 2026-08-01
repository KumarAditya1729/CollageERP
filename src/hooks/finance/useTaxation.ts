import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useAccess } from "@/hooks/useAccess";

export interface TaxRuleRow {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  percentage: number;
  is_active: boolean;
}

export function useTaxRules() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["tax_rules", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("finance_tax_rules")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as TaxRuleRow[];
    },
    enabled: !!tenant?.id,
  });
}
