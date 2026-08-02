import { CheckCircle2, ClipboardList, Award } from "lucide-react";

import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

import {
  useContentItems,
  useProgressRows,
  useAssignments,
  useSubmissions,
  useQuizzes,
  useQuizAttempts,
} from "@/hooks/useLMS";
import { riskLevel } from "@/lib/lms";

export function AnalyticsTab({ workspace }: { workspace: any }) {
  const contentItems = useContentItems();
  const progressRows = useProgressRows();
  const workspaceContent =
    contentItems.data?.filter((c) => c.workspace_id === workspace.id) ?? [];

  const assignments = useAssignments();
  const submissions = useSubmissions();
  const workspaceAssignments =
    assignments.data?.filter((a) => a.workspace_id === workspace.id) ?? [];

  const quizzes = useQuizzes();
  const quizAttempts = useQuizAttempts();
  const workspaceQuizzes = quizzes.data?.filter((q) => q.workspace_id === workspace.id) ?? [];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Completed Content Modules"
          value={`${progressRows.data?.filter((p) => p.state === "completed").length ?? 0} / ${workspaceContent.length}`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Assigned Homework Submitted"
          value={`${submissions.data?.length ?? 0} / ${workspaceAssignments.length}`}
          icon={ClipboardList}
        />
        <StatCard
          label="Online Exam Attempts"
          value={`${quizAttempts.data?.length ?? 0} / ${workspaceQuizzes.length}`}
          icon={Award}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Student Activity Heatmap (Simulated)
            </CardTitle>
            <CardDescription>Activity level over the past weeks.</CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }).map((_, idx) => {
                const intensities = [
                  "bg-emerald-50",
                  "bg-emerald-100",
                  "bg-emerald-200",
                  "bg-emerald-300",
                  "bg-emerald-400",
                ];
                const randomIntensity =
                  intensities[Math.floor(Math.random() * intensities.length)];
                return (
                  <div
                    key={idx}
                    className={`h-8 rounded cursor-pointer transition-colors ${randomIntensity}`}
                    title={`Day ${idx + 1}: Active Engagement`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Learner Engagement Risks</CardTitle>
            <CardDescription>System analysis of student performance risks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Content Completion</th>
                  <th className="p-3">Assignment Rate</th>
                  <th className="p-3">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/10">
                  <td className="p-3 font-medium">Demo Learner</td>
                  <td className="p-3">
                    {workspaceContent.length
                      ? Math.round(
                          ((progressRows.data?.filter((p) => p.state === "completed").length ??
                            0) /
                            workspaceContent.length) *
                            100,
                        )
                      : 0}
                    %
                  </td>
                  <td className="p-3">
                    {workspaceAssignments.length
                      ? Math.round(
                          ((submissions.data?.length ?? 0) / workspaceAssignments.length) * 100,
                        )
                      : 0}
                    %
                  </td>
                  <td className="p-3">
                    <Badge variant={riskLevel(70, 80, 75).tone}>
                      {riskLevel(70, 80, 75).label}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
