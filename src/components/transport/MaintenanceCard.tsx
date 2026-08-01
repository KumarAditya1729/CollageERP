/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, DollarSign } from "lucide-react";

export function MaintenanceCard({
  maintenance,
  onClick,
}: {
  maintenance: any;
  onClick?: () => void;
}) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-orange-500" />
            {maintenance.trn_vehicles?.registration_number || "Unknown Vehicle"}
          </CardTitle>
          <Badge variant={maintenance.status === "completed" ? "default" : "secondary"}>
            {maintenance.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="line-clamp-1">{maintenance.description || "No description"}</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />{" "}
              {maintenance.maintenance_date
                ? new Date(maintenance.maintenance_date).toLocaleDateString()
                : "N/A"}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> {maintenance.cost || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
