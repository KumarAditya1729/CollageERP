/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useHostelAttendance,
  useCreateHostelAttendance,
  useUpdateHostelAttendance,
  useDeleteHostelAttendance,
  useHostelAllocations,
} from "@/hooks/hostel/useHostel";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/hostel/attendance")({
  component: HostelAttendancePage,
});

function AttendanceCard({ item }: { item: any }) {
  const isPresent = item.status === "present";
  const isLeave = item.status === "on_leave";

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
        <h3 className="font-semibold text-base line-clamp-1">
          {item.hos_allocations?.students?.first_name} {item.hos_allocations?.students?.last_name}
        </h3>
        <Badge variant={isPresent ? "default" : isLeave ? "secondary" : "destructive"}>
          {item.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">
            {item.attendance_date ? format(new Date(item.attendance_date), "PP") : "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bed</span>
          <span className="font-medium">
            Room {item.hos_allocations?.hos_beds?.hos_rooms?.room_number} - Bed{" "}
            {item.hos_allocations?.hos_beds?.bed_number}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function HostelAttendancePage() {
  const { data: attendance, isLoading } = useHostelAttendance();
  const { data: allocations } = useHostelAllocations();

  const createAttendance = useCreateHostelAttendance();
  const updateAttendance = useUpdateHostelAttendance();
  const deleteAttendance = useDeleteHostelAttendance();

  const allocationOptions = useMemo(() => {
    if (!allocations) return [];
    return allocations
      .filter((a: any) => a.status !== "vacated")
      .map((a: any) => ({
        value: a.id,
        label: `${a.students?.first_name} ${a.students?.last_name} (Room ${a.hos_beds?.hos_rooms?.room_number})`,
      }));
  }, [allocations]);

  return (
    <GridResourcePage
      title="Hostel Attendance"
      description="Track daily attendance for hostel students."
      items={attendance || []}
      isLoading={isLoading}
      searchKeys={["hos_allocations.students.first_name", "hos_allocations.students.last_name"]}
      renderItem={(item) => <AttendanceCard item={item} />}
      onCreate={async (v) => {
        await createAttendance.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateAttendance.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteAttendance.mutateAsync({ id });
      }}
      fields={[
        {
          name: "allocation_id",
          label: "Student (Active Allocation)",
          type: "select",
          required: true,
          options: allocationOptions,
          full: true,
        },
        {
          name: "attendance_date",
          label: "Date",
          type: "date",
          required: true,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "present", label: "Present" },
            { value: "absent", label: "Absent" },
            { value: "on_leave", label: "On Leave" },
          ],
        },
      ]}
    />
  );
}
