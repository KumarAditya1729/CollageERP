/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { RecordFormDialog, FieldDef, RecordValues } from "@/components/common/record-form-dialog";
import { useStudentRegister } from "@/hooks/useStudents";

interface GatePassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecordValues) => Promise<void>;
  initialValues?: RecordValues;
}

export function GatePassDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
}: GatePassDialogProps) {
  const { data: students } = useStudentRegister();

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return students.map((s: any) => ({
      value: s.id,
      label: `${s.first_name} ${s.last_name} (${s.enrollment_number})`,
    }));
  }, [students]);

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
      type: "date",
      required: true,
    },
    {
      name: "expected_in_time",
      label: "Expected Return Time",
      type: "date",
      required: true,
    },
  ];

  return (
    <RecordFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={initialValues ? "Update Gate Pass" : "Generate Gate Pass"}
      fields={fields}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel={initialValues ? "Update" : "Generate"}
    />
  );
}
