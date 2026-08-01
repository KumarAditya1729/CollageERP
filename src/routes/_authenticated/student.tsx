import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";

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
import { StudentExamPanel } from "@/components/exams/student-exam-panel";
import { formatDate, formatDateTime } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/student")({
  head: () => ({
    meta: [
      { title: "My studies — CampusOS" },
      {
        name: "description",
        content: "Your enrolled courses, academic profile, calendar and college notifications.",
      },
      { property: "og:title", content: "My studies — CampusOS" },
      { property: "og:description", content: "Your student portal on CampusOS." },
    ],
  }),
  component: StudentPortal,
});

function StudentPortal() {
  const { user } = useAuth();
  const { tenant } = useAccess();
  const { active: notifications } = useNotifications();

  const record = useQuery({
    queryKey: ["my-student-record", user?.id, tenant?.id],
    enabled: Boolean(user?.id && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, admission_number, roll_number, first_name, last_name, status, admission_date, program_id, department_id, current_semester_id",
        )
        .eq("tenant_id", tenant!.id)
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const enrollments = useQuery({
    queryKey: ["my-enrollments", record.data?.id],
    enabled: Boolean(record.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, status, courses(code, title, credits)")
        .eq("student_id", record.data!.id)
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const events = useQuery({
    queryKey: ["my-events", tenant?.id],
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

  if (record.isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/50" />;
  }

  if (!record.data) {
    return (
      <>
        <PageHeader
          title="My studies"
          description="Your personal student portal."
          crumbs={[{ label: "Overview" }, { label: "My studies" }]}
        />
        <EmptyState
          icon={GraduationCap}
          title="No student record linked to your account"
          description="Ask your registrar to link your college account to a student record to see courses, results and fees here."
        />
      </>
    );
  }

  const student = record.data;
  const courses = enrollments.data ?? [];
  const credits = courses.reduce(
    (total, row) => total + ((row.courses as { credits?: number } | null)?.credits ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title={`Hello, ${student.first_name}`}
        description={`Admission ${student.admission_number}${student.roll_number ? ` · Roll ${student.roll_number}` : ""} · Admitted ${formatDate(student.admission_date)}`}
        crumbs={[{ label: "Overview" }, { label: "My studies" }]}
        actions={
          <Badge variant="outline" className="capitalize">
            {student.status.replace(/_/g, " ")}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled courses" value={courses.length} icon={BookOpen} />
        <StatCard label="Credit load" value={credits} icon={GraduationCap} />
        <StatCard label="Upcoming events" value={events.data?.length ?? 0} icon={CalendarDays} />
        <StatCard
          label="Unread notifications"
          value={notifications.filter((n) => !n.read_at).length}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My courses</CardTitle>
            <CardDescription>Courses you are currently enrolled in.</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <EmptyState
                title="No enrolments yet"
                description="Your course registrations will appear here."
              />
            ) : (
              <ul className="divide-y">
                {courses.map((row) => {
                  const course = row.courses as {
                    code: string;
                    title: string;
                    credits: number;
                  } | null;
                  return (
                    <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{course?.title ?? "Course"}</p>
                        <p className="text-xs text-muted-foreground">
                          {course?.code} · {course?.credits ?? 0} credits
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {row.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic calendar</CardTitle>
            <CardDescription>Upcoming exams, holidays and college events.</CardDescription>
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

      <StudentExamPanel
        studentId={record.data.id}
        studentName={`${record.data.first_name} ${record.data.last_name ?? ""}`.trim()}
        rollNumber={record.data.roll_number}
        admissionNumber={record.data.admission_number}
        programName={null}
        collegeName={tenant?.name ?? "CampusOS"}
        collegeLogo={tenant?.logo_url ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Messages from your college.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="College announcements will appear here."
            />
          ) : (
            <ul className="divide-y">
              {notifications.slice(0, 5).map((item) => (
                <li key={item.id} className="py-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.body ? <p className="text-xs text-muted-foreground">{item.body}</p> : null}
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/notifications">Open notification center</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
