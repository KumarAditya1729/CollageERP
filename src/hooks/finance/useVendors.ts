import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

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
  const { tenant } = useAuth();

  return useQuery({
    queryKey: ["vendors", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("finance_vendors")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as VendorRow[];
    },
    enabled: !!tenant?.id,
  });
}
