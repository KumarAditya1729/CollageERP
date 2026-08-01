import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useShifts } from "@/hooks/hrms/useShifts";

export const Route = createFileRoute("/_authenticated/hrms/shifts")({
  component: ShiftsPage,
});

function ShiftsPage() {
  const { data: shifts, isLoading } = useShifts();

  if (isLoading) return <div className="p-8">Loading shifts...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground">
            Manage shift templates, rosters, and weekly schedules
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Shift
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shifts?.map((shift) => (
          <Card key={shift.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{shift.name}</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{shift.code}</p>
                </div>
                <div className="flex gap-1">
                  {shift.is_night_shift && <Badge variant="secondary">Night</Badge>}
                  {shift.is_flexi && <Badge variant="outline">Flexi</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {shift.start_time} – {shift.end_time}
                </span>
              </div>
              <div className="text-sm flex justify-between">
                <span className="text-muted-foreground">Work Hours</span>
                <span className="font-medium">{shift.work_hours} hrs</span>
              </div>
              <div className="text-sm flex justify-between">
                <span className="text-muted-foreground">Grace Period</span>
                <span className="font-medium">{shift.grace_minutes} min</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {shifts?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No shifts defined. Add a shift template to get started.
          </div>
        )}
      </div>
    </div>
  );
}
