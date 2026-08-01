/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessPlanCard } from "@/components/hostel/MessPlanCard";
import { RecordFormDialog, FieldDef } from "@/components/common/record-form-dialog";
import { DataTable } from "@/components/common/data-table";
import {
  useHostelMessPlans,
  useCreateHostelMessPlan,
  useUpdateHostelMessPlan,
  useDeleteHostelMessPlan,
  useHostelMessEnrollments,
  useCreateHostelMessEnrollment,
  useUpdateHostelMessEnrollment,
} from "@/hooks/hostel/useHostel";
import { useStudentRegister } from "@/hooks/useStudents";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/hostel/mess")({
  component: HostelMessPage,
});

function HostelMessPage() {
  const { data: plans } = useHostelMessPlans();
  const { data: enrollments } = useHostelMessEnrollments();
  const { data: students } = useStudentRegister();

  const createPlan = useCreateHostelMessPlan();
  const updatePlan = useUpdateHostelMessPlan();

  const createEnrollment = useCreateHostelMessEnrollment();
  const updateEnrollment = useUpdateHostelMessEnrollment();

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  const studentOptions = useMemo(() => {
    if (!students) return [];
    return students.map((s: any) => ({
      value: s.id,
      label: `${s.first_name} ${s.last_name} (${s.enrollment_number})`,
    }));
  }, [students]);

  const planOptions = useMemo(() => {
    if (!plans) return [];
    return plans.map((p: any) => ({
      value: p.id,
      label: `${p.name} - $${p.cost_per_month}/mo`,
    }));
  }, [plans]);

  const planFields: FieldDef[] = [
    { name: "name", label: "Plan Name", type: "text", required: true, full: true },
    { name: "cost_per_month", label: "Cost Per Month", type: "number", required: true },
    { name: "description", label: "Description", type: "textarea", full: true },
  ];

  const enrollmentFields: FieldDef[] = [
    {
      name: "student_id",
      label: "Student",
      type: "select",
      required: true,
      options: studentOptions,
      full: true,
    },
    {
      name: "mess_plan_id",
      label: "Mess Plan",
      type: "select",
      required: true,
      options: planOptions,
      full: true,
    },
    { name: "start_date", label: "Start Date", type: "date", required: true },
    { name: "end_date", label: "End Date", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const handleSavePlan = async (values: any) => {
    if (selectedPlan) {
      await updatePlan.mutateAsync({ id: selectedPlan.id, ...values });
    } else {
      await createPlan.mutateAsync(values);
    }
    setPlanDialogOpen(false);
  };

  const handleSaveEnrollment = async (values: any) => {
    if (selectedEnrollment) {
      await updateEnrollment.mutateAsync({ id: selectedEnrollment.id, ...values });
    } else {
      await createEnrollment.mutateAsync(values);
    }
    setEnrollmentDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mess Management"
        description="Manage mess plans and student enrollments."
      />

      <Tabs defaultValue="plans">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="plans">Mess Plans</TabsTrigger>
            <TabsTrigger value="enrollments">Student Enrollments</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plans" className="space-y-4 mt-0">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedPlan(null);
                setPlanDialogOpen(true);
              }}
            >
              Create Plan
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan: any) => (
              <MessPlanCard
                key={plan.id}
                item={plan}
                onEdit={() => {
                  setSelectedPlan(plan);
                  setPlanDialogOpen(true);
                }}
                onEnroll={() => {
                  setSelectedEnrollment(null);
                  setEnrollmentDialogOpen(true);
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="mt-0 space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedEnrollment(null);
                setEnrollmentDialogOpen(true);
              }}
            >
              New Enrollment
            </Button>
          </div>
          <div className="bg-card border rounded-md">
            <DataTable
              columns={[
                {
                  header: "Student",
                  key: "student_id",
                  render: (r: any) => `${r.students?.first_name} ${r.students?.last_name}`,
                },
                {
                  header: "Enrollment",
                  key: "enrollment",
                  render: (r: any) => r.students?.enrollment_number,
                },
                { header: "Plan", key: "plan", render: (r: any) => r.hos_mess_plans?.name },
                {
                  header: "Start Date",
                  key: "start_date",
                  render: (r: any) => format(new Date(r.start_date), "PP"),
                },
                { header: "Status", key: "status" },
              ]}
              rows={enrollments || []}
              getRowId={(r: any) => r.id}
              onRowClick={(r) => {
                setSelectedEnrollment(r);
                setEnrollmentDialogOpen(true);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <RecordFormDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        title={selectedPlan ? "Edit Mess Plan" : "Create Mess Plan"}
        fields={planFields}
        initialValues={selectedPlan || {}}
        onSubmit={handleSavePlan}
      />

      <RecordFormDialog
        open={enrollmentDialogOpen}
        onOpenChange={setEnrollmentDialogOpen}
        title={selectedEnrollment ? "Edit Enrollment" : "New Enrollment"}
        fields={enrollmentFields}
        initialValues={selectedEnrollment || {}}
        onSubmit={handleSaveEnrollment}
      />
    </div>
  );
}
