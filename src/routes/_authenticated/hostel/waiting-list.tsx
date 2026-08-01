/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useHostelWaitingList,
  useCreateHostelWaitingList,
  useUpdateHostelWaitingList,
  useDeleteHostelWaitingList,
  useHostels,
} from "@/hooks/hostel/useHostel";
import { useStudentRegister } from "@/hooks/useStudents";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/hostel/waiting-list")({
  component: HostelWaitingListPage,
});

function WaitingListCard({ item }: { item: any }) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
        <h3 className="font-semibold text-base line-clamp-1">
          {item.students?.first_name} {item.students?.last_name}
        </h3>
        <Badge
          variant={
            item.status === "allocated"
              ? "default"
              : item.status === "cancelled"
                ? "destructive"
                : "secondary"
          }
        >
          {item.status || "waiting"}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Enrollment</span>
          <span className="font-medium">{item.students?.enrollment_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pref. Hostel</span>
          <span className="font-medium">{item.hos_hostels?.name || "Any"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pref. Room</span>
          <span className="font-medium capitalize">{item.preferred_room_type || "Any"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Applied On</span>
          <span className="font-medium">
            {item.application_date ? format(new Date(item.application_date), "PP") : "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function HostelWaitingListPage() {
  const { data: waitingList, isLoading } = useHostelWaitingList();
  const { data: hostels } = useHostels();
  const { data: students } = useStudentRegister();

  const createWaitlist = useCreateHostelWaitingList();
  const updateWaitlist = useUpdateHostelWaitingList();
  const deleteWaitlist = useDeleteHostelWaitingList();

  const hostelOptions = useMemo(() => {
    if (!hostels) return [];
    return hostels.map((h: any) => ({ value: h.id, label: h.name }));
  }, [hostels]);

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return students.map((s: any) => ({
      value: s.id,
      label: `${s.first_name} ${s.last_name} (${s.enrollment_number})`,
    }));
  }, [students]);

  return (
    <GridResourcePage
      title="Waiting List"
      description="Manage students waiting for hostel allocation."
      items={waitingList || []}
      isLoading={isLoading}
      searchKeys={["students.first_name", "students.last_name", "students.enrollment_number"]}
      renderItem={(item) => <WaitingListCard item={item} />}
      onCreate={async (v) => {
        await createWaitlist.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateWaitlist.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteWaitlist.mutateAsync({ id });
      }}
      fields={[
        {
          name: "student_id",
          label: "Student",
          type: "select",
          required: true,
          options: studentOptions,
          full: true,
        },
        {
          name: "hostel_id",
          label: "Preferred Hostel",
          type: "select",
          options: hostelOptions,
        },
        {
          name: "preferred_room_type",
          label: "Preferred Room Type",
          type: "select",
          options: [
            { value: "single", label: "Single" },
            { value: "double", label: "Double" },
            { value: "triple", label: "Triple" },
            { value: "dormitory", label: "Dormitory" },
          ],
        },
        {
          name: "application_date",
          label: "Application Date",
          type: "date",
          required: true,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: [
            { value: "waiting", label: "Waiting" },
            { value: "allocated", label: "Allocated" },
            { value: "cancelled", label: "Cancelled" },
          ],
        },
      ]}
    />
  );
}
