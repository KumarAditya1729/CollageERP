import { format, isPast, differenceInDays } from "date-fns";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IssuanceCardProps {
  transaction: {
    id?: string;
    status?: string;
    due_date?: string;
    issue_date?: string;
    lib_item_copies?: { accession_number?: string; lib_items?: { title?: string } };
    lib_members?: { users?: { first_name?: string; last_name?: string } };
    [key: string]: unknown;
  };
  onRenew?: (transaction: IssuanceCardProps["transaction"]) => void;
  onReturn?: (transaction: IssuanceCardProps["transaction"]) => void;
}

export function IssuanceCard({ transaction, onRenew, onReturn }: IssuanceCardProps) {
  const isOverdue =
    transaction.status === "issued" &&
    transaction.due_date &&
    isPast(new Date(transaction.due_date));
  const daysOverdue = isOverdue
    ? differenceInDays(new Date(), new Date(transaction.due_date as string))
    : 0;

  return (
    <Card
      className={`overflow-hidden transition-all ${isOverdue ? "border-destructive/50 shadow-sm" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4
              className="font-medium line-clamp-1"
              title={transaction.lib_item_copies?.lib_items?.title}
            >
              {transaction.lib_item_copies?.lib_items?.title || "Unknown Title"}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Accession: {transaction.lib_item_copies?.accession_number}</span>
              <span>•</span>
              <span>
                Member: {transaction.lib_members?.users?.first_name}{" "}
                {transaction.lib_members?.users?.last_name}
              </span>
            </div>
          </div>
          <Badge
            variant={
              transaction.status === "issued"
                ? isOverdue
                  ? "destructive"
                  : "default"
                : "secondary"
            }
          >
            {String(transaction.status || "").toUpperCase()}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Issued Date</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>
                {transaction.issue_date ? format(new Date(transaction.issue_date), "PP") : "N/A"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Due Date</span>
            <div className="flex items-center gap-1.5">
              <Clock
                className={`h-3.5 w-3.5 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
              />
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                {transaction.due_date ? format(new Date(transaction.due_date), "PP") : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {isOverdue && (
          <div className="mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>Overdue by {daysOverdue} days. Fines may apply.</span>
          </div>
        )}
      </CardContent>

      {(onRenew || onReturn) && transaction.status === "issued" && (
        <CardFooter className="p-4 pt-0 flex gap-2 justify-end bg-muted/20 border-t mt-auto">
          {onRenew && (
            <Button variant="outline" size="sm" onClick={() => onRenew(transaction)}>
              Renew
            </Button>
          )}
          {onReturn && (
            <Button size="sm" onClick={() => onReturn(transaction)}>
              Process Return
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
