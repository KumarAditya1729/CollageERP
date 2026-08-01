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
} from "lucide-react";

import { useActivityFeed } from "@/components/layout/activity-drawer";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CampusOS" },
      {
        name: "description",
        content: "Live overview of students, faculty, academics, documents and pending approvals.",
      },
      { property: "og:title", content: "Dashboard — CampusOS" },
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
  const { tenant, campus, activeRole } = useAccess();

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
    students: { label: "Enrolled students", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <>
      <PageHeader
        title={tenant ? tenant.name : "Dashboard"}
        description={`Live operational overview${campus ? ` for ${campus.name}` : " across all campuses"}${
          activeRole ? ` · signed in as ${activeRole.name}` : ""
        }.`}
        crumbs={[{ label: "Overview" }, { label: "Dashboard" }]}
      />

      {metrics.isLoading ? (
        <CardsSkeleton count={8} />
      ) : metrics.error ? (
        <ErrorState
          description={(metrics.error as Error).message}
          onRetry={() => void metrics.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Enrolled students" value={metrics.data?.students} icon={GraduationCap} />
          <StatCard label="Faculty" value={metrics.data?.faculty} icon={UsersRound} />
          <StatCard label="Staff" value={metrics.data?.staff} icon={UsersRound} />
          <StatCard label="Departments" value={metrics.data?.departments} icon={Building2} />
          <StatCard label="Programmes" value={metrics.data?.programs} icon={Library} />
          <StatCard label="Courses" value={metrics.data?.courses} icon={BookOpen} />
          <StatCard label="Documents" value={metrics.data?.documents} icon={FileText} />
          <StatCard
            label="Pending approvals"
            value={metrics.data?.approvals}
            icon={CheckSquare}
            footer={
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Link to="/approvals">Open workflow inbox</Link>
              </Button>
            }
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Enrolment by programme</CardTitle>
            <CardDescription>Active students per programme, largest first.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolment.isLoading ? (
              <div className="h-64 animate-pulse rounded-lg bg-muted/50" />
            ) : (enrolment.data ?? []).length === 0 ? (
              <EmptyState
                title="No enrolment data"
                description="Enrolled students will appear here."
              />
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={enrolment.data} margin={{ left: -16 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="students" fill="var(--color-students)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>The latest changes across your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-lg bg-muted/50" />
                ))}
              </div>
            ) : (activity.data ?? []).length === 0 ? (
              <EmptyState title="No activity yet" description="Team actions will be listed here." />
            ) : (
              <ol className="space-y-3">
                {(activity.data ?? []).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{item.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                    {item.module ? (
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {item.module}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
            <Button asChild variant="outline" size="sm" className="mt-5 w-full">
              <Link to="/activity">View audit trail</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
