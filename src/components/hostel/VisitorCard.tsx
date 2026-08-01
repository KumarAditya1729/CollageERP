import { User, LogIn, LogOut, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface VisitorCardProps {
  item: {
    id?: string;
    visitor_name?: string;
    phone_number?: string;
    purpose?: string;
    check_in_time?: string;
    check_out_time?: string;
    status?: string;
    students?: {
      first_name?: string;
      last_name?: string;
    };
    [key: string]: unknown;
  };
  onCheckOut?: (item: VisitorCardProps["item"]) => void;
  onViewDetails?: (item: VisitorCardProps["item"]) => void;
}

export function VisitorCard({ item, onCheckOut, onViewDetails }: VisitorCardProps) {
  const isCheckedOut = item.status === "checked_out" || !!item.check_out_time;

  return (
    <Card
      className={`flex flex-col h-full overflow-hidden transition-all hover:shadow-md ${isCheckedOut ? "opacity-70 grayscale-[0.5]" : "border-border/50"}`}
    >
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base line-clamp-1">
              {item.visitor_name || "Unknown Visitor"}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> {item.phone_number || "No phone"}
            </p>
          </div>
        </div>
        <Badge variant={isCheckedOut ? "secondary" : "default"} className="capitalize shrink-0">
          {isCheckedOut ? "Checked Out" : "Active"}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <p className="text-sm font-medium mb-1">
          Visiting: {item.students?.first_name} {item.students?.last_name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{item.purpose}</p>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <LogIn className="h-3 w-3" /> In
            </span>
            <span className="text-sm font-medium">
              {item.check_in_time ? format(new Date(item.check_in_time), "p") : "N/A"}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Out
            </span>
            <span className="text-sm font-medium">
              {item.check_out_time ? format(new Date(item.check_out_time), "p") : "N/A"}
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
        {!isCheckedOut && onCheckOut && (
          <Button variant="default" size="sm" onClick={() => onCheckOut(item)}>
            Check Out
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
