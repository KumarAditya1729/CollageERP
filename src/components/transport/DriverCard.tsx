/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, FileText } from "lucide-react";

export function DriverCard({
  driver,
  onClick,
  role = "Driver",
}: {
  driver: any;
  onClick?: () => void;
  role?: string;
}) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {driver.first_name} {driver.last_name}
          </CardTitle>
          <Badge variant="outline">{role}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Phone className="h-4 w-4" /> {driver.phone || "N/A"}
          </div>
          {driver.license_number && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> License: {driver.license_number}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
