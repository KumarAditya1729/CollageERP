import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useAccess } from "@/hooks/useAccess";

export interface AssetRow {
  id: string;
  tenant_id: string;
  name: string;
  asset_code: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  status: string;
}

export function useAssets() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["assets", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("finance_assets")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      return data as AssetRow[];
    },
    enabled: !!tenant?.id,
  });
}
