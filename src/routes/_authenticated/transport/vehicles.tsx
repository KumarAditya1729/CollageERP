import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportVehicles,
  useCreateTransportVehicle,
  useUpdateTransportVehicle,
  useDeleteTransportVehicle,
} from "@/hooks/transport/useTransport";
import { VehicleCard } from "@/components/transport/VehicleCard";

export const Route = createFileRoute("/_authenticated/transport/vehicles")({
  component: TransportVehicles,
});

function TransportVehicles() {
  const { data, isLoading } = useTransportVehicles();
  const createMutation = useCreateTransportVehicle();
  const updateMutation = useUpdateTransportVehicle();
  const deleteMutation = useDeleteTransportVehicle();

  return (
    <GridResourcePage
      title="Vehicles"
      description="Manage campus vehicle fleet"
      data={data || []}
      isLoading={isLoading}
      CardComponent={VehicleCard}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        registration_number: { type: "text", label: "Registration Number", required: true },
        vehicle_type: {
          type: "select",
          label: "Type",
          options: [
            { label: "Bus", value: "bus" },
            { label: "Van", value: "van" },
            { label: "Car", value: "car" },
          ],
        },
        capacity: { type: "number", label: "Capacity" },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "Active", value: "active" },
            { label: "Maintenance", value: "maintenance" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      }}
      searchPlaceholder="Search vehicles..."
    />
  );
}
