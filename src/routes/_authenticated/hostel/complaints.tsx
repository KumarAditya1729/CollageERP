/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { GridResourcePage } from "@/components/common/GridResourcePage";
import { ComplaintCard } from "@/components/hostel/ComplaintCard";
import {
  useHostelComplaints,
  useCreateHostelComplaint,
  useUpdateHostelComplaint,
  useDeleteHostelComplaint,
} from "@/hooks/hostel/useHostel";
import { useStudentRegister } from "@/hooks/useStudents";

export const Route = createFileRoute("/_authenticated/hostel/complaints")({
  component: HostelComplaintsPage,
});

function HostelComplaintsPage() {
  const { data: complaints, isLoading } = useHostelComplaints();
  const { data: students } = useStudentRegister();

  const createComplaint = useCreateHostelComplaint();
  const updateComplaint = useUpdateHostelComplaint();
  const deleteComplaint = useDeleteHostelComplaint();

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return students.map((s: any) => ({
      value: s.id,
      label: `${s.first_name} ${s.last_name} (${s.enrollment_number})`,
    }));
  }, [students]);

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    await updateComplaint.mutateAsync({
      id: item.id,
      status: newStatus,
      resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
    });
  };

  return (
    <GridResourcePage
      title="Hostel Complaints"
      description="Manage and resolve student complaints."
      items={complaints || []}
      isLoading={isLoading}
      searchKeys={["category", "description", "students.first_name", "students.last_name"]}
      renderItem={(item) => <ComplaintCard item={item} onUpdateStatus={handleUpdateStatus} />}
      onCreate={async (v) => {
        await createComplaint.mutateAsync(v);
      }}
      onUpdate={async (id, v) => {
        await updateComplaint.mutateAsync({ id, ...v });
      }}
      onDelete={async (id) => {
        await deleteComplaint.mutateAsync({ id });
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
          name: "category",
          label: "Category",
          type: "select",
          required: true,
          options: [
            { value: "electrical", label: "Electrical" },
            { value: "plumbing", label: "Plumbing" },
            { value: "carpentry", label: "Carpentry" },
            { value: "cleaning", label: "Cleaning" },
            { value: "other", label: "Other" },
          ],
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          required: true,
          full: true,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In Progress" },
            { value: "resolved", label: "Resolved" },
          ],
        },
      ]}
    />
  );
}
