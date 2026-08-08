import { createFileRoute } from "@tanstack/react-router";
import { useVendors, useCreateVendor } from "@/hooks/finance/useVendors";
import { VendorProfile } from "@/components/finance/VendorProfile";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/_authenticated/finance/vendors")({
  component: VendorsPage,
});

function VendorsPage() {
  const { data: vendors, isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createVendor.mutateAsync({
      name: formData.get("name") as string,
      contact_person: formData.get("contact_person") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    });
    setOpen(false);
  };

  if (isLoading) return <div className="p-8">Loading vendors...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">Manage supplier profiles, compliance and ratings</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input name="contact_person" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" required />
              </div>
              <Button type="submit" className="w-full">Save Vendor</Button>
            </form>
          </DialogContent>
        </Dialog>
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
