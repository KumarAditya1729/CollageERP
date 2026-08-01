import { AlertCircle, CheckCircle2, Clock, MessageSquare, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ComplaintCardProps {
  item: {
    id?: string;
    category?: string;
    description?: string;
    status?: string;
    created_at?: string;
    resolved_at?: string;
    students?: {
      first_name?: string;
      last_name?: string;
    };
    [key: string]: unknown;
  };
  onViewDetails?: (item: ComplaintCardProps["item"]) => void;
  onUpdateStatus?: (item: ComplaintCardProps["item"], newStatus: string) => void;
}

export function ComplaintCard({ item, onViewDetails, onUpdateStatus }: ComplaintCardProps) {
  const getStatusDisplay = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { icon: AlertCircle, color: "bg-red-100 text-red-800 border-red-200", text: "Open" };
      case "in_progress":
        return {
          icon: Clock,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          text: "In Progress",
        };
      case "resolved":
        return {
          icon: CheckCircle2,
          color: "bg-green-100 text-green-800 border-green-200",
          text: "Resolved",
        };
      default:
        return {
          icon: MessageSquare,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          text: status || "Unknown",
        };
    }
  };

  const statusDisplay = getStatusDisplay(item.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <Card
      className={`flex flex-col h-full overflow-hidden transition-all hover:shadow-md ${item.status === "resolved" ? "border-border/50 opacity-80" : "border-l-4 border-l-red-500"}`}
    >
      <CardHeader className="p-4 pb-2 border-b bg-muted/10 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm capitalize">
              {item.category?.replace(/_/g, " ")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {item.students?.first_name} {item.students?.last_name}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`flex items-center gap-1 shrink-0 ${statusDisplay.color}`}
        >
          <StatusIcon className="h-3 w-3" /> {statusDisplay.text}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <p className="text-sm line-clamp-3 mb-4">{item.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <span>
            Logged: {item.created_at ? format(new Date(item.created_at), "MMM d, yyyy") : "Unknown"}
          </span>
          {item.resolved_at && <span>Resolved: {format(new Date(item.resolved_at), "MMM d")}</span>}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t flex flex-wrap gap-2 items-center justify-end mt-auto bg-muted/5">
        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
            View Details
          </Button>
        )}
        {onUpdateStatus && item.status === "open" && (
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(item, "in_progress")}>
            Mark In Progress
          </Button>
        )}
        {onUpdateStatus && item.status !== "resolved" && (
          <Button variant="default" size="sm" onClick={() => onUpdateStatus(item, "resolved")}>
            Resolve
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
