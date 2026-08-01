import { BedSingle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BedCardProps {
  item: {
    id?: string;
    bed_number?: string;
    is_occupied?: boolean;
    hos_rooms?: {
      room_number?: string;
      hos_floors?: { floor_number?: string; hos_hostels?: { name?: string } };
    };
    [key: string]: unknown;
  };
  onAllocate?: (item: BedCardProps["item"]) => void;
  onViewDetails?: (item: BedCardProps["item"]) => void;
}

export function BedCard({ item, onAllocate, onViewDetails }: BedCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <BedSingle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Bed {item.bed_number}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              Room {item.hos_rooms?.room_number} • {item.hos_rooms?.hos_floors?.hos_hostels?.name}
            </p>
          </div>
        </div>
        {item.is_occupied ? (
          <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
            <XCircle className="h-3 w-3" /> Occupied
          </Badge>
        ) : (
          <Badge
            variant="default"
            className="flex items-center gap-1 shrink-0 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-3 w-3" /> Available
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-4">
        {item.is_occupied ? (
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Current Occupant</span>
            <span className="text-sm font-medium">Assigned to a student</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-2">
            <span className="text-sm">Ready for allocation</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t flex flex-wrap gap-2 items-center justify-end mt-auto bg-muted/10">
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
            Details
          </Button>
        )}
        {onAllocate && !item.is_occupied && (
          <Button variant="default" size="sm" onClick={() => onAllocate(item)}>
            Allocate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
