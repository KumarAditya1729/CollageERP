import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExamConflict } from "@/lib/exams";

/** Live student / faculty / room / backlog clash detection for the exam timetable. */
export function ExamConflictsPanel({
  conflicts,
  loading,
}: {
  conflicts: ExamConflict[];
  loading?: boolean;
}) {
  const errors = conflicts.filter((row) => row.severity === "error");

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Conflict detection</CardTitle>
        <CardDescription>
          Student, faculty, room and backlog clashes recomputed from the live exam timetable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking the schedule…</p>
        ) : conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No clashes detected — the timetable is ready for auto-scheduling and publication.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant={errors.length ? "destructive" : "secondary"}>
                {errors.length} blocking
              </Badge>
              <Badge variant="outline">{conflicts.length - errors.length} advisory</Badge>
            </div>
            {conflicts.map((conflict, index) => (
              <Alert
                key={index}
                variant={conflict.severity === "error" ? "destructive" : "default"}
              >
                <TriangleAlert className="size-4" />
                <AlertTitle className="capitalize">{conflict.kind} conflict</AlertTitle>
                <AlertDescription>{conflict.message}</AlertDescription>
              </Alert>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
