import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ClipboardCheck,
  CalendarClock,
  TrendingUp,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { useStaffList, useFacultyList } from "@/hooks/hrms/useEmployees";
import { useLeaveApplications } from "@/hooks/hrms/useLeave";
import { usePayrollRuns } from "@/hooks/hrms/usePayroll";

export const Route = createFileRoute("/_authenticated/hrms/")({
  component: HRMSDashboard,
});

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function HRMSDashboard() {
  const { data: staff } = useStaffList();
  const { data: faculty } = useFacultyList();
  const { data: pendingLeaves } = useLeaveApplications({ status: "pending" });
  const { data: payrollRuns } = usePayrollRuns();

  const totalEmployees = (staff?.length ?? 0) + (faculty?.length ?? 0);
  const activeStaff = staff?.filter((s) => s.employment_status === "active").length ?? 0;
  const activeFaculty = faculty?.filter((f) => f.employment_status === "active").length ?? 0;
  const lastPayroll = payrollRuns?.[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h1>
        <p className="text-muted-foreground">Human Resource Management System</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          subtitle={`${activeStaff} staff · ${activeFaculty} faculty`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Pending Leave Requests"
          value={pendingLeaves?.length ?? 0}
          subtitle="Awaiting your approval"
          icon={CalendarClock}
          color="bg-amber-500"
        />
        <StatCard
          title="Last Payroll Run"
          value={
            lastPayroll
              ? new Date(lastPayroll.pay_period_start).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })
              : "None"
          }
          subtitle={lastPayroll?.status ?? "No payroll processed"}
          icon={ClipboardCheck}
          color="bg-green-500"
        />
        <StatCard
          title="Probation Employees"
          value={staff?.filter((s) => s.employment_status === "probation").length ?? 0}
          subtitle="Pending confirmation"
          icon={UserCheck}
          color="bg-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Actions</h2>
        {(pendingLeaves?.length ?? 0) > 0 ? (
          <div className="space-y-2">
            {pendingLeaves?.slice(0, 5).map((leave) => (
              <Card key={leave.id} className="border-l-4 border-l-amber-500">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">
                        Leave request — {leave.hr_leave_types.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(leave.from_date).toLocaleDateString()} –{" "}
                        {new Date(leave.to_date).toLocaleDateString()} ({leave.days} days)
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            No pending actions. All caught up!
          </div>
        )}
      </div>
    </div>
  );
}
