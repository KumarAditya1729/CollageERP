import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useStaffList, useFacultyList } from "@/hooks/hrms/useEmployees";
import { usePayrollRuns } from "@/hooks/hrms/usePayroll";
import { useLeaveApplications } from "@/hooks/hrms/useLeave";

export const Route = createFileRoute("/_authenticated/hrms/reports")({
  component: HRReportsPage,
});

function HRReportsPage() {
  const { data: staff } = useStaffList();
  const { data: faculty } = useFacultyList();
  const { data: payrollRuns } = usePayrollRuns();
  const { data: allLeaves } = useLeaveApplications({});

  const totalPayroll = payrollRuns?.reduce((s, r) => s + r.total_net, 0) ?? 0;
  const totalEmployees = (staff?.length ?? 0) + (faculty?.length ?? 0);
  const activeEmployees =
    (staff?.filter((s) => s.employment_status === "active").length ?? 0) +
    (faculty?.filter((f) => f.employment_status === "active").length ?? 0);

  const reportCards = [
    {
      title: "Employee Register",
      description: `${totalEmployees} total employees`,
      action: "Export CSV",
    },
    {
      title: "Attendance Register",
      description: "Monthly attendance summary",
      action: "Export Excel",
    },
    {
      title: "Payroll Register",
      description: `${payrollRuns?.length ?? 0} payroll runs processed`,
      action: "Export PDF",
    },
    {
      title: "Leave Register",
      description: `${allLeaves?.length ?? 0} total leave applications`,
      action: "Export CSV",
    },
    {
      title: "PF Report",
      description: "Provident Fund contributions",
      action: "Export Excel",
    },
    {
      title: "ESI Report",
      description: "ESI contributions summary",
      action: "Export Excel",
    },
    {
      title: "Tax / TDS Report",
      description: "Income Tax deduction summary",
      action: "Export PDF",
    },
    {
      title: "Performance Report",
      description: "Appraisal ratings and promotions",
      action: "Export PDF",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Reports</h1>
        <p className="text-muted-foreground">Generate and export all HR reports</p>
      </div>

      {/* Analytics Strip */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">{activeEmployees} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              YTD Payroll Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{`₹${totalPayroll.toLocaleString("en-IN")}`}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leave Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allLeaves?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payroll Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{payrollRuns?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportCards.map((r) => (
          <Card key={r.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {r.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
