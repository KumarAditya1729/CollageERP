import { Building2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HostelCardProps {
  item: {
    id?: string;
    name?: string;
    type?: string;
    address?: string;
    total_capacity?: number;
    [key: string]: unknown;
  };
  onViewDetails?: (item: HostelCardProps["item"]) => void;
}

export function HostelCard({ item, onViewDetails }: HostelCardProps) {
  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "boys":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "girls":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold line-clamp-1 text-base">{item.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.address || "No address provided"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`capitalize shrink-0 ${getTypeColor(item.type)}`}>
          {item.type || "Mixed"}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Total Capacity
            </span>
            <span className="text-lg font-semibold">{item.total_capacity || 0}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground">Occupancy Status</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                {/* Mocking occupancy progress for UI purposes */}
                <div className="h-full bg-primary rounded-full" style={{ width: "45%" }}></div>
              </div>
              <span className="text-xs font-medium">45%</span>
            </div>
          </div>
        </div>
      </CardContent>
      {onViewDetails && (
        <CardFooter className="p-4 pt-0 border-t flex items-center justify-end mt-auto bg-muted/10">
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
            Manage Building
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
