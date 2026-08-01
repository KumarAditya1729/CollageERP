import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, ReceiptText } from "lucide-react";
import { VendorRow } from "@/hooks/finance/useVendors";

export function VendorProfile({ vendor }: { vendor: VendorRow }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{vendor.name}</CardTitle>
              <CardDescription>Vendor ID: {vendor.id.split("-")[0]}</CardDescription>
            </div>
          </div>
          <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
            {vendor.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            {vendor.email || "No email provided"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            {vendor.phone || "No phone provided"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {vendor.contact_person || "No contact person"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ReceiptText className="h-4 w-4" />
            Tax/GST: Pending
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
