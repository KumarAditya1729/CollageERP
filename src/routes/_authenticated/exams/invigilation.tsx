import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, LogOut, Plus, Printer, Repeat, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { facultyName, useAcademicLookups, useRooms } from "@/hooks/useAcademics";
import {
  useExamInvigilators,
  useExamRooms,
  useExams,
  useInvigilationMutations,
} from "@/hooks/useExams";
import { downloadCsv, formatDateTime, printAsPdf } from "@/lib/export";
import { dutyRoles, labelize, optionsOf, statusTone, timeOverlaps } from "@/lib/exams";

export const Route = createFileRoute("/_authenticated/exams/invigilation")({
  head: () => ({
    meta: [
      { title: "Invigilation duty roster — CampusOS" },
      {
        name: "description",
        content:
          "Allocate invigilators, observers, squads and relievers, detect duty clashes, swap duties and record duty attendance.",
      },
      { property: "og:title", content: "Invigilation duty roster — CampusOS" },
      { property: "og:description", content: "Examination duty allocation and reporting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvigilationPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Invigilation unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface DutyRow extends Record<string, unknown> {
  id: string;
  faculty: string;
  facultyId: string | null;
  hall: string;
  role: string;
  status: string;
  reported: string | null;
  departed: string | null;
  swapped: boolean;
  clash: string | null;
}

function InvigilationPage() {
  const { can } = useAccess();
  const exams = useExams();
  const rooms = useRooms();
  const lookups = useAcademicLookups();
  const examRooms = useExamRooms();
  const duties = useExamInvigilators();
  const mutations = useInvigilationMutations();

  const [examId, setExamId] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState<string | null>(null);

  const canManage = can("exam.update");
  const exam = useMemo(
    () => (exams.data ?? []).find((row) => row.id === examId) ?? null,
    [exams.data, examId],
  );
  const facultyById = useMemo(
    () => new Map((lookups.faculty.data ?? []).map((row) => [row.id, row])),
    [lookups.faculty.data],
  );
  const roomsById = useMemo(
    () => new Map((rooms.data ?? []).map((row) => [row.id, row])),
    [rooms.data],
  );
  const hallsById = useMemo(
    () => new Map((examRooms.data ?? []).map((row) => [row.id, row])),
    [examRooms.data],
  );
  const examById = useMemo(
    () => new Map((exams.data ?? []).map((row) => [row.id, row])),
    [exams.data],
  );

  /** A faculty member cannot be on duty for two overlapping papers. */
  const clashFor = (facultyId: string | null, dutyId: string) => {
    if (!facultyId || !exam?.starts_at || !exam.ends_at) return null;
    const other = (duties.data ?? []).find((row) => {
      if (row.id === dutyId || row.faculty_id !== facultyId || row.exam_id === examId) return false;
      const otherExam = examById.get(row.exam_id);
      if (!otherExam?.starts_at || !otherExam.ends_at) return false;
      return timeOverlaps(exam.starts_at!, exam.ends_at!, otherExam.starts_at, otherExam.ends_at);
    });
    return other ? (examById.get(other.exam_id)?.title ?? "Another paper") : null;
  };

  const rows = useMemo<DutyRow[]>(
    () =>
      (duties.data ?? [])
        .filter((row) => row.exam_id === examId)
        .map((row) => {
          const faculty = row.faculty_id ? facultyById.get(row.faculty_id) : null;
          const hall = row.exam_room_id ? hallsById.get(row.exam_room_id) : null;
          const room = hall?.room_id ? roomsById.get(hall.room_id) : null;
          return {
            id: row.id,
            faculty: faculty ? facultyName(faculty) : "Unassigned",
            facultyId: row.faculty_id,
            hall: room?.name ?? "All halls",
            role: row.duty_role,
            status: row.attendance_status,
            reported: row.reported_at,
            departed: row.departed_at,
            swapped: Boolean(row.swapped_from),
            clash: clashFor(row.faculty_id, row.id),
          } satisfies DutyRow;
        })
        .sort((a, b) => a.role.localeCompare(b.role)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [duties.data, examId, facultyById, hallsById, roomsById, exam],
  );

  const halls = (examRooms.data ?? []).filter((row) => row.exam_id === examId);
  const reported = rows.filter(
    (row) => row.status === "reported" || row.status === "completed",
  ).length;
  const clashes = rows.filter((row) => row.clash).length;

  const reportHeaders = ["Faculty", "Hall", "Duty", "Status", "Reported", "Departed", "Clash"];
  const reportRows = rows.map((row) => [
    row.faculty,
    row.hall,
    labelize(row.role),
    labelize(row.status),
    formatDateTime(row.reported),
    formatDateTime(row.departed),
    row.clash ?? "",
  ]);

  return (
    <>
      <PageHeader
        title="Invigilation duty"
        description="Allocate invigilators, chief superintendents, observers, flying squads and relievers, then track duty attendance in real time."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Invigilation" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("invigilation-report", reportHeaders, reportRows)}
              disabled={!rows.length}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                printAsPdf(
                  `Invigilation report — ${exam?.title ?? "Exam"}`,
                  reportHeaders,
                  reportRows,
                )
              }
              disabled={!rows.length}
            >
              <Printer className="size-4" />
              Duty report
            </Button>
          </>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Choose an exam</CardTitle>
          <CardDescription>Duty clashes are checked against overlapping papers.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="duty-exam">Exam</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="duty-exam">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {(exams.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {exam && canManage ? (
            <Button onClick={() => setAssignOpen(true)}>
              <Plus className="size-4" />
              Allocate duty
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {exam ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Duties" value={rows.length} />
            <StatCard label="Halls" value={halls.length} />
            <StatCard label="Reported" value={reported} />
            <StatCard
              label="Clashes"
              value={clashes}
              hint={
                clashes ? "Faculty on duty elsewhere at the same time" : "No overlapping duties"
              }
            />
          </div>

          <DataTable<DutyRow>
            rows={rows}
            loading={duties.isLoading}
            storageKey="exam-invigilation"
            exportName="invigilation"
            getRowId={(row) => row.id}
            bulkActions={(ids, clear) =>
              canManage ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      mutations.attendance.mutate({ ids, status: "reported" });
                      clear();
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                    Mark reported
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      mutations.attendance.mutate({ ids, status: "completed" });
                      clear();
                    }}
                  >
                    <LogOut className="size-4" />
                    Mark completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      mutations.release.mutate(ids);
                      clear();
                    }}
                  >
                    <Trash2 className="size-4" />
                    Release
                  </Button>
                </>
              ) : null
            }
            columns={[
              { key: "faculty", header: "Faculty", value: (row) => row.faculty, sortable: true },
              { key: "hall", header: "Hall", value: (row) => row.hall, sortable: true },
              {
                key: "role",
                header: "Duty",
                value: (row) => row.role,
                render: (row) => <Badge variant="outline">{labelize(row.role)}</Badge>,
              },
              {
                key: "status",
                header: "Attendance",
                value: (row) => row.status,
                render: (row) => (
                  <Badge variant={statusTone(row.status)}>{labelize(row.status)}</Badge>
                ),
              },
              { key: "reported", header: "Reported", value: (row) => formatDateTime(row.reported) },
              { key: "departed", header: "Departed", value: (row) => formatDateTime(row.departed) },
              {
                key: "clash",
                header: "Clash",
                value: (row) => row.clash ?? "—",
                render: (row) =>
                  row.clash ? <Badge variant="destructive">{row.clash}</Badge> : <span>—</span>,
              },
              {
                key: "actions",
                header: "",
                value: () => "",
                render: (row) =>
                  canManage ? (
                    <Button size="sm" variant="ghost" onClick={() => setSwapOpen(row.id)}>
                      <Repeat className="size-4" />
                      Swap
                    </Button>
                  ) : null,
              },
            ]}
            emptyTitle="No duties allocated"
            emptyDescription="Allocate invigilators to this paper."
          />
        </>
      ) : (
        <EmptyState title="Select an exam" description="Pick a paper to manage its duty roster." />
      )}

      <RecordFormDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        title="Allocate invigilation duty"
        description="Assign a faculty member to a hall for this paper."
        submitLabel="Allocate"
        fields={[
          {
            name: "faculty_id",
            label: "Faculty",
            type: "select",
            required: true,
            options: (lookups.faculty.data ?? []).map((row) => ({
              value: row.id,
              label: facultyName(row),
            })),
          },
          {
            name: "exam_room_id",
            label: "Hall",
            type: "select",
            options: halls.map((hall) => ({
              value: hall.id,
              label: (hall.room_id ? roomsById.get(hall.room_id)?.name : null) ?? "Hall",
            })),
          },
          {
            name: "duty_role",
            label: "Duty role",
            type: "select",
            required: true,
            options: optionsOf(dutyRoles),
          },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSubmit={async (values) => {
          await mutations.assign.mutateAsync({
            examId,
            examRoomId: values["exam_room_id"] ? String(values["exam_room_id"]) : null,
            facultyId: String(values["faculty_id"]),
            dutyRole: String(values["duty_role"]),
            notes: values["notes"] ? String(values["notes"]) : null,
          });
          setAssignOpen(false);
        }}
      />

      <RecordFormDialog
        open={Boolean(swapOpen)}
        onOpenChange={(open) => setSwapOpen(open ? swapOpen : null)}
        title="Swap duty"
        description="Hand this duty over to another faculty member. The original allocation is retained for audit."
        submitLabel="Swap duty"
        fields={[
          {
            name: "faculty_id",
            label: "Replacement faculty",
            type: "select",
            required: true,
            options: (lookups.faculty.data ?? []).map((row) => ({
              value: row.id,
              label: facultyName(row),
            })),
          },
        ]}
        onSubmit={async (values) => {
          if (!swapOpen) return;
          await mutations.swap.mutateAsync({
            id: swapOpen,
            facultyId: String(values["faculty_id"]),
          });
          setSwapOpen(null);
        }}
      />
    </>
  );
}
