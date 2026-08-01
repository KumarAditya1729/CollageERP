import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";
import { useStaffList, useFacultyList, type StaffRow } from "@/hooks/hrms/useEmployees";
import { EmployeeCard } from "@/components/hrms/EmployeeCard";

export const Route = createFileRoute("/_authenticated/hrms/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const [search, setSearch] = useState("");
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: faculty, isLoading: facultyLoading } = useFacultyList();

  const filterFn = (e: { first_name: string; last_name: string | null; employee_code: string }) => {
    const q = search.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(q) ||
      (e.last_name?.toLowerCase() ?? "").includes(q) ||
      e.employee_code.toLowerCase().includes(q)
    );
  };

  const filteredStaff = staff?.filter(filterFn) ?? [];
  const filteredFaculty = faculty?.filter(filterFn) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            {(staff?.length ?? 0) + (faculty?.length ?? 0)} total employees
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or employee code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredStaff.length + filteredFaculty.length})
          </TabsTrigger>
          <TabsTrigger value="faculty">Faculty ({filteredFaculty.length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({filteredStaff.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {staffLoading || facultyLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading employees...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredFaculty.map((f) => (
                <EmployeeCard key={f.id} employee={f as unknown as StaffRow} />
              ))}
              {filteredStaff.map((s) => (
                <EmployeeCard key={s.id} employee={s} />
              ))}
              {filteredFaculty.length === 0 && filteredStaff.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  No employees found.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFaculty.map((f) => (
              <EmployeeCard key={f.id} employee={f as unknown as StaffRow} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStaff.map((s) => (
              <EmployeeCard key={s.id} employee={s} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
