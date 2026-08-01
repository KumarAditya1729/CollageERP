import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { medicalService } from "@/lib/medical/medicalService";
import { supabase } from "@/integrations/supabase/client";
import { integrationService } from "@/lib/integrationService";

export function useMedicalRecords() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["medical_records", tenant?.id],
    queryFn: () => medicalService.getRecords(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useMedicalVisits() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["medical_visits", tenant?.id],
    queryFn: () => medicalService.getVisits(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateMedicalVisit() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: async (visit: Record<string, unknown>) => {
      const data = await medicalService.createVisit({ ...visit, tenant_id: tenant?.id });
      // Integration 11: Medical Incident -> Notification
      await supabase.from("notifications" as unknown as never).insert({
        tenant_id: tenant!.id,
        user_id: visit.user_id as string, // the patient
        title: "New Medical Visit Recorded",
        message: "A medical visit has been added to your health records.",
        type: "system",
        priority: "high",
        is_read: false,
      } as unknown as never);

      const entityId = (data as { id?: string })?.id ?? "unknown";

      await integrationService.insertAuditLog({
        tenant_id: tenant!.id,
        actor_id: null,
        action: "create",
        entity_type: "medical_visits",
        entity_id: entityId,
        new_data: visit,
      });

      await integrationService.insertSearchIndex({
        tenant_id: tenant!.id,
        entity_type: "medical_visits",
        entity_id: entityId,
        title: `Medical Visit`,
        subtitle: String(visit.diagnosis || visit.complaints || ""),
        url: `/medical`,
        module: "medical",
      });

      await integrationService.insertTimelineEntry({
        tenant_id: tenant!.id,
        actor_id: null,
        entity_type: "medical_visits",
        entity_id: entityId,
        module: "medical",
        verb: "VISITED",
        summary: `Medical visit recorded.`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical_visits", tenant?.id] });
    },
  });
}

export function useVaccinations() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["vaccinations", tenant?.id],
    queryFn: () => medicalService.getVaccinations(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useHealthAlerts() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["health_alerts", tenant?.id],
    queryFn: () => medicalService.getHealthAlerts(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useMedicineInventory() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["medicine_inventory", tenant?.id],
    queryFn: () => medicalService.getMedicineInventory(tenant!.id),
    enabled: !!tenant?.id,
  });
}
