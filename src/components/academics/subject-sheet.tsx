import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EntityComments } from "@/components/common/entity-comments";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { labelize, useAcademicLookups } from "@/hooks/useAcademics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface SubjectRow extends Record<string, unknown> {
  id: string;
  tenant_id?: string;
  code: string;
  title: string;
  type: string;
  credits: number | null;
  lecture_hours: number | null;
  tutorial_hours: number | null;
  practical_hours: number | null;
  department_id: string | null;
  program_id: string | null;
  semester_id: string | null;
  is_active: boolean;
  description: string | null;
}

interface OutcomeRow {
  id: string;
  code: string;
  description: string;
  bloom_level: string | null;
}

interface PrereqRow {
  id: string;
  prerequisite_course_id: string;
  kind: string;
}

interface MappingRow {
  id: string;
  course_outcome_id: string;
  program_outcome_id: string;
  strength: number;
}

export function SubjectSheet({
  subject,
  onOpenChange,
}: {
  subject: SubjectRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { can } = useAccess();
  const { user } = useAuth();
  const canManage = can("course.manage");
  const queryClient = useQueryClient();
  const { courses, programs } = useAcademicLookups();

  const [outcomeCode, setOutcomeCode] = useState("");
  const [outcomeText, setOutcomeText] = useState("");
  const [bloom, setBloom] = useState("");
  const [prereqId, setPrereqId] = useState("");
  const [prereqKind, setPrereqKind] = useState("prerequisite");
  const [mapCo, setMapCo] = useState("");
  const [mapPo, setMapPo] = useState("");
  const [strength, setStrength] = useState("3");

  const outcomes = useQuery({
    queryKey: ["course-outcomes", subject?.id],
    enabled: Boolean(subject?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_outcomes" as never)
        .select("id, code, description, bloom_level")
        .eq("course_id", subject!.id)
        .is("deleted_at", null)
        .order("code");
      if (error) throw error;
      return (data ?? []) as unknown as OutcomeRow[];
    },
  });

  const prereqs = useQuery({
    queryKey: ["course-prereqs", subject?.id],
    enabled: Boolean(subject?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_prerequisites" as never)
        .select("id, prerequisite_course_id, kind")
        .eq("course_id", subject!.id)
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as unknown as PrereqRow[];
    },
  });

  const programOutcomes = useQuery({
    queryKey: ["program-outcomes", subject?.program_id],
    enabled: Boolean(subject?.program_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_outcomes" as never)
        .select("id, code, description")
        .eq("program_id", subject!.program_id as string)
        .is("deleted_at", null)
        .order("code");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; code: string; description: string }[];
    },
  });

  const mappings = useQuery({
    queryKey: ["co-po-mappings", subject?.id, outcomes.data?.length],
    enabled: Boolean(subject?.id) && (outcomes.data?.length ?? 0) > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("co_po_mappings" as never)
        .select("id, course_outcome_id, program_outcome_id, strength")
        .in(
          "course_outcome_id",
          (outcomes.data ?? []).map((row) => row.id),
        )
        .is("deleted_at", null);
      if (error) throw error;
      return (data ?? []) as unknown as MappingRow[];
    },
  });

  const invalidate = (keys: string[]) => {
    for (const key of keys) void queryClient.invalidateQueries({ queryKey: [key] });
  };

  const addOutcome = useMutation({
    mutationFn: async () => {
      if (!outcomeCode.trim() || !outcomeText.trim())
        throw new Error("Code and description are required");
      const { error } = await supabase.from("course_outcomes" as never).insert({
        tenant_id: subject!.tenant_id,
        course_id: subject!.id,
        code: outcomeCode.trim(),
        description: outcomeText.trim(),
        bloom_level: bloom.trim() || null,
        created_by: user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course outcome added");
      setOutcomeCode("");
      setOutcomeText("");
      setBloom("");
      invalidate(["course-outcomes"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeOutcome = useMutationFactory(
    "course_outcomes",
    ["course-outcomes", "co-po-mappings"],
    user?.id,
    invalidate,
  );
  const removePrereq = useMutationFactory(
    "course_prerequisites",
    ["course-prereqs"],
    user?.id,
    invalidate,
  );
  const removeMapping = useMutationFactory(
    "co_po_mappings",
    ["co-po-mappings"],
    user?.id,
    invalidate,
  );

  const addPrereq = useMutation({
    mutationFn: async () => {
      if (!prereqId) throw new Error("Choose a subject");
      const { error } = await supabase.from("course_prerequisites" as never).insert({
        tenant_id: subject!.tenant_id,
        course_id: subject!.id,
        prerequisite_course_id: prereqId,
        kind: prereqKind,
        created_by: user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Requirement linked");
      setPrereqId("");
      invalidate(["course-prereqs"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addMapping = useMutation({
    mutationFn: async () => {
      if (!mapCo || !mapPo) throw new Error("Choose a CO and a PO");
      const { error } = await supabase.from("co_po_mappings" as never).insert({
        tenant_id: subject!.tenant_id,
        course_outcome_id: mapCo,
        program_outcome_id: mapPo,
        strength: Number(strength) || 1,
        created_by: user?.id,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("CO–PO mapping saved");
      invalidate(["co-po-mappings"]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const programName =
    programs.data?.find((p) => p.id === subject?.program_id)?.name ?? "No programme";

  return (
    <Sheet open={Boolean(subject)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        {subject ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {subject.code} — {subject.title}
                <Badge variant="outline">{labelize(subject.type)}</Badge>
              </SheetTitle>
              <SheetDescription>
                {programName} · {subject.credits ?? 0} credits · L{subject.lecture_hours ?? 0}-T
                {subject.tutorial_hours ?? 0}-P{subject.practical_hours ?? 0}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-8">
              <Tabs defaultValue="outcomes" className="space-y-4">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                  <TabsTrigger value="requirements">Prerequisites</TabsTrigger>
                  <TabsTrigger value="mapping">CO–PO mapping</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="outcomes" className="space-y-4">
                  {canManage ? (
                    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-4">
                      <div className="space-y-1.5">
                        <Label>Code</Label>
                        <Input
                          value={outcomeCode}
                          placeholder="CO1"
                          onChange={(event) => setOutcomeCode(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bloom level</Label>
                        <Input
                          value={bloom}
                          placeholder="Apply"
                          onChange={(event) => setBloom(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-4">
                        <Label>Outcome statement</Label>
                        <Textarea
                          rows={2}
                          value={outcomeText}
                          onChange={(event) => setOutcomeText(event.target.value)}
                          placeholder="On completion, the learner is able to…"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <Button
                          size="sm"
                          disabled={addOutcome.isPending}
                          onClick={() => addOutcome.mutate()}
                        >
                          <Plus className="size-4" />
                          Add outcome
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {outcomes.isLoading ? (
                    <InlineLoader label="Loading outcomes" />
                  ) : (outcomes.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No course outcomes defined yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(outcomes.data ?? []).map((row) => (
                        <li
                          key={row.id}
                          className="flex items-start justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {row.code}
                              {row.bloom_level ? (
                                <Badge variant="outline">{row.bloom_level}</Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">{row.description}</p>
                          </div>
                          {canManage ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Remove outcome"
                              onClick={() => removeOutcome.mutate(row.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="requirements" className="space-y-4">
                  {canManage ? (
                    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Subject</Label>
                        <Select value={prereqId} onValueChange={setPrereqId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {(courses.data ?? [])
                              .filter((course) => course.id !== subject.id)
                              .map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.code} — {course.title}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select value={prereqKind} onValueChange={setPrereqKind}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prerequisite">Prerequisite</SelectItem>
                            <SelectItem value="corequisite">Co-requisite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-3">
                        <Button
                          size="sm"
                          disabled={addPrereq.isPending}
                          onClick={() => addPrereq.mutate()}
                        >
                          <Plus className="size-4" />
                          Link subject
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {prereqs.isLoading ? (
                    <InlineLoader label="Loading requirements" />
                  ) : (prereqs.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No prerequisites or co-requisites linked.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {(prereqs.data ?? []).map((row) => {
                        const course = courses.data?.find(
                          (c) => c.id === row.prerequisite_course_id,
                        );
                        return (
                          <li
                            key={row.id}
                            className="flex items-center justify-between rounded-lg border p-3 text-sm"
                          >
                            <span>
                              {course ? `${course.code} — ${course.title}` : "Unknown subject"}{" "}
                              <Badge variant="outline">{labelize(row.kind)}</Badge>
                            </span>
                            {canManage ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Remove requirement"
                                onClick={() => removePrereq.mutate(row.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="mapping" className="space-y-4">
                  {(programOutcomes.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Define programme outcomes for {programName} first — they are managed on the
                      programme profile.
                    </p>
                  ) : (
                    <>
                      {canManage ? (
                        <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-4">
                          <div className="space-y-1.5">
                            <Label>Course outcome</Label>
                            <Select value={mapCo} onValueChange={setMapCo}>
                              <SelectTrigger>
                                <SelectValue placeholder="CO" />
                              </SelectTrigger>
                              <SelectContent>
                                {(outcomes.data ?? []).map((row) => (
                                  <SelectItem key={row.id} value={row.id}>
                                    {row.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Programme outcome</Label>
                            <Select value={mapPo} onValueChange={setMapPo}>
                              <SelectTrigger>
                                <SelectValue placeholder="PO" />
                              </SelectTrigger>
                              <SelectContent>
                                {(programOutcomes.data ?? []).map((row) => (
                                  <SelectItem key={row.id} value={row.id}>
                                    {row.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Strength (1–3)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={3}
                              value={strength}
                              onChange={(event) => setStrength(event.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              disabled={addMapping.isPending}
                              onClick={() => addMapping.mutate()}
                            >
                              <Plus className="size-4" />
                              Map
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {(mappings.data ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No CO–PO mappings recorded yet.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {(mappings.data ?? []).map((row) => {
                            const co = outcomes.data?.find((o) => o.id === row.course_outcome_id);
                            const po = programOutcomes.data?.find(
                              (o) => o.id === row.program_outcome_id,
                            );
                            return (
                              <li
                                key={row.id}
                                className="flex items-center justify-between rounded-lg border p-3 text-sm"
                              >
                                <span>
                                  {co?.code ?? "CO"} → {po?.code ?? "PO"}{" "}
                                  <Badge variant="secondary">strength {row.strength}</Badge>
                                </span>
                                {canManage ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label="Remove mapping"
                                    onClick={() => removeMapping.mutate(row.id)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="comments">
                  <EntityComments entityType="courses" entityId={subject.id} />
                </TabsContent>
                <TabsContent value="timeline">
                  <EntityTimeline entityType="courses" entityId={subject.id} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** Soft-deletes a child row and refreshes the given query keys. */
function useMutationFactory(
  table: string,
  keys: string[],
  userId: string | undefined,
  invalidate: (keys: string[]) => void,
) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as never)
        .update({ deleted_at: new Date().toISOString(), deleted_by: userId } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      invalidate(keys);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
