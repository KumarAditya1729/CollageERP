import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";

export const Route = createFileRoute("/_authenticated/hostel/reports")({
  component: HostelReportsPage,
});

function HostelReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Reports"
        description="Generate analytics and reports for hostel operations."
      />
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card shadow-sm text-center">
        <h3 className="text-lg font-medium">Reports Module</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Analytics, occupancy reports, fee collection, and maintenance charts will be displayed
          here.
        </p>
      </div>
    </div>
  );
}
