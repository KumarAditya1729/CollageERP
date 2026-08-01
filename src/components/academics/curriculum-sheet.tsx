import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EntityComments } from "@/components/common/entity-comments";
import { EntityDocuments } from "@/components/common/entity-documents";
import { EntityTimeline } from "@/components/common/entity-timeline";
import { InlineLoader } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/hooks/useAccess";
import { curriculumCategories, labelize, useAcademicLookups } from "@/hooks/useAcademics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface CurriculumRow extends Record<string, unknown> {
  id: string;
  name: string;
  version: string;
  program_id: string;
  regulation: string | null;
  status: string;
  effective_from: string | null;
  effective_to: string | null;
  total_credits: number | null;
  notes: string | null;
}

interface CurriculumCourseRow {
  id: string;
  course_id: string;
  semester_number: number;
  category: string;
  credits: number | null;
  is_mandatory: boolean;
}

const statusFlow: Record<string, { next: string; label: string }[]> = {
  draft: [{ next: "pending_approval", label: "Send for approval" }],
  pending_approval: [
    { next: "active", label: "Approve & activate" },
    { next: "draft", label: "Return to draft" },
  ],
  active: [
    { next: "superseded", label: "Mark superseded" },
    { next: "archived", label: "Archive" },
  ],
  superseded: [{ next: "archived", label: "Archive" }],
  archived: [{ next: "draft", label: "Reopen as draft" }],
};

export function CurriculumSheet({
  curriculum,
  onOpenChange,
}: {
  curriculum: CurriculumRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { can } = useAccess();
  const { user } = useAuth();
  const canManage = can("curriculum.manage");
  const queryClient = useQueryClient();
  const { courses, programs } = useAcademicLookups();

  const [courseId, setCourseId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("1");
  const [category, setCategory] = useState<string>("core");
  const [credits, setCredits] = useState("");

  const items = useQuery({
    queryKey: ["curriculum-courses", curriculum?.id],
    enabled: Boolean(curriculum?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curriculum_courses" as never)
        .select("id, course_id, semester_number, category, credits, is_mandatory")
        .eq("curriculum_id", curriculum!.id)
        .is("deleted_at", null)
        .order("semester_number");
      if (error) throw error;
      return (data ?? []) as unknown as CurriculumCourseRow[];
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["curriculum-courses", curriculum?.id] });
    void queryClient.invalidateQueries({ queryKey: ["resource", "curricula"] });
  };

  const addCourse = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error("Choose a subject first");
      const course = courses.data?.find((c) => c.id === courseId);
      const { error } = await supabase.from("curriculum_courses" as never).insert({
        tenant_id: (curriculum as unknown as { tenant_id?: string })?.tenant_id,
        curriculum_id: curriculum!.id,
        course_id: courseId,
        semester_number: Number(semesterNumber) || 1,
        category,
        credits: credits === "" ? (course?.credits ?? null) : Number(credits),
        created_by: user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subject added to curriculum");
      setCourseId("");
      setCredits("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("curriculum_courses" as never)
        .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subject removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeStatus = useMutation({
    mutationFn: async (next: string) => {
      const patch: Record<string, unknown> = { status: next };
      if (next === "active") {
        patch.approved_by = user?.id;
        patch.approved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("curricula" as never)
        .update(patch as never)
        .eq("id", curriculum!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Curriculum status updated");
      invalidate();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = items.data ?? [];
  const totalCredits = rows.reduce((sum, row) => sum + Number(row.credits ?? 0), 0);
  const programName = programs.data?.find((p) => p.id === curriculum?.program_id)?.name ?? "—";

  return (
    <Sheet open={Boolean(curriculum)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        {curriculum ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {curriculum.name}
                <Badge variant={curriculum.status === "active" ? "default" : "secondary"}>
                  {labelize(curriculum.status)}
                </Badge>
                <Badge variant="outline">v{curriculum.version}</Badge>
              </SheetTitle>
              <SheetDescription>
                {programName} · {curriculum.regulation ?? "No regulation set"} ·{" "}
                {curriculum.effective_from ?? "no start date"} →{" "}
                {curriculum.effective_to ?? "open ended"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-8">
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  {(statusFlow[curriculum.status] ?? []).map((action) => (
                    <Button
                      key={action.next}
                      size="sm"
                      variant={action.next === "active" ? "default" : "outline"}
                      disabled={changeStatus.isPending}
                      onClick={() => changeStatus.mutate(action.next)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              ) : null}

              <Tabs defaultValue="subjects" className="space-y-4">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="subjects" className="space-y-4">
                  {canManage ? (
                    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-5">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Subject</Label>
                        <Select value={courseId} onValueChange={setCourseId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {(courses.data ?? []).map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.code} — {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Semester</Label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={semesterNumber}
                          onChange={(event) => setSemesterNumber(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {curriculumCategories.map((value) => (
                              <SelectItem key={value} value={value}>
                                {labelize(value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Credits</Label>
                        <Input
                          type="number"
                          min={0}
                          value={credits}
                          placeholder="auto"
                          onChange={(event) => setCredits(event.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <Button
                          size="sm"
                          disabled={addCourse.isPending || !courseId}
                          onClick={() => addCourse.mutate()}
                        >
                          <Plus className="size-4" />
                          Add subject
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {items.isLoading ? (
                    <InlineLoader label="Loading curriculum subjects" />
                  ) : rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No subjects mapped yet. Add core, elective, lab, project and value-added
                      subjects to build the CBCS/NEP credit structure.
                    </p>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sem</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Credits</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row) => {
                            const course = courses.data?.find((c) => c.id === row.course_id);
                            return (
                              <TableRow key={row.id}>
                                <TableCell>{row.semester_number}</TableCell>
                                <TableCell className="font-medium">
                                  {course ? `${course.code} — ${course.title}` : "Unknown subject"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{labelize(row.category)}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{row.credits ?? "—"}</TableCell>
                                <TableCell>
                                  {canManage ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      aria-label="Remove subject"
                                      onClick={() => removeCourse.mutate(row.id)}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  ) : null}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {rows.length} subjects · {totalCredits} credits mapped
                    {curriculum.total_credits ? ` of ${curriculum.total_credits} planned` : ""}.
                  </p>
                </TabsContent>

                <TabsContent value="documents">
                  <EntityDocuments
                    entityType="curricula"
                    entityId={curriculum.id}
                    canManage={canManage}
                  />
                </TabsContent>
                <TabsContent value="comments">
                  <EntityComments entityType="curricula" entityId={curriculum.id} />
                </TabsContent>
                <TabsContent value="timeline">
                  <EntityTimeline entityType="curricula" entityId={curriculum.id} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
