/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportAttendants,
  useCreateTransportAttendant,
  useUpdateTransportAttendant,
  useDeleteTransportAttendant,
} from "@/hooks/transport/useTransport";
import { DriverCard } from "@/components/transport/DriverCard";

export const Route = createFileRoute("/_authenticated/transport/attendants")({
  component: TransportAttendants,
});

function TransportAttendants() {
  const { data, isLoading } = useTransportAttendants();
  const createMutation = useCreateTransportAttendant();
  const updateMutation = useUpdateTransportAttendant();
  const deleteMutation = useDeleteTransportAttendant();

  return (
    <GridResourcePage
      title="Attendants"
      description="Manage transport attendants"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => (
        <DriverCard {...props} role="Attendant" driver={props.driver || props.item} />
      )}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        first_name: { type: "text", label: "First Name", required: true },
        last_name: { type: "text", label: "Last Name", required: true },
        phone: { type: "text", label: "Phone" },
      }}
      searchPlaceholder="Search attendants..."
    />
  );
}
