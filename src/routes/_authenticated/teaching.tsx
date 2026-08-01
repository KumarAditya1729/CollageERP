import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Presentation, Users } from "lucide-react";

import { EmptyState } from "@/components/common/states";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { FacultyExamPanel } from "@/components/exams/faculty-exam-panel";
import { formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/teaching")({
  head: () => ({
    meta: [
      { title: "My teaching — CampusOS" },
      {
        name: "description",
        content: "Your department courses, student cohort, calendar and college notifications.",
      },
      { property: "og:title", content: "My teaching — CampusOS" },
      { property: "og:description", content: "The faculty portal on CampusOS." },
    ],
  }),
  component: TeachingPortal,
});

function TeachingPortal() {
  const { user } = useAuth();
  const { tenant } = useAccess();
  const { active: notifications } = useNotifications();

  const record = useQuery({
    queryKey: ["my-faculty-record", user?.id, tenant?.id],
    enabled: Boolean(user?.id && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty")
        .select("id, first_name, last_name, designation, employee_code, department_id")
        .eq("tenant_id", tenant!.id)
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const departmentId = record.data?.department_id ?? null;

  const courses = useQuery({
    queryKey: ["teaching-courses", departmentId],
    enabled: Boolean(departmentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, code, title, credits, type")
        .eq("department_id", departmentId!)
        .is("deleted_at", null)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const students = useQuery({
    queryKey: ["teaching-students", departmentId],
    enabled: Boolean(departmentId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("department_id", departmentId!)
        .is("deleted_at", null)
        .eq("status", "enrolled");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const events = useQuery({
    queryKey: ["teaching-events", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("id, title, event_type, starts_at")
        .eq("tenant_id", tenant!.id)
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (record.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;

  if (!record.data) {
    return (
      <>
        <PageHeader
          title="My teaching"
          description="Your personal faculty workspace."
          crumbs={[{ label: "Overview" }, { label: "My teaching" }]}
        />
        <EmptyState
          icon={Presentation}
          title="No faculty record linked to your account"
          description="Ask an administrator to link your college account to a faculty record to see your courses and cohort here."
        />
      </>
    );
  }

  const faculty = record.data;

  return (
    <>
      <PageHeader
        title={`Welcome, ${faculty.first_name}`}
        description={`${faculty.designation ?? "Faculty"} · Employee ${faculty.employee_code}`}
        crumbs={[{ label: "Overview" }, { label: "My teaching" }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Department courses" value={courses.data?.length ?? 0} icon={BookOpen} />
        <StatCard label="Enrolled students" value={students.data ?? 0} icon={Users} />
        <StatCard label="Upcoming events" value={events.data?.length ?? 0} icon={CalendarDays} />
        <StatCard
          label="Unread notifications"
          value={notifications.filter((n) => !n.read_at).length}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Courses in my department</CardTitle>
            <CardDescription>Catalogue entries you can teach and plan against.</CardDescription>
          </CardHeader>
          <CardContent>
            {(courses.data ?? []).length === 0 ? (
              <EmptyState
                title="No courses yet"
                description="Courses added to your department will appear here."
              />
            ) : (
              <ul className="divide-y">
                {(courses.data ?? []).map((course) => (
                  <li key={course.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.code} · {course.credits} credits
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {String(course.type).replace(/_/g, " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/courses">Open course catalogue</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Upcoming academic events across the college.</CardDescription>
          </CardHeader>
          <CardContent>
            {(events.data ?? []).length === 0 ? (
              <EmptyState
                title="Nothing scheduled"
                description="Upcoming events will be listed here."
              />
            ) : (
              <ul className="divide-y">
                {(events.data ?? []).map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.starts_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {String(event.event_type).replace(/_/g, " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <FacultyExamPanel facultyId={faculty.id} userId={user?.id ?? null} />
    </>
  );
}
