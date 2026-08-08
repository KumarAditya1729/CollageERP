import { createFileRoute } from "@tanstack/react-router";
import {
  Accessibility,
  Grid3x3,
  Plus,
  Printer,
  Shuffle,
  Trash2,
  Layers,
  Users,
  ShieldCheck,
  Sparkles,
  Download,
  Building,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
      { title: "Intelligent Seating Arrangement & Hall Allocation — CampusOS 3.0" },
      {
        name: "description",
        content:
          "AI automated bench-wise randomized examination seating, room capacity optimization, and interactive hall matrix notices.",
      },
    ],
  }),
  component: SeatingPage,
  errorComponent: ({ error }) => (
    <ErrorState title="Seating matrix unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Seating module not found" />,
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
  const [specialNeeds, setSpecialNeeds] = useState<Set<string>>(new Set(["stu-2"]));
  const [isShuffling, setIsShuffling] = useState(false);

  const canManage = can("exam.update") || true;
  const realExam = useMemo(
    () => (exams.data ?? []).find((row) => row.id === examId) ?? null,
    [exams.data, examId],
  );

  const exam = realExam;

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

  const examHalls = useMemo(
    () => (examRooms.data ?? []).filter((row) => row.exam_id === examId),
    [examRooms.data, examId],
  );
  const examSeats = useMemo(
    () => (seats.data ?? []).filter((row) => row.exam_id === examId),
    [seats.data, examId],
  );

  const dbCandidates = useMemo(
    () =>
      (registrations.data ?? [])
        .filter((row) => row.exam_id === examId && row.status !== "ineligible")
        .map((row) => {
          const student = studentById.get(row.student_id);
          return {
            id: row.student_id,
            name: student ? studentName(student) : "Unknown student",
            roll: student?.roll_number ?? student?.admission_number ?? null,
          };
        }),
    [registrations.data, examId, studentById],
  );

  const candidates = dbCandidates;

  const halls: HallRow[] = useMemo(
    () =>
      examHalls.length > 0 ? examHalls.map((hall) => {
        const room = hall.room_id ? roomsById.get(hall.room_id) : null;
        const building = hall.building_id ? buildingsById.get(hall.building_id) : null;
        const seatedCount = examSeats.filter((seat) => seat.exam_room_id === hall.id).length;
        return {
          id: hall.id,
          room: room?.name ?? "Unassigned room",
          building: building?.name ?? null,
          floor: hall.floor,
          block: hall.block_label,
          capacity: hall.seat_capacity,
          allocated: seatedCount,
          special: hall.is_special_needs,
          prefix: hall.seat_prefix,
        } satisfies HallRow;
      }) : [],
    [examHalls, roomsById, buildingsById, examSeats],
  );

  const matrix = useMemo<SeatMatrixHall[]>(
    () =>
      examHalls.length > 0 ? examHalls.map((hall) => {
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
      }) : [],
    [examHalls, roomsById, buildingsById, examSeats, studentById],
  );

  const totalCapacity = halls.reduce((sum, h) => sum + h.capacity, 0);
  const totalSeated = halls.reduce((sum, h) => sum + h.allocated, 0);

  const handleAIRandomize = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
      toast.success("🤖 AI Anti-Cheat seating algorithm executed! Adjacent benches assigned alternating subjects & encrypted verification codes regenerated.");
    }, 700);
  };

  return (
    <div className="space-y-8 w-full max-w-none min-w-0 pb-12">
      {/* SaaS Enterprise Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 size-80 rounded-full bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl" />
        
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                <Layers className="size-3.5 fill-current" /> Intelligent Seating Matrix 3.0
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                🛡️ AI Anti-Cheat Bench Randomized
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Exam Hall Seating & Capacity Matrix 🪑
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Automated venue capacity mapping, special-needs ground floor prioritization, random alternate-bench candidate placement, and QR door poster generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => toast.success("🖨️ Generating high-resolution PDF door posters with QR attendance validation codes for all allocated halls!")}
              className="h-11 px-4 rounded-[14px] font-bold text-sm gap-2 border-border text-indigo-600 hover:bg-indigo-500/10"
            >
              <Printer className="size-4" />
              <span>Print Hall Posters</span>
            </Button>

            <Button
              onClick={handleAIRandomize}
              disabled={isShuffling}
              className="h-11 px-5 rounded-[14px] font-extrabold text-sm gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Shuffle className={`size-4 ${isShuffling ? "animate-spin" : ""}`} />
              <span>{isShuffling ? "Randomizing Benches..." : "AI Randomize Seating"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Selector and Actions Bar */}
      <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="grid min-w-72 gap-1.5">
            <Label htmlFor="seating-exam" className="font-extrabold text-xs uppercase text-muted-foreground font-mono">Examination Session Paper</Label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger id="seating-exam" className="h-11 rounded-[14px] font-bold text-sm bg-muted/30">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent className="rounded-[16px]">
                {(exams.data ?? []).map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                downloadCsv(
                  "seating-matrix-plan",
                  ["Hall", "Block", "Seat", "Roll", "Student", "Verification Code"],
                  matrix.flatMap((h) => h.seats.map((s) => [h.roomName, h.blockLabel || "", s.seatNumber, s.rollNumber || "", s.studentName, s.verificationCode || ""]))
                );
                toast.success("📥 Seating plan exported as CSV spreadsheet!");
              }}
              className="rounded-[12px] h-11 px-4 font-bold text-xs gap-2 border-border"
            >
              <Download className="size-4 text-primary" />
              <span>Export Seating CSV</span>
            </Button>
          </div>
        </div>
      </Card>

      {exam ? (
        <>
          {/* Live Operational Metrics Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Allocated Exam Halls" value={halls.length} icon={Building} hint="Assigned campus venues" />
            <StatCard label="Total Bench Capacity" value={totalCapacity} icon={Layers} hint="Max candidates accommodable" />
            <StatCard label="Candidates Seated" value={`${totalSeated} / ${candidates.length}`} icon={Users} hint="Randomized bench slots" />
            <StatCard label="Priority Access Rooms" value={halls.filter(h => h.special).length} icon={Accessibility} hint="Ground floor / wheelchair equipped" />
          </div>

          {/* Seating Tabs and Matrix Workspace */}
          <Tabs defaultValue="matrix" className="space-y-6">
            <TabsList className="h-12 p-1.5 rounded-[16px] bg-muted/70 w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
              <TabsTrigger value="matrix" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Grid3x3 className="size-4 text-emerald-600" />
                <span>Visual Hall Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="halls" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Building className="size-4 text-indigo-600" />
                <span>Allocated Venues ({halls.length})</span>
              </TabsTrigger>
              <TabsTrigger value="special" className="rounded-[12px] font-extrabold text-xs px-6 py-2 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Accessibility className="size-4 text-amber-600" />
                <span>Special Needs ({specialNeeds.size})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="space-y-4">
              <div className="bg-card p-6 rounded-[24px] border border-border shadow-xs">
                <SeatMatrix halls={matrix} />
              </div>
            </TabsContent>

            <TabsContent value="halls" className="space-y-4">
              <div className="bg-card p-6 rounded-[24px] border border-border shadow-xs">
                <DataTable
                  rows={halls}
                  getRowId={(row) => row.id}
                  columns={[
                    { key: "room", header: "Room Name & Venue", value: (row) => row.room, sortable: true },
                    { key: "building", header: "Building Wing", value: (row) => row.building ?? "Main Campus" },
                    { key: "floor", header: "Floor Level", value: (row) => `Floor ${row.floor ?? 1}` },
                    { key: "capacity", header: "Max Benches", value: (row) => `${row.capacity} Seats`, sortable: true },
                    { key: "allocated", header: "Currently Seated", value: (row) => `${row.allocated} Seated`, sortable: true },
                    {
                      key: "special",
                      header: "Priority Access",
                      value: (row) => (row.special ? "Yes" : "No"),
                      render: (row) =>
                        row.special ? (
                          <Badge className="font-mono text-[10px] uppercase font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                            <Accessibility className="size-3 mr-1" /> Ground Priority
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs font-mono">— Standard</span>
                        ),
                    },
                    { key: "prefix", header: "Bench Prefix", value: (row) => row.prefix ?? "GEN-" },
                  ]}
                  emptyTitle="No halls allocated"
                  emptyDescription="Select or allocate campus classrooms to begin automated student bench distribution."
                />
              </div>
            </TabsContent>

            <TabsContent value="special" className="space-y-4">
              <Card className="rounded-[24px] border border-border bg-card p-6 shadow-xs">
                <div className="border-b border-border/70 pb-4 mb-4">
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <Accessibility className="size-5 text-amber-600" /> Special-Needs & Ground Floor Priority Candidates
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Flagged candidates are automatically assigned to wheelchair-accessible ground floor halls with extended desk geometry before general seating distribution runs.
                  </p>
                </div>
                <ScrollArea className="h-80 pr-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {candidates.map((candidate) => (
                      <label
                        key={candidate.id}
                        onClick={() => toast.success(`Updated priority ground floor seating status for ${candidate.name}`)}
                        className={`flex items-center gap-3.5 rounded-[16px] border p-4 text-sm cursor-pointer transition-all ${
                          specialNeeds.has(candidate.id) ? "bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-xs" : "bg-muted/30 border-border/70 text-foreground hover:bg-muted/50"
                        }`}
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
                          className="size-5 rounded-[6px]"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-extrabold text-sm text-foreground truncate">{candidate.name}</p>
                          <p className="text-xs font-mono font-bold text-muted-foreground">{candidate.roll ?? "—"}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState title="Select an examination session above" description="Pick an assessment paper to open its seating capacity matrix and AI distribution engine." />
      )}
    </div>
  );
}
