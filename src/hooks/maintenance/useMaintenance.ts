import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { maintenanceService } from "@/lib/maintenance/maintenanceService";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";

export function useMaintenanceRequests() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["maintenance_requests", tenant?.id],
    queryFn: () => maintenanceService.getRequests(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (request: Record<string, unknown>) => {
      const data = await maintenanceService.createRequest({ ...request, tenant_id: tenant?.id });
      // Integration 8: Maintenance Request -> Consume Inventory Items
      if (request.inventory_items && Array.isArray(request.inventory_items)) {
        for (const item of request.inventory_items) {
          // Consume inventory by recording an issue transaction
          await supabase.from("inv_transactions" as unknown as never).insert({
            tenant_id: tenant!.id,
            item_id: item.item_id,
            transaction_type: "issue",
            quantity: item.quantity,
            reference_type: "maintenance_request",
            reference_id: data[0].id,
            transaction_date: new Date().toISOString().split("T")[0],
          } as unknown as never);
        }
      }

      const recordId = data as { id?: string } | Array<{ id?: string }>;
      const entityId = Array.isArray(recordId)
        ? (recordId[0]?.id ?? "unknown")
        : (recordId.id ?? "unknown");

      await integrationService.insertAuditLog({
        tenant_id: tenant!.id,
        actor_id: null,
        action: "create",
        entity_type: "maintenance_requests",
        entity_id: entityId,
        new_data: request,
      });

      await integrationService.insertSearchIndex({
        tenant_id: tenant!.id,
        entity_type: "maintenance_requests",
        entity_id: entityId,
        title: String(request.title || "Maintenance Request"),
        subtitle: String(request.description || ""),
        url: `/maintenance/requests`,
        module: "maintenance",
      });

      await integrationService.insertTimelineEntry({
        tenant_id: tenant!.id,
        actor_id: null,
        entity_type: "maintenance_requests",
        entity_id: entityId,
        module: "maintenance",
        verb: "CREATED",
        summary: `Maintenance request created: ${String(request.title || "")}`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests", tenant?.id] });
    },
  });
}

export function useUpdateMaintenanceRequest() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();
  return useMutation({
    mutationFn: async (payload: { id: string; [key: string]: unknown }) => {
      const data = await maintenanceService.updateRequest(payload);

      // Integration 9: Vehicle Maintenance -> Update Asset History
      // Only do this if status becomes resolved/completed and asset is vehicle
      if ((payload.status === "resolved" || payload.status === "completed") && payload.asset_id) {
        // Find asset type
        const { data: assetData } = await supabase
          .from("maintenance_assets" as unknown as never)
          .select("asset_type")
          .eq("id", payload.asset_id as string)
          .single();

        if (assetData && (assetData as Record<string, unknown>).asset_type === "vehicle") {
          await supabase.from("maintenance_logs" as unknown as never).insert({
            tenant_id: tenant!.id,
            request_id: payload.id,
            action: "vehicle_maintenance_completed",
            notes: "Vehicle maintenance updated in asset history",
          } as unknown as never);
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests", tenant?.id] });
    },
  });
}

export function useMaintenanceTasks() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["maintenance_tasks", tenant?.id],
    queryFn: () => maintenanceService.getTasks(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useMaintenanceSchedules() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["maintenance_schedules", tenant?.id],
    queryFn: () => maintenanceService.getSchedules(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useMaintenanceAssets() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["maintenance_assets", tenant?.id],
    queryFn: () => maintenanceService.getAssets(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useMaintenanceVendors() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["maintenance_vendors", tenant?.id],
    queryFn: () => maintenanceService.getVendors(tenant!.id),
    enabled: !!tenant?.id,
  });
}
