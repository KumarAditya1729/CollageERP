import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccess } from "@/hooks/useAccess";
import { securityService } from "@/lib/security/securityService";

export function useSecurityIncidents() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["security_incidents", tenant?.id],
    queryFn: () => securityService.getIncidents(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function useCreateSecurityIncident() {
  const queryClient = useQueryClient();
  const { tenant } = useAccess();

  return useMutation({
    mutationFn: (incident: Record<string, unknown>) =>
      securityService.createIncident({ ...incident, tenant_id: tenant?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security_incidents", tenant?.id] });
    },
  });
}

export function useIncidentReports(incidentId?: string) {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["incident_reports", tenant?.id, incidentId],
    queryFn: () => securityService.getReports(tenant!.id, incidentId),
    enabled: !!tenant?.id,
  });
}

export function useEmergencyContacts() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["emergency_contacts", tenant?.id],
    queryFn: () => securityService.getEmergencyContacts(tenant!.id),
    enabled: !!tenant?.id,
  });
}

export function usePanicAlerts() {
  const { tenant } = useAccess();
  return useQuery({
    queryKey: ["panic_alerts", tenant?.id],
    queryFn: () => securityService.getPanicAlerts(tenant!.id),
    enabled: !!tenant?.id,
  });
}
