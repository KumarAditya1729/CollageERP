/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { VisitorCard } from "@/components/hostel/VisitorCard";

export const Route = createFileRoute("/_authenticated/hostel/visitors")({
  component: HostelVisitorsPage,
});

function HostelVisitorsPage() {
  // Placeholder since hos_visitors does not explicitly exist yet
  // This could link to the global visitors module with a hostel_id filter
  const visitors: any[] = [];
  const isLoading = false;

  const mockMutation = {
    mutateAsync: async () => {},
    isPending: false,
  } as any;

  return (
    <GridResourcePage
      title="Hostel Visitors"
      description="Manage visitor log for the hostel."
      items={visitors}
      isLoading={isLoading}
      searchKeys={["visitor_name", "phone_number"]}
      renderItem={(item) => <VisitorCard item={item} />}
      onCreate={async (v) => {
        await mockMutation.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await mockMutation.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await mockMutation.mutateAsync({ id });
      }}
      fields={[
        { name: "visitor_name", label: "Visitor Name", type: "text", required: true },
        { name: "phone_number", label: "Phone Number", type: "tel", required: true },
        { name: "purpose", label: "Purpose", type: "textarea", full: true },
      ]}
    />
  );
}
