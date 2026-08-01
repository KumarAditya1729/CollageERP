import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from "lucide-react";
import { useApproveLeave } from "@/hooks/hrms/useLeave";

interface LeaveApplication {
  id: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: string;
  applied_at: string;
  hr_leave_types: { name: string; code: string };
}

interface LeaveApprovalCardProps {
  application: LeaveApplication;
  employeeName: string;
  employeeCode: string;
}

export function LeaveApprovalCard({
  application,
  employeeName,
  employeeCode,
}: LeaveApprovalCardProps) {
  const { mutateAsync: approveLeave, isPending } = useApproveLeave();

  const handleApprove = () => approveLeave({ id: application.id, status: "approved" });
  const handleReject = () => approveLeave({ id: application.id, status: "rejected" });

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    approved: "default",
    rejected: "destructive",
    cancelled: "secondary",
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">{employeeName}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono">{employeeCode}</p>
          </div>
          <Badge variant={statusVariant[application.status] ?? "secondary"}>
            {application.status}
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Leave Type</p>
            <p className="font-medium">{application.hr_leave_types.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Duration</p>
            <p className="font-medium">
              {application.days} day{application.days !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Period</p>
            <p className="font-medium">
              {new Date(application.from_date).toLocaleDateString()} –{" "}
              {new Date(application.to_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {application.reason && (
          <p className="text-sm text-muted-foreground italic">&quot;{application.reason}&quot;</p>
        )}
        {application.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleApprove} disabled={isPending} className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
