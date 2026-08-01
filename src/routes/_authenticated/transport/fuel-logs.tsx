/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportFuelLogs,
  useCreateTransportFuelLog,
  useUpdateTransportFuelLog,
  useDeleteTransportFuelLog,
  useTransportVehicles,
} from "@/hooks/transport/useTransport";
import { FuelLogCard } from "@/components/transport/FuelLogCard";

export const Route = createFileRoute("/_authenticated/transport/fuel-logs")({
  component: TransportFuelLogs,
});

function TransportFuelLogs() {
  const { data, isLoading } = useTransportFuelLogs();
  const { data: vehicles } = useTransportVehicles();
  const createMutation = useCreateTransportFuelLog();
  const updateMutation = useUpdateTransportFuelLog();
  const deleteMutation = useDeleteTransportFuelLog();

  return (
    <GridResourcePage
      title="Fuel Logs"
      description="Manage vehicle fuel consumption"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <FuelLogCard log={props.item} {...props} />}
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
        fill_date: { type: "text", label: "Date (YYYY-MM-DD)" },
        quantity_liters: { type: "number", label: "Liters" },
        cost: { type: "number", label: "Cost" },
        odometer_reading: { type: "number", label: "Odometer Reading" },
      }}
      searchPlaceholder="Search fuel logs..."
    />
  );
}
