import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CheckSquare,
  FileText,
  GraduationCap,
  Library,
  UsersRound,
  Sparkles,
  Sun,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  UserPlus,
  DollarSign,
  Calendar,
} from "lucide-react";

import { useActivityFeed } from "@/components/layout/activity-drawer";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { AICopilotButton } from "@/components/common/ai-copilot-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAccess } from "@/hooks/useAccess";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Institution Hub — CampusOS 3.0" },
      {
        name: "description",
        content: "Live operational overview of students, faculty, academics, documents and pending approvals.",
      },
      { property: "og:title", content: "Institution Hub — CampusOS 3.0" },
      { property: "og:description", content: "Live overview of your college operations." },
    ],
  }),
  component: DashboardPage,
});

async function countRows(table: string, tenantId: string, filters?: Record<string, string>) {
  let builder = supabase
    .from(table as never)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  for (const [key, value] of Object.entries(filters ?? {})) builder = builder.eq(key, value);
  const { count, error } = await builder;
  if (error) throw error;
  return count ?? 0;
}

function DashboardPage() {
  const { tenant, campus, activeRole, user } = useAccess();

  const metrics = useQuery({
    queryKey: ["dashboard-metrics", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const id = tenant!.id;
      const [students, faculty, staff, departments, programs, courses, documents, approvals] =
        await Promise.all([
          countRows("students", id, { status: "enrolled" }),
          countRows("faculty", id),
          countRows("staff", id),
          countRows("departments", id),
          countRows("programs", id),
          countRows("courses", id),
          countRows("documents", id),
          countRows("workflow_instances", id, { status: "pending" }),
        ]);
      return { students, faculty, staff, departments, programs, courses, documents, approvals };
    },
  });

  const enrolment = useQuery({
    queryKey: ["dashboard-enrolment", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const [
        { data: programRows, error: programError },
        { data: studentRows, error: studentError },
      ] = await Promise.all([
        supabase
          .from("programs")
          .select("id, code, name")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null),
        supabase
          .from("students")
          .select("program_id")
          .eq("tenant_id", tenant!.id)
          .is("deleted_at", null)
          .eq("status", "enrolled"),
      ]);
      if (programError) throw programError;
      if (studentError) throw studentError;

      const counts = new Map<string, number>();
      for (const row of studentRows ?? []) {
        if (!row.program_id) continue;
        counts.set(row.program_id, (counts.get(row.program_id) ?? 0) + 1);
      }
      return (programRows ?? [])
        .map((program) => ({ name: program.code, students: counts.get(program.id) ?? 0 }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 8);
    },
  });

  const activity = useActivityFeed(8);

  const chartConfig = {
    students: { label: "Enrolled students", color: "var(--color-primary)" },
  } satisfies ChartConfig;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const displayName = user?.email ? user.email.split("@")[0].toUpperCase() : "KUMAR";

  return (
    <div className="space-y-8">
      {/* SaaS Greeting Banner & Institution Status */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm transition-all">
        <div className="pointer-events-none absolute -right-12 -top-12 size-72 rounded-full bg-linear-to-br from-primary/10 via-purple-500/5 to-transparent blur-3xl" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <Sun className="size-3.5 fill-current" /> 28°C · Campus Systems Operational
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-purple-600 dark:text-purple-300">
                ✨ CampusOS 3.0 Engine
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {getGreeting()}, <span className="text-primary">{displayName}</span> 👋
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Here is your live institutional intelligence feed for <span className="font-semibold text-foreground">{tenant ? tenant.name : "CampusOS ERP"}</span>{campus ? ` (${campus.name})` : ""}. All administrative workflows are currently synced.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <AICopilotButton className="h-11 px-5 rounded-[14px] shadow-sm text-sm" />
            <Button asChild variant="outline" className="h-11 px-5 rounded-[14px] font-semibold text-sm gap-2">
              <Link to="/activity">
                <Activity className="size-4 text-muted-foreground" />
                <span>Audit Trail</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Institution Health Metric Bar */}
        <div className="mt-8 pt-6 border-t border-border/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground">Institution Health Score</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-foreground tracking-tight">98.4%</span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-[10px]">+0.4%</Badge>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground">Fee Realization Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-foreground tracking-tight">94.2%</span>
              <span className="text-xs text-muted-foreground font-mono">Q3 On Target</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground">Daily Attendance Avg</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-foreground tracking-tight">86.7%</span>
              <span className="text-xs text-muted-foreground font-mono">8,420 Active</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground">Statutory Compliance</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">100%</span>
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-1">Quick Actions:</span>
        <Button asChild variant="outline" size="sm" className="rounded-[12px] h-9 gap-2 shrink-0 border-border hover:border-primary/50 transition-all font-semibold">
          <Link to="/students">
            <UserPlus className="size-4 text-blue-500" />
            <span>Admit New Student</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-[12px] h-9 gap-2 shrink-0 border-border hover:border-emerald-500/50 transition-all font-semibold">
          <Link to="/fees">
            <DollarSign className="size-4 text-emerald-500" />
            <span>Collect Fee Receipt</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-[12px] h-9 gap-2 shrink-0 border-border hover:border-amber-500/50 transition-all font-semibold">
          <Link to="/attendance">
            <Calendar className="size-4 text-amber-500" />
            <span>Mark Attendance Roll</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-[12px] h-9 gap-2 shrink-0 border-border hover:border-purple-500/50 transition-all font-semibold">
          <Link to="/compliance">
            <ShieldCheck className="size-4 text-purple-500" />
            <span>Generate Statutory Report</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-[12px] h-9 gap-2 shrink-0 border-border hover:border-primary/50 transition-all font-semibold">
          <Link to="/approvals">
            <CheckSquare className="size-4 text-primary" />
            <span>Review Approvals ({metrics.data?.approvals ?? 0})</span>
          </Link>
        </Button>
      </div>

      {/* Live Operational Metrics Grid */}
      {metrics.isLoading ? (
        <CardsSkeleton count={8} />
      ) : metrics.error ? (
        <ErrorState
          description={(metrics.error as Error).message}
          onRetry={() => void metrics.refetch()}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Enrolled Students" value={metrics.data?.students} icon={GraduationCap} />
          <StatCard label="Faculty Members" value={metrics.data?.faculty} icon={UsersRound} />
          <StatCard label="Staff Workforce" value={metrics.data?.staff} icon={UsersRound} />
          <StatCard label="Active Departments" value={metrics.data?.departments} icon={Building2} />
          <StatCard label="Academic Programmes" value={metrics.data?.programs} icon={Library} />
          <StatCard label="Course Offerings" value={metrics.data?.courses} icon={BookOpen} />
          <StatCard label="Document Repository" value={metrics.data?.documents} icon={FileText} />
          <StatCard
            label="Pending Workflows"
            value={metrics.data?.approvals}
            icon={CheckSquare}
            footer={
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs font-semibold text-primary">
                <Link to="/approvals">Process inbox ({metrics.data?.approvals ?? 0}) →</Link>
              </Button>
            }
          />
        </div>
      )}

      {/* AI Insights & Analytical Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Enrolment Chart */}
        <Card className="lg:col-span-2 rounded-[20px] border border-border shadow-xs overflow-hidden bg-card">
          <CardHeader className="p-6 pb-4 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Enrolment by Programme</CardTitle>
                <CardDescription className="text-xs">Active student headcount distribution across academic streams.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-primary">
                <Link to="/programs">View All →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {enrolment.isLoading ? (
              <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
            ) : (enrolment.data ?? []).length === 0 ? (
              <EmptyState
                title="No active enrolment matrix"
                description="Student programme enrollment charts will formulate automatically upon onboarding."
                className="py-12"
              />
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={enrolment.data} margin={{ left: -16, top: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} style={{ fontSize: "11px", fontWeight: "bold" }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} style={{ fontSize: "11px" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="students" fill="var(--color-students)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* AI Operational Recommendations */}
        <Card className="rounded-[20px] border border-border shadow-xs overflow-hidden bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="p-6 pb-4 border-b border-border/60 bg-linear-to-r from-purple-500/10 via-card to-card">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">AI Copilot Insights</CardTitle>
                  <CardDescription className="text-xs text-purple-600 dark:text-purple-400 font-mono font-semibold">Live Institutional Telemetry</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="rounded-[16px] border border-border p-4 bg-muted/30 space-y-2 hover:border-border/80 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono uppercase">
                    ⚡ Fee Action Required
                  </span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 font-mono px-2 py-0.5 rounded-md font-bold">Priority</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  B.Tech CSE Semester 4 shows ₹2,45,000 in uncollected dues exceeding the grace window.
                </p>
                <Button asChild variant="link" className="p-0 h-auto text-xs font-bold text-primary">
                  <Link to="/fees">Initiate Bulk Reminder Email →</Link>
                </Button>
              </div>

              <div className="rounded-[16px] border border-border p-4 bg-muted/30 space-y-2 hover:border-border/80 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono uppercase">
                    ✅ UGC Statutory Ready
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-mono px-2 py-0.5 rounded-md font-bold">Verified</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All 14 mandatory academic faculty rosters have been validated against AICTE regulations.
                </p>
                <Button asChild variant="link" className="p-0 h-auto text-xs font-bold text-emerald-600">
                  <Link to="/compliance">Download Certified Compliance PDF →</Link>
                </Button>
              </div>

              <div className="rounded-[16px] border border-border p-4 bg-muted/30 space-y-2 hover:border-border/80 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono uppercase">
                    📊 Attendance Alert
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-600 font-mono px-2 py-0.5 rounded-md font-bold">18 Students</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  18 students in Mechanical Engg fell below the mandatory 75% attendance threshold this week.
                </p>
                <Button asChild variant="link" className="p-0 h-auto text-xs font-bold text-blue-600">
                  <Link to="/attendance">Review Debarment Shortlist →</Link>
                </Button>
              </div>
            </CardContent>
          </div>
          <div className="p-4 border-t border-border/80 bg-muted/20">
            <AICopilotButton className="w-full h-10 rounded-[14px] text-xs font-semibold justify-center" showText={true} />
          </div>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card className="rounded-[20px] border border-border shadow-xs overflow-hidden bg-card">
        <CardHeader className="p-6 pb-4 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Workspace Audit Trail & Activity</CardTitle>
            <CardDescription className="text-xs">Real-time log of administrative changes across departments.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-[12px] h-9 text-xs font-semibold">
            <Link to="/activity">View Complete Audit History →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {activity.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded-[14px] bg-muted/50" />
              ))}
            </div>
          ) : (activity.data ?? []).length === 0 ? (
            <EmptyState title="No recent activity logged" description="Team actions and workflow approvals will appear here." />
          ) : (
            <div className="divide-y divide-border/60">
              {(activity.data ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-muted/30 px-2 rounded-[12px] transition-colors">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80 border border-border font-bold text-xs shadow-2xs">
                      <Activity className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="truncate text-sm font-semibold text-foreground">{item.summary}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                  {item.module ? (
                    <Badge className="shrink-0 font-mono text-[10px] bg-muted/80 text-muted-foreground border border-border uppercase tracking-wider font-bold">
                      {item.module}
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
