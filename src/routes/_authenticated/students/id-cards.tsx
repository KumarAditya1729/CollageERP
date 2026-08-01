import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/page-header";
import { ErrorState, InlineLoader } from "@/components/common/states";
import { StudentIdCard } from "@/components/students/student-id-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/useAccess";
import { useStudentLookups, useStudentRegister } from "@/hooks/useStudents";
import { studentName } from "@/lib/students";

export const Route = createFileRoute("/_authenticated/students/id-cards")({
  head: () => ({
    meta: [
      { title: "Student ID cards — CampusOS" },
      {
        name: "description",
        content:
          "Generate, preview and batch print student identity cards with QR verification and barcodes.",
      },
      { property: "og:title", content: "Student ID cards — CampusOS" },
      {
        property: "og:description",
        content: "Batch generation of digital and printable student identity cards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IdCardsPage,
  errorComponent: ({ error }) => (
    <ErrorState title="ID cards unavailable" description={error.message} />
  ),
  notFoundComponent: () => <ErrorState title="Nothing here" />,
});

const ALL = "__all";

function IdCardsPage() {
  const { tenant, campuses } = useAccess();
  const register = useStudentRegister();
  const lookups = useStudentLookups();

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState(ALL);
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (register.data ?? []).filter((row) => {
      if (program !== ALL && row.program_id !== program) return false;
      if (!needle) return true;
      return [row.admission_number, row.roll_number, studentName(row), row.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [register.data, search, program]);

  const chosen = rows.filter((row) => selected.includes(row.id));

  if (register.error) {
    return (
      <ErrorState
        title="Could not load students"
        description={(register.error as Error).message}
        onRetry={() => void register.refetch()}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="ID cards"
        description="Select students and print identity cards carrying a QR verification payload and admission barcode."
        crumbs={[
          { label: "People" },
          { label: "Students", to: "/students" },
          { label: "ID cards" },
        ]}
        actions={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" asChild>
              <Link to="/students">Back to register</Link>
            </Button>
            <Button onClick={() => window.print()} disabled={!chosen.length}>
              <Printer className="size-4" />
              Print {chosen.length || ""} card{chosen.length === 1 ? "" : "s"}
            </Button>
          </div>
        }
      />

      <Card className="shadow-none print:hidden">
        <CardHeader>
          <CardTitle className="text-sm">Choose students</CardTitle>
          <CardDescription>
            Filter the register, then tick the students whose cards you need.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_240px_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, admission or roll number"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Programme</Label>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All programmes</SelectItem>
                  {(lookups.data?.programs ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => setSelected(rows.map((row) => row.id))}>
                Select all ({rows.length})
              </Button>
              <Button variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>

          {register.isLoading ? <InlineLoader label="Loading register" /> : null}

          <div className="grid max-h-72 gap-1.5 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2 lg:grid-cols-3">
            {!rows.length && !register.isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">No students match these filters.</p>
            ) : null}
            {rows.map((row) => (
              <label
                key={row.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={selected.includes(row.id)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) =>
                      checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                    )
                  }
                />
                <span className="min-w-0 truncate">
                  {studentName(row)}
                  <span className="text-muted-foreground"> · {row.admission_number}</span>
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {chosen.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chosen.map((row) => (
            <StudentIdCard
              key={row.id}
              student={row}
              context={{
                collegeName: tenant?.name ?? "CampusOS",
                collegeLogo: tenant?.logo_url,
                campusName: campuses.find((c) => c.id === row.campus_id)?.name ?? null,
                programName:
                  lookups.data?.programs.find((p) => p.id === row.program_id)?.name ?? null,
                departmentName:
                  lookups.data?.departments.find((d) => d.id === row.department_id)?.name ?? null,
                validUntil: row.graduation_date,
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="shadow-none print:hidden">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Select students above to preview their identity cards.
          </CardContent>
        </Card>
      )}
    </>
  );
}
