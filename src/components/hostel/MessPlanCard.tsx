import { Utensils, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MessPlanCardProps {
  item: {
    id?: string;
    name?: string;
    description?: string;
    cost_per_month?: number;
    [key: string]: unknown;
  };
  onEdit?: (item: MessPlanCardProps["item"]) => void;
  onEnroll?: (item: MessPlanCardProps["item"]) => void;
}

export function MessPlanCard({ item, onEdit, onEnroll }: MessPlanCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center gap-3 space-y-0">
        <div className="p-2 bg-primary/10 rounded-md">
          <Utensils className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">{item.name}</h3>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
          {item.description || "No description provided for this mess plan."}
        </p>

        <div className="flex items-center gap-1 mt-auto bg-primary/5 p-3 rounded-md border border-primary/10">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold text-primary">{item.cost_per_month || 0}</span>
          <span className="text-xs text-muted-foreground ml-1">/ month</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t flex flex-wrap gap-2 items-center justify-end mt-auto bg-muted/10">
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            Edit Plan
          </Button>
        )}
        {onEnroll && (
          <Button variant="default" size="sm" onClick={() => onEnroll(item)}>
            Enroll Student
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
