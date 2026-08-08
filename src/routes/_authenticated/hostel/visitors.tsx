import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { VisitorCard } from "@/components/hostel/VisitorCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hostel/visitors")({
  component: HostelVisitorsPage,
});

function HostelVisitorsPage() {
  const { tenant } = useAccess();
  const queryClient = useQueryClient();

  const visitorsQuery = useQuery({
    queryKey: ["hostel_visitors", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });

  const createVisitor = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("visitors").insert({
        ...payload,
        tenant_id: tenant?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Visitor logged successfully");
      queryClient.invalidateQueries({ queryKey: ["hostel_visitors"] });
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const updateVisitor = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { error } = await supabase.from("visitors").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Visitor updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hostel_visitors"] });
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const deleteVisitor = useMutation({
    mutationFn: async ({ id }: any) => {
      const { error } = await supabase.from("visitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Visitor deleted");
      queryClient.invalidateQueries({ queryKey: ["hostel_visitors"] });
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  return (
    <GridResourcePage
      title="Hostel Visitors"
      description="Manage visitor log for the hostel."
      items={visitorsQuery.data || []}
      isLoading={visitorsQuery.isLoading}
      searchKeys={["full_name", "phone"]}
      renderItem={(item) => <VisitorCard item={item} />}
      onCreate={async (v) => {
        await createVisitor.mutateAsync({
          full_name: v.visitor_name,
          phone: v.phone_number,
        });
      }}
      onUpdate={async (id, v) => {
        await updateVisitor.mutateAsync({ 
          id, 
          full_name: v.visitor_name,
          phone: v.phone_number,
        });
      }}
      onDelete={async (id) => {
        await deleteVisitor.mutateAsync({ id });
      }}
      fields={[
        { name: "visitor_name", label: "Visitor Name", type: "text", required: true },
        { name: "phone_number", label: "Phone Number", type: "tel", required: true },
      ]}
    />
  );
}
