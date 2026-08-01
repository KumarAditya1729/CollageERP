/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useTransportAttendance,
  useCreateTransportAttendance,
  useUpdateTransportAttendance,
  useDeleteTransportAttendance,
  useTransportRoutes,
} from "@/hooks/transport/useTransport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transport/attendance")({
  component: TransportAttendance,
});

function AttendanceCard({ attendance, onClick }: { attendance: any; onClick?: () => void }) {
  return (
    <Card className="hover:border-primary/50 cursor-pointer transition-all" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md font-bold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            {attendance.trn_routes?.name || "Unknown Route"}
          </CardTitle>
          <Badge variant={attendance.status === "present" ? "default" : "destructive"}>
            {attendance.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> Date:{" "}
            {attendance.date ? new Date(attendance.date).toLocaleDateString() : "N/A"}
          </div>
          <div>Student ID: {attendance.student_id}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransportAttendance() {
  const { data, isLoading } = useTransportAttendance();
  const { data: routes } = useTransportRoutes();
  const createMutation = useCreateTransportAttendance();
  const updateMutation = useUpdateTransportAttendance();
  const deleteMutation = useDeleteTransportAttendance();

  return (
    <GridResourcePage
      title="Attendance"
      description="Manage transport daily attendance"
      data={data || []}
      isLoading={isLoading}
      CardComponent={(props: any) => <AttendanceCard attendance={props.item} {...props} />}
      createMutation={createMutation}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
      formSchema={{
        student_id: { type: "text", label: "Student UUID", required: true },
        route_id: {
          type: "select",
          label: "Route",
          required: true,
          options: routes?.map((r: any) => ({ label: r.name, value: r.id })) || [],
        },
        date: { type: "text", label: "Date (YYYY-MM-DD)" },
        status: {
          type: "select",
          label: "Status",
          options: [
            { label: "Present", value: "present" },
            { label: "Absent", value: "absent" },
          ],
        },
      }}
      searchPlaceholder="Search attendance..."
    />
  );
}
