/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AllocationCard({
  allocation,
  onClick,
  type = "student",
}: {
  allocation: any;
  onClick?: () => void;
  type?: "student" | "faculty";
}) {
  const person = type === "student" ? allocation.students : allocation.employees;
  const name = person ? `${person.first_name} ${person.last_name}` : "Unknown";

  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {name}
          </CardTitle>
          <Badge variant={allocation.status === "active" ? "default" : "secondary"}>
            {allocation.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Navigation className="h-4 w-4 text-blue-500" /> Route:{" "}
            {allocation.trn_routes?.name || "N/A"}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" /> In: {allocation.pickup_stop?.name || "N/A"}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" /> Out: {allocation.drop_stop?.name || "N/A"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
