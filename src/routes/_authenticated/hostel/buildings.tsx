import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { HostelCard } from "@/components/hostel/HostelCard";
import {
  useHostels,
  useCreateHostel,
  useUpdateHostel,
  useDeleteHostel,
} from "@/hooks/hostel/useHostel";

export const Route = createFileRoute("/_authenticated/hostel/buildings")({
  component: HostelBuildingsPage,
});

function HostelBuildingsPage() {
  const { data: hostels, isLoading } = useHostels();
  const createHostel = useCreateHostel();
  const updateHostel = useUpdateHostel();
  const deleteHostel = useDeleteHostel();

  return (
    <GridResourcePage
      title="Hostel Buildings"
      description="Manage campus hostels and building blocks."
      items={hostels || []}
      isLoading={isLoading}
      searchKeys={["name", "type", "address"]}
      renderItem={(item) => <HostelCard item={item} />}
      onCreate={async (v) => {
        await createHostel.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateHostel.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteHostel.mutateAsync({ id });
      }}
      fields={[
        {
          name: "name",
          label: "Hostel Name",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "type",
          label: "Type",
          type: "select",
          required: true,
          options: [
            { value: "boys", label: "Boys" },
            { value: "girls", label: "Girls" },
            { value: "mixed", label: "Mixed" },
          ],
        },
        {
          name: "total_capacity",
          label: "Total Capacity",
          type: "number",
          required: true,
        },
        {
          name: "address",
          label: "Address",
          type: "textarea",
          full: true,
        },
      ]}
    />
  );
}
