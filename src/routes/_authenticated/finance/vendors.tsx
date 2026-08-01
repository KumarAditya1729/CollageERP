import { createFileRoute } from "@tanstack/react-router";
import { useVendors } from "@/hooks/finance/useVendors";
import { VendorProfile } from "@/components/finance/VendorProfile";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/finance/vendors")({
  component: VendorsPage,
});

function VendorsPage() {
  const { data: vendors, isLoading } = useVendors();

  if (isLoading) return <div className="p-8">Loading vendors...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage supplier profiles, compliance and ratings</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors?.map((vendor) => (
          <VendorProfile key={vendor.id} vendor={vendor} />
        ))}
        {vendors?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No vendors registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
