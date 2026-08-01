/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

export function RouteCard({ route, onClick }: { route: any; onClick?: () => void }) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          {route.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> Start: {route.start_location || "N/A"}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" /> End: {route.end_location || "N/A"}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">Vehicle:</span>{" "}
            {route.trn_vehicles?.registration_number || "Unassigned"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
