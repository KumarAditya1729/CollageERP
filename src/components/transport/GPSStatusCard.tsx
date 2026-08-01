/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Navigation } from "lucide-react";

export function GPSStatusCard({ gps, onClick }: { gps: any; onClick?: () => void }) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <Navigation className="h-4 w-4 text-green-500" />
            {gps.trn_vehicles?.registration_number || "Unknown Vehicle"}
          </CardTitle>
          <Badge variant="outline">{gps.speed} km/h</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Map className="h-4 w-4" /> Lat: {gps.latitude}, Lng: {gps.longitude}
          </div>
          <div className="text-xs">
            Last updated: {gps.timestamp ? new Date(gps.timestamp).toLocaleString() : "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
