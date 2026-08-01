import { User, LogIn, LogOut, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface AllocationCardProps {
  item: {
    id?: string;
    check_in_date?: string;
    expected_check_out_date?: string;
    status?: string;
    students?: {
      first_name?: string;
      last_name?: string;
      enrollment_number?: string;
    };
    hos_beds?: {
      bed_number?: string;
      hos_rooms?: {
        room_number?: string;
        hos_floors?: {
          hos_hostels?: {
            name?: string;
          };
        };
      };
    };
    [key: string]: unknown;
  };
  onVacate?: (item: AllocationCardProps["item"]) => void;
  onTransfer?: (item: AllocationCardProps["item"]) => void;
  onViewDetails?: (item: AllocationCardProps["item"]) => void;
}

export function AllocationCard({ item, onVacate, onTransfer, onViewDetails }: AllocationCardProps) {
  const isVacated = item.status === "vacated";

  return (
    <Card
      className={`flex flex-col h-full overflow-hidden transition-all hover:shadow-md ${isVacated ? "opacity-70 grayscale-[0.5]" : "border-border/50"}`}
    >
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base line-clamp-1">
              {item.students?.first_name} {item.students?.last_name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.students?.enrollment_number || "Unknown Student"}
            </p>
          </div>
        </div>
        <Badge variant={isVacated ? "secondary" : "default"} className="capitalize shrink-0">
          {item.status || "active"}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="mb-4 bg-muted/30 rounded-md p-2 border">
          <p className="text-sm font-medium flex items-center gap-1">
            <Info className="h-3 w-3 text-muted-foreground" /> Placement
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {item.hos_beds?.hos_rooms?.hos_floors?.hos_hostels?.name} • Room{" "}
            {item.hos_beds?.hos_rooms?.room_number} • Bed {item.hos_beds?.bed_number}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <LogIn className="h-3 w-3" /> Check-In
            </span>
            <span className="text-sm font-medium">
              {item.check_in_date ? format(new Date(item.check_in_date), "PP") : "N/A"}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Exp. Check-Out
            </span>
            <span className="text-sm font-medium">
              {item.expected_check_out_date
                ? format(new Date(item.expected_check_out_date), "PP")
                : "N/A"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t flex flex-wrap gap-2 items-center justify-end mt-auto bg-muted/10">
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
            Details
          </Button>
        )}
        {!isVacated && onTransfer && (
          <Button variant="outline" size="sm" onClick={() => onTransfer(item)}>
            Transfer
          </Button>
        )}
        {!isVacated && onVacate && (
          <Button variant="destructive" size="sm" onClick={() => onVacate(item)}>
            Vacate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
