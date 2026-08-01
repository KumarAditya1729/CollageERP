/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import {
  useHostelGatePasses,
  useCreateHostelGatePass,
  useUpdateHostelGatePass,
  useDeleteHostelGatePass,
} from "@/hooks/hostel/useHostel";
import { useStudentRegister } from "@/hooks/useStudents";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { QrCode, LogOut, LogIn } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hostel/gate-pass")({
  component: HostelGatePassPage,
});

function GatePassCard({ item }: { item: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="p-4 pb-2 border-b bg-muted/20 flex flex-row items-start justify-between">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">
            {item.students?.first_name} {item.students?.last_name}
          </h3>
          <p className="text-xs text-muted-foreground">{item.students?.enrollment_number}</p>
        </div>
        <Badge variant="outline" className={`capitalize shrink-0 ${getStatusColor(item.status)}`}>
          {item.status?.replace("_", " ")}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 p-4 flex flex-col gap-3 text-sm">
        <div className="flex justify-between items-center bg-muted/30 p-2 rounded border">
          <span className="text-muted-foreground flex items-center gap-1">
            <LogOut className="h-4 w-4" /> Out
          </span>
          <span className="font-medium">
            {item.out_time ? format(new Date(item.out_time), "MMM d, p") : "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center bg-muted/30 p-2 rounded border">
          <span className="text-muted-foreground flex items-center gap-1">
            <LogIn className="h-4 w-4" /> Exp. In
          </span>
          <span className="font-medium">
            {item.expected_in_time ? format(new Date(item.expected_in_time), "MMM d, p") : "N/A"}
          </span>
        </div>
        <p className="text-xs mt-2 line-clamp-2">
          <span className="font-medium">Purpose:</span> {item.purpose}
        </p>
      </CardContent>

      <CardFooter className="p-3 pt-0 border-t flex justify-end mt-auto bg-muted/10">
        <div className="flex items-center text-xs text-muted-foreground gap-1 bg-white px-2 py-1 rounded shadow-sm border">
          <QrCode className="h-4 w-4" /> Ready for scan
        </div>
      </CardFooter>
    </Card>
  );
}

function HostelGatePassPage() {
  const { data: gatePasses, isLoading } = useHostelGatePasses();
  const { data: students } = useStudentRegister();

  const createGatePass = useCreateHostelGatePass();
  const updateGatePass = useUpdateHostelGatePass();
  const deleteGatePass = useDeleteHostelGatePass();

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return students.map((s: any) => ({
      value: s.id,
      label: `${s.first_name} ${s.last_name} (${s.enrollment_number})`,
    }));
  }, [students]);

  return (
    <GridResourcePage
      title="Gate Passes & Outpasses"
      description="Manage student exits and entries with QR verification."
      items={gatePasses || []}
      isLoading={isLoading}
      searchKeys={[
        "students.first_name",
        "students.last_name",
        "students.enrollment_number",
        "purpose",
      ]}
      renderItem={(item) => <GatePassCard item={item} />}
      onCreate={async (v) => {
        await createGatePass.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateGatePass.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteGatePass.mutateAsync({ id });
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
          name: "pass_type",
          label: "Pass Type",
          type: "select",
          required: true,
          options: [
            { value: "local", label: "Local (Same Day)" },
            { value: "outstation", label: "Outstation (Leave)" },
            { value: "emergency", label: "Emergency" },
          ],
        },
        {
          name: "purpose",
          label: "Purpose",
          type: "textarea",
          required: true,
          full: true,
        },
        {
          name: "out_time",
          label: "Out Time",
          type: "date", // using date for simplicity, a real app would use datetime-local
          required: true,
        },
        {
          name: "expected_in_time",
          label: "Expected Return Time",
          type: "date",
          required: true,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "pending_approval", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "active", label: "Active (Out)" },
            { value: "closed", label: "Closed (Returned)" },
          ],
        },
      ]}
    />
  );
}
