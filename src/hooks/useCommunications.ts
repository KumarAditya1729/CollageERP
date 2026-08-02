import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Communication, CommunicationRecipient } from "@/lib/communications";
import { useAccess } from "./useAccess";
import { useAuth } from "./useAuth";

export function useCommunications() {
  const { tenant } = useAccess();

  const query = useQuery({
    queryKey: ["communications", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications")
        .select("*, sender:profiles!communications_sent_by_fkey(first_name, last_name)")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Ideally we'd do a count in supabase, but for now we can fetch the counts or just type cast
      return (data ?? []) as unknown as Communication[];
    },
  });

  return query;
}

export function useCommunicationMutations() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  const { user } = useAuth();

  const createCommunication = useMutation({
    mutationFn: async (values: Partial<Communication> & { recipientIds?: string[] }) => {
      const { recipientIds, ...commValues } = values;
      
      const { data, error } = await supabase
        .from("communications")
        .insert({
          ...commValues,
          tenant_id: tenant!.id,
          sent_by: user?.id,
          sent_at: commValues.status === "sent" ? new Date().toISOString() : null,
        })
        .select()
        .single();
      
      if (error) throw error;

      if (recipientIds && recipientIds.length > 0) {
        const recipientsToInsert = recipientIds.map(id => ({
          tenant_id: tenant!.id,
          communication_id: data.id,
          recipient_id: id,
          status: "pending",
        }));
        
        await supabase.from("communication_recipients").insert(recipientsToInsert as any);
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["communications"] });
    },
  });

  const updateCommunication = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Communication> }) => {
      const { data, error } = await supabase
        .from("communications")
        .update(values)
        .eq("id", id)
        .eq("tenant_id", tenant!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["communications"] });
    },
  });

  return { createCommunication, updateCommunication };
}
