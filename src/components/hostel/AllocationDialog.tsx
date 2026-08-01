/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { RecordFormDialog, FieldDef, RecordValues } from "@/components/common/record-form-dialog";
import { useStudentRegister } from "@/hooks/useStudents";
import { useHostelBeds } from "@/hooks/hostel/useHostel";

interface AllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecordValues) => Promise<void>;
  preSelectedBedId?: string;
  preSelectedStudentId?: string;
}

export function AllocationDialog({
  open,
  onOpenChange,
  onSubmit,
  preSelectedBedId,
  preSelectedStudentId,
}: AllocationDialogProps) {
  const { data: students } = useStudentRegister();
  const { data: beds } = useHostelBeds();

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return students.map((s: any) => ({
      value: s.id,
      label: `${s.first_name} ${s.last_name} (${s.enrollment_number})`,
    }));
  }, [students]);

  const bedOptions = useMemo(() => {
    if (!beds) return [];
    return beds
      .filter((b: any) => !b.is_occupied || b.id === preSelectedBedId)
      .map((b: any) => ({
        value: b.id,
        label: `${b.hos_rooms?.hos_floors?.hos_hostels?.name} - Room ${b.hos_rooms?.room_number} - Bed ${b.bed_number}`,
      }));
  }, [beds, preSelectedBedId]);

  const fields: FieldDef[] = [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      options: studentOptions,
      full: true,
    },
    {
      name: "bed_id",
      label: "Bed",
      type: "select",
      required: true,
      options: bedOptions,
      full: true,
    },
    {
      name: "check_in_date",
      label: "Check-In Date",
      type: "date",
      required: true,
    },
    {
      name: "expected_check_out_date",
      label: "Expected Check-Out Date",
      type: "date",
      required: false,
    },
  ];

  const initialValues = {
    student_id: preSelectedStudentId || "",
    bed_id: preSelectedBedId || "",
    check_in_date: new Date().toISOString().split("T")[0],
  };

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Allocate Bed"
      fields={fields}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel="Allocate"
    />
  );
}
