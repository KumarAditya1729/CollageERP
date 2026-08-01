import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardCheck, FileText, ListChecks } from "lucide-react";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { labelize, round2 } from "@/lib/exams";
import { formatDate, formatDateTime } from "@/lib/export";

/** Faculty-facing examination panel: duties, marks entry queue, evaluation and papers. */
export function FacultyExamPanel({
  facultyId,
  userId,
}: {
  facultyId: string;
  userId: string | null;
}) {
  const duties = useQuery({
    queryKey: ["faculty-invigilation", facultyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_invigilators")
        .select(
          "id, duty_role, attendance_status, reported_at, departed_at, exam_id, exams(title, exam_date, starts_at), exam_rooms(rooms(name))",
        )
        .eq("faculty_id", facultyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const allocations = useQuery({
    queryKey: ["faculty-allocations-exams", facultyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty_allocations")
        .select("id, course_id, role, courses(code, title)")
        .eq("faculty_id", facultyId)
        .is("deleted_at", null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const courseIds = (allocations.data ?? [])
    .map((row) => row.course_id)
    .filter(Boolean) as string[];

  const exams = useQuery({
    queryKey: ["faculty-exams", courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id, title, status, exam_date, max_marks, course_id, courses(code, title)")
        .in("course_id", courseIds)
        .is("deleted_at", null)
        .order("exam_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const examIds = (exams.data ?? []).map((row) => row.id);

  const marks = useQuery({
    queryKey: ["faculty-marks", examIds.join(",")],
    enabled: examIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("id, exam_id, status, marks_obtained, final_marks, max_marks, is_absent")
        .in("exam_id", examIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const papers = useQuery({
    queryKey: ["faculty-papers", userId, courseIds.join(",")],
    enabled: courseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_papers")
        .select("id, code, title, status, release_at, total_marks, course_id, courses(code)")
        .in("course_id", courseIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pendingDuties = (duties.data ?? []).filter(
    (row) => row.attendance_status === "pending",
  ).length;
  const drafts = (marks.data ?? []).filter((row) => row.status === "draft").length;
  const submitted = (marks.data ?? []).filter((row) => row.status === "submitted").length;
  const pendingPapers = (papers.data ?? []).filter(
    (row) => row.status === "pending_approval",
  ).length;

  const perExam = (exams.data ?? []).map((exam) => {
    const rows = (marks.data ?? []).filter((row) => row.exam_id === exam.id);
    const scored = rows.filter((row) => !row.is_absent);
    const average = scored.length
      ? round2(scored.reduce((sum, row) => sum + Number(row.final_marks ?? 0), 0) / scored.length)
      : 0;
    return {
      id: exam.id,
      title: exam.title,
      course: (exam.courses as { code?: string } | null)?.code ?? "—",
      date: exam.exam_date,
      entered: rows.length,
      pending: rows.filter((row) => row.status === "draft").length,
      average,
      status: exam.status,
    };
  });

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Examinations</CardTitle>
        <CardDescription>
          Your invigilation duties, marks entry queue, evaluation progress and question papers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Duties pending" value={pendingDuties} />
          <StatCard label="Marks in draft" value={drafts} />
          <StatCard label="Awaiting approval" value={submitted} />
          <StatCard label="Papers in review" value={pendingPapers} />
        </div>

        <Tabs defaultValue="duties" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="duties">Invigilation</TabsTrigger>
            <TabsTrigger value="marks">Marks entry</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="papers">Question papers</TabsTrigger>
          </TabsList>

          <TabsContent value="duties">
            {duties.data?.length ? (
              <ul className="divide-y rounded-lg border">
                {duties.data.map((row) => {
                  const exam = row.exams as {
                    title?: string;
                    exam_date?: string;
                    starts_at?: string;
                  } | null;
                  const room = (row.exam_rooms as { rooms?: { name?: string } | null } | null)
                    ?.rooms;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{exam?.title ?? "Examination"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(exam?.exam_date ?? null)} ·{" "}
                          {room?.name ?? "Hall to be assigned"} · reported{" "}
                          {formatDateTime(row.reported_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{labelize(row.duty_role)}</Badge>
                        <Badge
                          variant={row.attendance_status === "present" ? "secondary" : "outline"}
                        >
                          {labelize(row.attendance_status)}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No invigilation duties"
                description="Duties assigned by the exam office appear here."
              />
            )}
          </TabsContent>

          <TabsContent value="marks" className="space-y-3">
            {perExam.length ? (
              <ul className="divide-y rounded-lg border">
                {perExam.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {row.course} · {row.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(row.date)} · {row.entered} entered · {row.pending} in draft
                      </p>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/exams/marks">Open sheet</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No papers allocated"
                description="Marks sheets appear once you are allocated to a course with a scheduled exam."
              />
            )}
          </TabsContent>

          <TabsContent value="evaluation">
            {perExam.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">Paper</th>
                      <th>Status</th>
                      <th>Evaluated</th>
                      <th>Pending</th>
                      <th>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perExam.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="p-3">
                          {row.course} · {row.title}
                        </td>
                        <td>
                          <Badge variant="outline">{labelize(row.status)}</Badge>
                        </td>
                        <td>{row.entered - row.pending}</td>
                        <td>{row.pending}</td>
                        <td>{row.average}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="Nothing to evaluate"
                description="Evaluation progress appears per allocated paper."
              />
            )}
          </TabsContent>

          <TabsContent value="papers">
            {papers.data?.length ? (
              <ul className="divide-y rounded-lg border">
                {papers.data.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {(row.courses as { code?: string } | null)?.code ?? "—"} · {row.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.code} · {row.total_marks} marks
                        {row.release_at ? ` · releases ${formatDateTime(row.release_at)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{labelize(row.status)}</Badge>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/exams/papers">Open</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FileText}
                title="No question papers"
                description="Papers for your allocated courses appear here."
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
