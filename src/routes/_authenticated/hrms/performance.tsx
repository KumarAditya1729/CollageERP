import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target } from "lucide-react";
import { useAppraisalCycles, useAppraisals, useGoals } from "@/hooks/hrms/usePerformance";
import { AppraisalForm } from "@/components/hrms/AppraisalForm";

export const Route = createFileRoute("/_authenticated/hrms/performance")({
  component: PerformancePage,
});

function PerformancePage() {
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>();
  const { data: cycles } = useAppraisalCycles();
  const { data: appraisals } = useAppraisals(selectedCycleId);
  const { data: goals } = useGoals();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
          <p className="text-muted-foreground">Goals, KPIs, Appraisals, and 360° Feedback</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Appraisal Cycle
        </Button>
      </div>

      <Tabs defaultValue="appraisals">
        <TabsList>
          <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
          <TabsTrigger value="goals">Goals & KPIs ({goals?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="appraisals" className="mt-4 space-y-4">
          {/* Cycle Selector */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCycleId === undefined ? "default" : "outline"}
              onClick={() => setSelectedCycleId(undefined)}
            >
              All Cycles
            </Button>
            {cycles?.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={selectedCycleId === c.id ? "default" : "outline"}
                onClick={() => setSelectedCycleId(c.id)}
              >
                {c.name}
                <Badge className="ml-2 text-xs" variant="secondary">
                  {c.status}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {appraisals?.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      {a.staff_id
                        ? `Staff: ${a.staff_id.split("-")[0]}`
                        : `Faculty: ${a.faculty_id?.split("-")[0]}`}
                    </CardTitle>
                    <Badge variant="secondary">{a.status?.replace("_", " ") ?? "-"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {a.self_rating !== null && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Self Rating</span>
                        <span>{a.self_rating}/5</span>
                      </div>
                      <Progress value={(a.self_rating / 5) * 100} className="h-2" />
                    </div>
                  )}
                  {a.final_rating !== null && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Final Rating</span>
                        <span className="font-semibold text-primary">{a.final_rating}/5</span>
                      </div>
                      <Progress value={(a.final_rating / 5) * 100} className="h-2" />
                    </div>
                  )}
                  {a.status === "draft" && <AppraisalForm appraisalId={a.id} mode="self" />}
                </CardContent>
              </Card>
            ))}
            {(appraisals?.length ?? 0) === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No appraisals found. Start a new cycle to begin.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <div className="space-y-3">
            {goals?.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{goal.title}</p>
                    {goal.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(goal.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {goal.target_value !== null && (
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {goal.achieved_value ?? 0} / {goal.target_value}
                      </p>
                      <Progress
                        value={((goal.achieved_value ?? 0) / goal.target_value) * 100}
                        className="h-1.5 w-24 mt-1"
                      />
                    </div>
                  )}
                  <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                    {goal.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {(goals?.length ?? 0) === 0 && (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No goals defined yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
