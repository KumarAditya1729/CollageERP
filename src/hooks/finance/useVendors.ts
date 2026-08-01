import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { useAccess } from "@/hooks/useAccess";

export interface VendorRow {
  id: string;
  tenant_id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
}

export function useVendors() {
  const { tenant } = useAccess();

  return useQuery({
    queryKey: ["vendors", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await db
        .from("finance_vendors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as VendorRow[];
    },
    enabled: !!tenant?.id,
  });
}
