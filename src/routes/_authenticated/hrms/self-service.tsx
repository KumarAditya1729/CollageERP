import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaveApplications, useLeaveBalances } from "@/hooks/hrms/useLeave";
import { useHRAttendance } from "@/hooks/hrms/useHRAttendance";
import { FileText, Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hrms/self-service")({
  component: SelfServicePage,
});

function SelfServicePage() {
  const { data: leaves } = useLeaveApplications({});
  const { data: balances } = useLeaveBalances();
  const { data: attendance } = useHRAttendance({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const presentDays = attendance?.filter((a) => a.status === "present").length ?? 0;
  const lateDays = attendance?.filter((a) => a.status === "late").length ?? 0;
  const leaveDaysTaken = attendance?.filter((a) => a.status === "on_leave").length ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Self Service</h1>
        <p className="text-muted-foreground">
          Your personal HR portal — leaves, payslips, attendance, and documents
        </p>
      </div>

      {/* This Month Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Days Present</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{presentDays}</div>
            <p className="text-xs text-muted-foreground">{lateDays} late arrivals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leave Taken</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{leaveDaysTaken}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {leaves?.filter((l) => l.status === "pending").length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leave">
        <TabsList>
          <TabsTrigger value="leave">My Leave</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="mt-4 space-y-3">
          <Button size="sm">Apply for Leave</Button>
          {leaves?.slice(0, 10).map((leave) => (
            <Card key={leave.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{leave.hr_leave_types.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(leave.from_date).toLocaleDateString()} –{" "}
                    {new Date(leave.to_date).toLocaleDateString()} ({leave.days} days)
                  </p>
                </div>
                <Badge
                  variant={
                    leave.status === "approved"
                      ? "default"
                      : leave.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {leave.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(
              balances as Array<{
                id: string;
                year: number;
                entitled_days: number;
                taken_days: number;
                hr_leave_types?: { name: string };
              }>
            )?.map((b) => (
              <Card key={b.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{b.hr_leave_types?.name}</p>
                      <p className="text-xs text-muted-foreground">Year {b.year}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{b.entitled_days - b.taken_days}</p>
                      <p className="text-xs text-muted-foreground">
                        remaining of {b.entitled_days}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-2">
          {attendance?.slice(0, 20).map((rec) => (
            <Card key={rec.id}>
              <CardContent className="py-2.5 flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  {new Date(rec.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <div className="flex items-center gap-4">
                  {rec.check_in && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(rec.check_in).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <Badge
                    variant={
                      rec.status === "present"
                        ? "default"
                        : rec.status === "absent"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {rec.status?.replace("_", " ") ?? "-"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
