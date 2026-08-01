import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Search } from "lucide-react";
import { useHRAttendance } from "@/hooks/hrms/useHRAttendance";

export const Route = createFileRoute("/_authenticated/hrms/attendance")({
  component: HRAttendancePage,
});

function HRAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: attendance, isLoading } = useHRAttendance({ from: date, to: date });

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    present: "default",
    absent: "destructive",
    half_day: "secondary",
    late: "secondary",
    on_leave: "outline",
    holiday: "outline",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Attendance</h1>
          <p className="text-muted-foreground">Track daily attendance for all staff and faculty</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Mark Attendance
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search employee..." />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {attendance?.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant={statusColor[rec.status] ?? "secondary"}>
                    {rec.status.replace("_", " ")}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{rec.staff_id ?? rec.faculty_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.source} · {rec.date}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {rec.check_in && <p>In: {new Date(rec.check_in).toLocaleTimeString()}</p>}
                  {rec.check_out && <p>Out: {new Date(rec.check_out).toLocaleTimeString()}</p>}
                  {rec.overtime_minutes > 0 && (
                    <p className="text-amber-600 text-xs">OT: {rec.overtime_minutes}m</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {attendance?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              No attendance records for this date.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
