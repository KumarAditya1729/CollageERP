import { BedDouble, Wind, Bath } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoomCardProps {
  item: {
    id?: string;
    room_number?: string;
    room_type?: string;
    capacity?: number;
    has_ac?: boolean;
    has_attached_bath?: boolean;
    hos_floors?: { floor_number?: string; hos_hostels?: { name?: string } };
    [key: string]: unknown;
  };
  onViewDetails?: (item: RoomCardProps["item"]) => void;
}

export function RoomCard({ item, onViewDetails }: RoomCardProps) {
  const getRoomTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "single":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "double":
        return "bg-green-100 text-green-800 border-green-200";
      case "triple":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "dormitory":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <BedDouble className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Room {item.room_number}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.hos_floors?.hos_hostels?.name} • Floor {item.hos_floors?.floor_number}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`capitalize shrink-0 ${getRoomTypeColor(item.room_type)}`}
        >
          {item.room_type || "Unknown"}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Capacity</span>
            <span className="text-sm font-medium">{item.capacity || 0} Beds</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge variant="secondary" className="w-fit text-xs">
              Available
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          {item.has_ac && (
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] py-0 px-2 h-5">
              <Wind className="h-3 w-3" /> AC
            </Badge>
          )}
          {item.has_attached_bath && (
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] py-0 px-2 h-5">
              <Bath className="h-3 w-3" /> Attached Bath
            </Badge>
          )}
        </div>
      </CardContent>

      {onViewDetails && (
        <CardFooter className="p-4 pt-0 border-t flex items-center justify-between mt-auto bg-muted/10">
          <span className="text-xs text-muted-foreground">Manage beds inside</span>
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
            View Details
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
