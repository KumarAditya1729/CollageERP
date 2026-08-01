import { createFileRoute } from "@tanstack/react-router";
import { Accessibility, Grid3x3, Plus, Printer, Shuffle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/states";
import { StatCard } from "@/components/common/stat-card";
import { RecordFormDialog } from "@/components/common/record-form-dialog";
import { SeatMatrix, type SeatMatrixHall } from "@/components/exams/seat-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicLookups, useRooms } from "@/hooks/useAcademics";
import { useResourceMutations } from "@/hooks/useResource";
import {
  useAllocateSeats,
  useExamRegistrations,
  useExamRooms,
  useExamSeats,
  useExams,
  useSeatMutations,
} from "@/hooks/useExams";
import { useStudentRegister } from "@/hooks/useStudents";
import { downloadCsv, printAsPdf } from "@/lib/export";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/exams/seating")({
  head: () => ({
    meta: [
      { title: "Exam seating & hall allocation — CampusOS" },
      {
        name: "description",
        content:
          "Allocate exam halls, run automatic bench-wise seating with special-needs priority, and print hall-wise seat matrices.",
      },
      { property: "og:title", content: "Exam seating & hall allocation — CampusOS" },
      { property: "og:description", content: "Automatic and manual examination seating." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SeatingPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Seating unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

interface HallRow extends Record<string, unknown> {
  id: string;
  room: string;
  building: string | null;
  floor: number | null;
  block: string | null;
  capacity: number;
  allocated: number;
  special: boolean;
  prefix: string | null;
}

function SeatingPage() {
  const { can } = useAccess();
  const exams = useExams();
  const rooms = useRooms();
  const lookups = useAcademicLookups();
  const examRooms = useExamRooms();
  const seats = useExamSeats();
  const registrations = useExamRegistrations();
  const students = useStudentRegister();
  const allocate = useAllocateSeats();
  const seatMutations = useSeatMutations();
  const roomMutations = useResourceMutations({ table: "exam_rooms" });

  const [examId, setExamId] = useState("");
  const [hallOpen, setHallOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState<Set<string>>(new Set());

  const canManage = can("exam.update");
  const exam = useMemo(
    () => (exams.data ?? []).find((row) => row.id === examId) ?? null,
    [exams.data, examId],
  );

  const roomsById = useMemo(
    () => new Map((rooms.data ?? []).map((row) => [row.id, row])),
    [rooms.data],
  );
  const buildingsById = useMemo(
    () => new Map((lookups.buildings.data ?? []).map((row) => [row.id, row])),
    [lookups.buildings.data],
  );
  const studentById = useMemo(
    () => new Map((students.data ?? []).map((row) => [row.id, row])),
    [students.data],
  );

  const halls = useMemo(
    () => (examRooms.data ?? []).filter((row) => row.exam_id === examId),
    [examRooms.data, examId],
  );
  const examSeats = useMemo(
    () => (seats.data ?? []).filter((row) => row.exam_id === examId),
    [seats.data, examId],
  );

  const candidates = useMemo(() => {
    const rows = (registrations.data ?? []).filter(
      (row) =>
        row.exam_id === examId && ["eligible", "registered"].includes(row.status) && !row.fee_hold,
    );
    return rows
      .map((row) => {
        const student = studentById.get(row.student_id);
        return {
          id: row.student_id,
          name: student ? studentName(student) : "Unknown student",
          roll: student?.roll_number ?? student?.admission_number ?? null,
        };
      })
      .sort((a, b) => (a.roll ?? "").localeCompare(b.roll ?? ""));
  }, [registrations.data, examId, studentById]);

  useEffect(() => {
    setSpecialNeeds(
      new Set(examSeats.filter((seat) => seat.is_special_needs).map((seat) => seat.student_id)),
    );
  }, [examSeats]);

  const capacity = halls.reduce((sum, hall) => sum + hall.seat_capacity, 0);
  const shortfall = candidates.length - capacity;

  const hallRows = useMemo<HallRow[]>(
    () =>
      halls.map((hall) => {
        const room = hall.room_id ? roomsById.get(hall.room_id) : null;
        const building = hall.building_id ? buildingsById.get(hall.building_id) : null;
        return {
          id: hall.id,
          room: room?.name ?? "Unassigned room",
          building: building?.name ?? null,
          floor: hall.floor,
          block: hall.block_label,
          capacity: hall.seat_capacity,
          allocated: examSeats.filter((seat) => seat.exam_room_id === hall.id).length,
          special: hall.is_special_needs,
          prefix: hall.seat_prefix,
        } satisfies HallRow;
      }),
    [halls, roomsById, buildingsById, examSeats],
  );

  const matrix = useMemo<SeatMatrixHall[]>(
    () =>
      halls.map((hall) => {
        const room = hall.room_id ? roomsById.get(hall.room_id) : null;
        const building = hall.building_id ? buildingsById.get(hall.building_id) : null;
        return {
          id: hall.id,
          roomName: room?.name ?? "Unassigned room",
          buildingName: building?.name ?? null,
          floor: hall.floor,
          blockLabel: hall.block_label,
          capacity: hall.seat_capacity,
          specialNeeds: hall.is_special_needs,
          seats: examSeats
            .filter((seat) => seat.exam_room_id === hall.id)
            .sort((a, b) => a.seat_number.localeCompare(b.seat_number))
            .map((seat) => {
              const student = studentById.get(seat.student_id);
              return {
                id: seat.id,
                seatNumber: seat.seat_number,
                rowLabel: seat.row_label,
                benchNumber: seat.bench_number,
                studentName: student ? studentName(student) : "Unknown student",
                rollNumber: student?.roll_number ?? student?.admission_number ?? null,
                specialNeeds: seat.is_special_needs,
                verificationCode: seat.verification_code,
              };
            }),
        };
      }),
    [halls, roomsById, buildingsById, examSeats, studentById],
  );

  const seatRegisterRows = matrix.flatMap((hall) =>
    hall.seats.map((seat) => [
      hall.roomName,
      hall.blockLabel,
      hall.floor,
      seat.seatNumber,
      seat.benchNumber,
      seat.rollNumber,
      seat.studentName,
      seat.specialNeeds ? "Yes" : "No",
      seat.verificationCode,
    ]),
  );
  const seatRegisterHeaders = [
    "Hall",
    "Block",
    "Floor",
    "Seat",
    "Bench",
    "Roll",
    "Student",
    "Special needs",
    "Verification",
  ];

  const unseated = candidates.filter(
    (row) => !examSeats.some((seat) => seat.student_id === row.id),
  );

  return (
    <>
      <PageHeader
        title="Seating & hall allocation"
        description="Allocate halls by building, block and floor, then generate bench-wise seating with special-needs priority and per-seat verification codes."
        crumbs={[{ label: "Examinations", to: "/exams" }, { label: "Seating" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => downloadCsv("seating-chart", seatRegisterHeaders, seatRegisterRows)}
              disabled={!seatRegisterRows.length}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                printAsPdf(
                  `Seating chart — ${exam?.title ?? "Exam"}`,
                  seatRegisterHeaders,
                  seatRegisterRows,
                )
              }
              disabled={!seatRegisterRows.length}
            >
              <Printer className="size-4" />
              Print
            </Button>
          </>
        }
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Choose an exam</CardTitle>
          <CardDescription>
            Only registered candidates without a fee hold are seated.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="seat-exam">Exam</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="seat-exam">
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
            <>
              <Button variant="outline" onClick={() => setHallOpen(true)}>
                <Plus className="size-4" />
                Add hall
              </Button>
              <Button
                onClick={() =>
                  allocate.mutate({
                    examId: exam.id,
                    rooms: halls,
                    candidates: candidates.map((row) => ({
                      studentId: row.id,
                      specialNeeds: specialNeeds.has(row.id),
                    })),
                  })
                }
                disabled={allocate.isPending || !halls.length || !candidates.length}
              >
                <Shuffle className="size-4" />
                Automatic seating
              </Button>
              <Button
                variant="outline"
                onClick={() => setManualOpen(true)}
                disabled={!halls.length}
              >
                <Grid3x3 className="size-4" />
                Manual seat
              </Button>
              <Button
                variant="ghost"
                onClick={() => seatMutations.clear.mutate(exam.id)}
                disabled={seatMutations.clear.isPending || !examSeats.length}
              >
                <Trash2 className="size-4" />
                Clear seating
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>

      {exam ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Candidates" value={candidates.length} />
            <StatCard
              label="Total capacity"
              value={capacity}
              hint={`${halls.length} halls allocated`}
            />
            <StatCard label="Seated" value={examSeats.length} />
            <StatCard
              label={shortfall > 0 ? "Capacity shortfall" : "Spare seats"}
              value={Math.abs(shortfall)}
              hint={shortfall > 0 ? "Add more halls before seating" : "Capacity is sufficient"}
            />
          </div>

          <Tabs defaultValue="halls" className="space-y-4">
            <TabsList>
              <TabsTrigger value="halls">Halls</TabsTrigger>
              <TabsTrigger value="matrix">Seat matrix</TabsTrigger>
              <TabsTrigger value="special">Special needs</TabsTrigger>
            </TabsList>

            <TabsContent value="halls" className="space-y-4">
              <DataTable<HallRow>
                rows={hallRows}
                loading={examRooms.isLoading}
                storageKey="exam-halls"
                exportName="exam-halls"
                getRowId={(row) => row.id}
                bulkActions={(ids, clear) =>
                  canManage ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        roomMutations.remove.mutate(ids);
                        clear();
                      }}
                    >
                      <Trash2 className="size-4" />
                      Remove hall
                    </Button>
                  ) : null
                }
                columns={[
                  { key: "room", header: "Hall", value: (row) => row.room, sortable: true },
                  { key: "building", header: "Building", value: (row) => row.building ?? "—" },
                  { key: "block", header: "Block", value: (row) => row.block ?? "—" },
                  { key: "floor", header: "Floor", value: (row) => row.floor ?? "—" },
                  {
                    key: "capacity",
                    header: "Capacity",
                    value: (row) => row.capacity,
                    sortable: true,
                  },
                  {
                    key: "allocated",
                    header: "Seated",
                    value: (row) => row.allocated,
                    sortable: true,
                  },
                  {
                    key: "special",
                    header: "Special needs",
                    value: (row) => (row.special ? "Yes" : "No"),
                    render: (row) =>
                      row.special ? (
                        <Badge variant="secondary" className="gap-1">
                          <Accessibility className="size-3" /> Priority
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      ),
                  },
                  { key: "prefix", header: "Seat prefix", value: (row) => row.prefix ?? "—" },
                ]}
                emptyTitle="No halls allocated"
                emptyDescription="Add an exam hall to begin seating."
              />
              {unseated.length ? (
                <p className="text-sm text-muted-foreground">
                  {unseated.length} candidate{unseated.length === 1 ? "" : "s"} not yet seated.
                </p>
              ) : null}
            </TabsContent>

            <TabsContent value="matrix">
              <SeatMatrix halls={matrix} />
            </TabsContent>

            <TabsContent value="special">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Special-needs candidates</CardTitle>
                  <CardDescription>
                    Flagged candidates are seated first, in halls marked for special needs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80 pr-3">
                    <div className="space-y-2">
                      {candidates.map((candidate) => (
                        <label
                          key={candidate.id}
                          className="flex items-center gap-3 rounded-md border p-2 text-sm"
                        >
                          <Checkbox
                            checked={specialNeeds.has(candidate.id)}
                            disabled={!canManage}
                            onCheckedChange={(checked) =>
                              setSpecialNeeds((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(candidate.id);
                                else next.delete(candidate.id);
                                return next;
                              })
                            }
                          />
                          <span className="font-medium">{candidate.roll ?? "—"}</span>
                          <span className="text-muted-foreground">{candidate.name}</span>
                        </label>
                      ))}
                      {!candidates.length ? (
                        <p className="text-sm text-muted-foreground">No registered candidates.</p>
                      ) : null}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState
          title="Select an exam"
          description="Pick a paper to allocate halls and seats."
        />
      )}

      <RecordFormDialog
        open={hallOpen}
        onOpenChange={setHallOpen}
        title="Add exam hall"
        description="Allocate a room to this paper with its capacity and physical location."
        submitLabel="Add hall"
        fields={[
          {
            name: "room_id",
            label: "Room",
            type: "select",
            required: true,
            options: (rooms.data ?? []).map((row) => ({ value: row.id, label: row.name })),
          },
          {
            name: "building_id",
            label: "Building",
            type: "select",
            options: (lookups.buildings.data ?? []).map((row) => ({
              value: row.id,
              label: row.name,
            })),
          },
          { name: "seat_capacity", label: "Seat capacity", type: "number", required: true, min: 1 },
          { name: "seat_prefix", label: "Seat prefix", placeholder: "A" },
          { name: "block_label", label: "Block", placeholder: "North" },
          { name: "floor", label: "Floor", type: "number", min: 0 },
          {
            name: "is_special_needs",
            label: "Special-needs hall",
            type: "select",
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSubmit={async (values) => {
          await roomMutations.create.mutateAsync({
            exam_id: examId,
            room_id: values["room_id"],
            building_id: values["building_id"] || null,
            seat_capacity: Number(values["seat_capacity"] ?? 0),
            seat_prefix: values["seat_prefix"] || null,
            block_label: values["block_label"] || null,
            floor:
              values["floor"] === "" || values["floor"] === null ? null : Number(values["floor"]),
            is_special_needs: values["is_special_needs"] === "true",
            notes: values["notes"] || null,
          });
          setHallOpen(false);
        }}
      />

      <RecordFormDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        title="Manual seat assignment"
        description="Override the automatic plan for a single candidate."
        submitLabel="Assign seat"
        fields={[
          {
            name: "student_id",
            label: "Candidate",
            type: "select",
            required: true,
            options: candidates.map((row) => ({
              value: row.id,
              label: `${row.roll ?? "—"} · ${row.name}`,
            })),
          },
          {
            name: "exam_room_id",
            label: "Hall",
            type: "select",
            required: true,
            options: hallRows.map((row) => ({ value: row.id, label: row.room })),
          },
          { name: "seat_number", label: "Seat number", required: true },
          { name: "row_label", label: "Row" },
          { name: "bench_number", label: "Bench", type: "number", min: 1 },
        ]}
        onSubmit={async (values) => {
          await seatMutations.assign.mutateAsync({
            examId,
            examRoomId: String(values["exam_room_id"]),
            studentId: String(values["student_id"]),
            seatNumber: String(values["seat_number"]),
            rowLabel: values["row_label"] ? String(values["row_label"]) : null,
            benchNumber:
              values["bench_number"] === "" || values["bench_number"] === null
                ? null
                : Number(values["bench_number"]),
            specialNeeds: specialNeeds.has(String(values["student_id"])),
          });
          setManualOpen(false);
        }}
      />
    </>
  );
}
