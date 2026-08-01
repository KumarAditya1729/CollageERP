import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";

export const Route = createFileRoute("/_authenticated/transport")({
  component: TransportLayout,
});

function TransportLayout() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Transport Management"
        description="Manage campus fleet, routes, allocations, and logistics."
      />
      <div className="flex-1 p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
