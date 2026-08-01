/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportMaintenance,
  useCreateTransportMaintenance,
  useUpdateTransportMaintenance,
  useDeleteTransportMaintenance,
  useTransportVehicles,
} from "@/hooks/transport/useTransport";
import { MaintenanceCard } from "@/components/transport/MaintenanceCard";

export const Route = createFileRoute("/_authenticated/transport/maintenance")({
  component: TransportMaintenance,
});

function TransportMaintenance() {
  const { data, isLoading } = useTransportMaintenance();
  const { data: vehicles } = useTransportVehicles();
  const createMutation = useCreateTransportMaintenance();
  const updateMutation = useUpdateTransportMaintenance();
  const deleteMutation = useDeleteTransportMaintenance();

  return (
    <GridResourcePage
      title="Maintenance"
      description="Manage vehicle maintenance logs"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <MaintenanceCard maintenance={props.item} {...props} />}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        vehicle_id: {
          type: "select",
          label: "Vehicle",
          required: true,
          options: vehicles?.map((v: any) => ({ label: v.registration_number, value: v.id })) || [],
        },
        maintenance_type: {
          type: "select",
          label: "Type",
          options: [
            { label: "Routine", value: "routine" },
            { label: "Repair", value: "repair" },
          ],
        },
        description: { type: "textarea", label: "Description" },
        cost: { type: "number", label: "Cost" },
        maintenance_date: { type: "text", label: "Date (YYYY-MM-DD)" },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "Scheduled", value: "scheduled" },
            { label: "Completed", value: "completed" },
          ],
        },
      }}
      searchPlaceholder="Search maintenance..."
    />
  );
}
