import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";

export const Route = createFileRoute("/_authenticated/hostel/settings")({
  component: HostelSettingsPage,
});

function HostelSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Settings"
        description="Configure hostel policies, mess timings, and global rules."
      />
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card shadow-sm text-center">
        <h3 className="text-lg font-medium">Settings Module</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Configure room types, fees, mess schedules, fine rules, and workflow approvals here.
        </p>
      </div>
    </div>
  );
}
