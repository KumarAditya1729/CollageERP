import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  labelize,
  optionsFrom,
  roomTypes,
  useAcademicLookups,
  weekdays,
} from "@/hooks/useAcademics";

export const Route = createFileRoute("/_authenticated/academics/infrastructure")({
  head: () => ({
    meta: [
      { title: "Rooms & infrastructure — CampusOS" },
      {
        name: "description",
        content: "Buildings, floors, classrooms, labs, capacity, equipment and timetable periods.",
      },
      { property: "og:title", content: "Rooms & infrastructure — CampusOS" },
      { property: "og:description", content: "Buildings, rooms, labs and timetable slots." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InfrastructurePage,
});

interface BuildingRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  floors: number;
}

interface RoomRow extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  building_id: string | null;
  department_id: string | null;
  room_type: string;
  floor: number;
  capacity: number | null;
  equipment: string | null;
  is_available: boolean;
}

interface SlotRow extends Record<string, unknown> {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_order: number;
  is_break: boolean;
  is_active: boolean;
}

function InfrastructurePage() {
  const { buildings, departments } = useAcademicLookups();

  return (
    <>
      <PageHeader
        title="Rooms & infrastructure"
        description="Physical teaching capacity — buildings, classrooms, labs and the timetable periods they will be scheduled into."
        crumbs={[{ label: "Academics", to: "/academics" }, { label: "Infrastructure" }]}
      />

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="rooms">Rooms & labs</TabsTrigger>
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="slots">Time slots</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <ResourcePage<RoomRow>
            hideHeader
            title="Rooms"
            description="Rooms"
            table="rooms"
            select="id, name, code, building_id, department_id, room_type, floor, capacity, equipment, is_available"
            orderBy={{ column: "code" }}
            campusScoped
            managePermission="room.manage"
            entityLabel="room"
            storageKey="rooms"
            columns={[
              { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Room" },
              {
                key: "room_type",
                header: "Type",
                render: (row) => <Badge variant="outline">{labelize(row.room_type)}</Badge>,
              },
              {
                key: "building_id",
                header: "Building",
                value: (row) => buildings.data?.find((b) => b.id === row.building_id)?.name ?? null,
              },
              { key: "floor", header: "Floor" },
              { key: "capacity", header: "Capacity" },
              { key: "equipment", header: "Equipment", defaultHidden: true },
              {
                key: "is_available",
                header: "Availability",
                value: (row) => (row.is_available ? "Available" : "Blocked"),
                render: (row) => (
                  <Badge variant={row.is_available ? "default" : "secondary"}>
                    {row.is_available ? "Available" : "Blocked"}
                  </Badge>
                ),
              },
            ]}
            fields={[
              { name: "name", label: "Room name", required: true },
              { name: "code", label: "Code", required: true },
              {
                name: "room_type",
                label: "Type",
                type: "select",
                required: true,
                options: roomTypes.map((value) => ({ value, label: labelize(value) })),
              },
              {
                name: "building_id",
                label: "Building",
                type: "select",
                options: optionsFrom(buildings.data),
              },
              {
                name: "department_id",
                label: "Owning department",
                type: "select",
                options: optionsFrom(departments.data),
              },
              { name: "floor", label: "Floor", type: "number", min: -5, max: 100 },
              { name: "capacity", label: "Capacity", type: "number", min: 0, max: 5000 },
              { name: "equipment", label: "Equipment", type: "textarea", full: true },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              code: row.code,
              room_type: row.room_type,
              building_id: row.building_id ?? "",
              department_id: row.department_id ?? "",
              floor: row.floor,
              capacity: row.capacity ?? "",
              equipment: row.equipment ?? "",
            })}
          />
        </TabsContent>

        <TabsContent value="buildings" className="space-y-4">
          <ResourcePage<BuildingRow>
            hideHeader
            title="Buildings"
            description="Buildings"
            table="buildings"
            select="id, name, code, floors"
            orderBy={{ column: "name" }}
            campusScoped
            managePermission="campus.manage"
            entityLabel="building"
            storageKey="buildings"
            columns={[
              { key: "code", header: "Code", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Building" },
              { key: "floors", header: "Floors" },
            ]}
            fields={[
              { name: "name", label: "Building name", required: true },
              { name: "code", label: "Code", required: true },
              { name: "floors", label: "Floors", type: "number", required: true, min: 1, max: 100 },
            ]}
            toFormValues={(row) => ({ name: row.name, code: row.code, floors: row.floors })}
          />
        </TabsContent>

        <TabsContent value="slots" className="space-y-4">
          <ResourcePage<SlotRow>
            hideHeader
            title="Time slots"
            description="Time slots"
            table="time_slots"
            select="id, name, day_of_week, start_time, end_time, slot_order, is_break, is_active"
            orderBy={{ column: "slot_order" }}
            campusScoped
            managePermission="timetable.manage"
            entityLabel="time slot"
            storageKey="time-slots"
            columns={[
              { key: "slot_order", header: "#", alwaysVisible: true, className: "font-medium" },
              { key: "name", header: "Period" },
              {
                key: "day_of_week",
                header: "Day",
                value: (row) =>
                  weekdays.find((d) => d.value === String(row.day_of_week))?.label ?? null,
              },
              { key: "start_time", header: "Start" },
              { key: "end_time", header: "End" },
              {
                key: "is_break",
                header: "Break",
                value: (row) => (row.is_break ? "Break" : "Teaching"),
                render: (row) => (
                  <Badge variant={row.is_break ? "secondary" : "outline"}>
                    {row.is_break ? "Break" : "Teaching"}
                  </Badge>
                ),
              },
            ]}
            fields={[
              { name: "name", label: "Period name", required: true, placeholder: "Period 1" },
              {
                name: "day_of_week",
                label: "Day",
                type: "select",
                required: true,
                options: weekdays,
              },
              {
                name: "start_time",
                label: "Start time (HH:MM)",
                required: true,
                placeholder: "09:00",
              },
              { name: "end_time", label: "End time (HH:MM)", required: true, placeholder: "09:50" },
              {
                name: "slot_order",
                label: "Order",
                type: "number",
                required: true,
                min: 1,
                max: 30,
              },
            ]}
            toFormValues={(row) => ({
              name: row.name,
              day_of_week: String(row.day_of_week),
              start_time: row.start_time,
              end_time: row.end_time,
              slot_order: row.slot_order,
            })}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
