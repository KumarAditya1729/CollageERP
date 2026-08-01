/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Activity } from "lucide-react";

export function VehicleCard({ vehicle, onClick }: { vehicle: any; onClick?: () => void }) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {vehicle.registration_number}
          </CardTitle>
          <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>
            {vehicle.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" /> Capacity: {vehicle.capacity || "N/A"}
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" /> Type: {vehicle.vehicle_type || "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
