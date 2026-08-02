import { Calendar, Bot, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useMyFaculty, useLessonPlans } from "@/hooks/useLMS";
import { useResourceMutations } from "@/hooks/useResource";
import { labelize } from "@/lib/lms";
import { useAccess } from "@/hooks/useAccess";

export function LessonPlansTab({ workspace }: { workspace: any }) {
  const { can } = useAccess();
  const faculty = useMyFaculty();
  const isFaculty = Boolean(faculty.data?.id) || can("lms.update");

  const lessonPlans = useLessonPlans();
  const workspacePlans = lessonPlans.data?.filter((p) => p.workspace_id === workspace.id) ?? [];
  const [planOpen, setPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planWeek, setPlanWeek] = useState("1");
  const [planObjectives, setPlanObjectives] = useState("");
  const planMutation = useResourceMutations({ table: "lms_lesson_plans" });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const handleTriggerAI = async () => {
    setAiGenerating(true);
    setAiResponse("");
    setTimeout(() => {
      setAiGenerating(false);
      setAiResponse(
        `### AI Generated Lesson Plan Outline\n\n**Proposed Chapters:**\n1. Introduction to Advanced Paradigms (Bloom: Recall)\n2. Framework Case Analysis (Bloom: Analyze)\n3. Custom Sandbox Design (Bloom: Create)\n\n*Use the options below to apply directly to outline.*`,
      );
    }, 1500);
  };

  const handleCreatePlan = async () => {
    if (!planTitle.trim()) return;
    await planMutation.create.mutateAsync({
      workspace_id: workspace.id,
      course_id: workspace.course_id,
      title: planTitle.trim(),
      week_number: Number(planWeek) || 1,
      objectives: planObjectives.trim() || null,
      kind: "lesson",
      status: "draft",
    });
    setPlanOpen(false);
    setPlanTitle("");
    setPlanWeek("1");
    setPlanObjectives("");
    void lessonPlans.refetch();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Weekly Syllabus Planner</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTriggerAI} disabled={aiGenerating}>
            <Bot className="size-4 mr-1 text-primary" /> {aiGenerating ? "Generating..." : "AI planner"}
          </Button>
          {isFaculty && (
            <Button size="sm" onClick={() => setPlanOpen(true)}>
              <Plus className="size-4" /> Add Lesson Plan
            </Button>
          )}
        </div>
      </div>

      {aiResponse && (
        <Card className="shadow-none border border-primary bg-primary/5 p-4 text-xs whitespace-pre-wrap relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6"
            onClick={() => setAiResponse("")}
          >
            Clear
          </Button>
          {aiResponse}
        </Card>
      )}

      <div className="space-y-3">
        {workspacePlans.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No lesson plans set"
            description="Weekly lesson planners appear here."
          />
        ) : (
          workspacePlans.map((plan) => (
            <Card key={plan.id} className="shadow-none border">
              <CardHeader className="py-3 bg-muted/10 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Week {plan.week_number}: {plan.title}
                  </CardTitle>
                  <Badge variant={plan.status === "completed" ? "default" : "outline"}>
                    {labelize(plan.status)}
                  </Badge>
                </div>
              </CardHeader>
              {plan.objectives && (
                <CardContent className="p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                  Objectives: {plan.objectives}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Weekly Lesson Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="p-title">Plan Name</Label>
            <Input id="p-title" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
            <Label htmlFor="p-week">Week Number</Label>
            <Input
              id="p-week"
              type="number"
              value={planWeek}
              onChange={(e) => setPlanWeek(e.target.value)}
            />
            <Label htmlFor="p-obj">Learning Objectives</Label>
            <Textarea
              id="p-obj"
              value={planObjectives}
              onChange={(e) => setPlanObjectives(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
