import { format } from "date-fns";
import { IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FineCardProps {
  fine: {
    id?: string;
    status?: string;
    reason?: string;
    amount?: number | string;
    created_at?: string;
    lib_members?: { users?: { first_name?: string; last_name?: string } };
    [key: string]: unknown;
  };
}

export function FineCard({ fine }: FineCardProps) {
  const isPaid = fine.status === "paid";

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-full ${isPaid ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-destructive/10 text-destructive"}`}
          >
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium">
              {fine.lib_members?.users?.first_name} {fine.lib_members?.users?.last_name}
            </h4>
            <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
              <span>{fine.reason}</span>
              <span>•</span>
              <span>{fine.created_at ? format(new Date(fine.created_at), "PP") : ""}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold">₹{Number(fine.amount || 0).toFixed(2)}</div>
          <Badge variant={isPaid ? "secondary" : "destructive"} className="mt-1">
            {String(fine.status || "").toUpperCase()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
