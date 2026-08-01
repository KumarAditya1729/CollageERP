/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportDrivers,
  useCreateTransportDriver,
  useUpdateTransportDriver,
  useDeleteTransportDriver,
} from "@/hooks/transport/useTransport";
import { DriverCard } from "@/components/transport/DriverCard";

export const Route = createFileRoute("/_authenticated/transport/drivers")({
  component: TransportDrivers,
});

function TransportDrivers() {
  const { data, isLoading } = useTransportDrivers();
  const createMutation = useCreateTransportDriver();
  const updateMutation = useUpdateTransportDriver();
  const deleteMutation = useDeleteTransportDriver();

  return (
    <GridResourcePage
      title="Drivers"
      description="Manage transport drivers"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <DriverCard {...props} role="Driver" />}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        first_name: { type: "text", label: "First Name", required: true },
        last_name: { type: "text", label: "Last Name", required: true },
        phone: { type: "text", label: "Phone" },
        license_number: { type: "text", label: "License Number" },
      }}
      searchPlaceholder="Search drivers..."
    />
  );
}
