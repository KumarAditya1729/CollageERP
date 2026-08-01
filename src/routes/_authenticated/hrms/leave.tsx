import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useLeaveApplications, useLeaveTypes, useHolidays } from "@/hooks/hrms/useLeave";
import { LeaveApprovalCard } from "@/components/hrms/LeaveApprovalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/hrms/leave")({
  component: LeavePage,
});

function LeavePage() {
  const [filter, setFilter] = useState<string>("pending");
  const { data: applications, isLoading } = useLeaveApplications({
    status: filter === "all" ? undefined : filter,
  });
  const { data: leaveTypes } = useLeaveTypes();
  const { data: holidays } = useHolidays();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Manage leave requests, types, and holidays</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      <Tabs defaultValue="approvals">
        <TabsList>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="types">Leave Types ({leaveTypes?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="holidays">Holidays ({holidays?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-4 space-y-4">
          <div className="flex gap-2">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <Button
                key={s}
                variant={filter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {applications?.map((app) => (
                <LeaveApprovalCard
                  key={app.id}
                  application={app}
                  employeeName="Employee"
                  employeeCode="EMP-000"
                />
              ))}
              {applications?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No leave applications found.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leaveTypes?.map((lt) => (
              <Card key={lt.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{lt.name}</CardTitle>
                    <Badge variant="secondary">{lt.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p>Max per year: {lt.max_days_per_year} days</p>
                  <p>{lt.is_paid ? "Paid" : "Unpaid"} leave</p>
                  <p>Carry forward: {lt.carry_forward ? "Yes" : "No"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="holidays" className="mt-4">
          <div className="space-y-2">
            {(
              holidays as Array<{ id: string; name: string; holiday_type: string; date: string }>
            )?.map((h) => (
              <Card key={h.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.holiday_type}</p>
                  </div>
                  <Badge variant="outline">
                    {new Date(h.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {(holidays?.length ?? 0) === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No holidays configured yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
