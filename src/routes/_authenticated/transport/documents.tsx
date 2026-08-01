/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportDocuments,
  useCreateTransportDocument,
  useUpdateTransportDocument,
  useDeleteTransportDocument,
  useTransportVehicles,
} from "@/hooks/transport/useTransport";
import { VehicleDocumentCard } from "@/components/transport/VehicleDocumentCard";

export const Route = createFileRoute("/_authenticated/transport/documents")({
  component: TransportDocuments,
});

function TransportDocuments() {
  const { data, isLoading } = useTransportDocuments();
  const { data: vehicles } = useTransportVehicles();
  const createMutation = useCreateTransportDocument();
  const updateMutation = useUpdateTransportDocument();
  const deleteMutation = useDeleteTransportDocument();

  return (
    <GridResourcePage
      title="Documents & Permits"
      description="Manage vehicle insurance and permits"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <VehicleDocumentCard document={props.item} {...props} />}
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
        document_type: {
          type: "select",
          label: "Document Type",
          options: [
            { label: "Insurance", value: "insurance" },
            { label: "Permit", value: "permit" },
            { label: "Registration", value: "registration" },
          ],
        },
        document_number: { type: "text", label: "Document Number" },
        issue_date: { type: "text", label: "Issue Date (YYYY-MM-DD)" },
        expiry_date: { type: "text", label: "Expiry Date (YYYY-MM-DD)" },
      }}
      searchPlaceholder="Search documents..."
    />
  );
}
