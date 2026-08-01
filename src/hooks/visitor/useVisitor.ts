import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { visitorService } from "@/lib/visitor/visitorService";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";

export function useVisitors() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["visitors", tenant?.id],
    queryFn: () => visitorService.getVisitors(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateVisitor() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: (visitor: Record<string, unknown>) =>
      visitorService.createVisitor({ ...visitor, tenant_id: tenant?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors", tenant?.id] });
    },
  });
}

export function useVisitorPasses() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["visitor_passes", tenant?.id],
    queryFn: () => visitorService.getVisitorPasses(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateVisitorPass() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (pass: Record<string, unknown>) => {
      const data = await visitorService.createPass({ ...pass, tenant_id: tenant?.id });
      // Integration 10: Visitor Entry -> Security Log
      await supabase.from("security_incidents" as unknown as never).insert({
        tenant_id: tenant!.id,
        title: `Visitor Entry: ${data.id}`,
        severity: "low",
        location: (pass.destination as string) || "Main Gate",
        incident_time: new Date().toISOString(),
        status: "closed", // Since it's just a log
        description: `Visitor pass created for visitor_id: ${pass.visitor_id}`,
      } as unknown as never);

      await integrationService.insertAuditLog({
        tenant_id: tenant!.id,
        actor_id: null,
        action: "create",
        entity_type: "visitor_passes",
        entity_id: (data as { id?: string })?.id ?? "unknown",
        new_data: pass,
      });

      await integrationService.insertSearchIndex({
        tenant_id: tenant!.id,
        entity_type: "visitor_passes",
        entity_id: (data as { id?: string })?.id ?? "unknown",
        title: `Visitor Pass`,
        subtitle: `Visitor entry for ${String(pass.visitor_name || pass.visitor_id || "")}`,
        url: `/visitors`,
        module: "visitor",
      });

      await integrationService.insertTimelineEntry({
        tenant_id: tenant!.id,
        actor_id: null,
        entity_type: "visitor_passes",
        entity_id: (data as { id?: string })?.id ?? "unknown",
        module: "visitor",
        verb: "ENTERED",
        summary: `Visitor entered campus.`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitor_passes", tenant?.id] });
    },
  });
}

export function useVisitorLogs() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["visitor_logs", tenant?.id],
    queryFn: () => visitorService.getLogs(tenant!.id),
    enabled: !!tenant?.id,
  });
}
