import { BookOpen, Users, Clock, AlertTriangle, FileText } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAccess } from "@/hooks/useAccess";
import {
  useLibraryCatalog,
  useLibraryCirculation,
  useLibraryMembers,
  useLibraryFines,
} from "@/hooks/library/useLibrary";
import { Skeleton } from "@/components/ui/skeleton";
import { isPast, differenceInDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/library/")({
  component: LibraryDashboard,
});

function LibraryDashboard() {
  const { can } = useAccess();
  const catalog = useLibraryCatalog();
  const circulation = useLibraryCirculation();
  const members = useLibraryMembers();
  const fines = useLibraryFines();

  if (!can("library.view")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have access to the Library module.</p>
      </div>
    );
  }

  const isLoading =
    catalog.isLoading || circulation.isLoading || members.isLoading || fines.isLoading;

  const totalBooks =
    catalog.data?.reduce(
      (sum: number, item: { total_copies?: number }) => sum + (item.total_copies || 0),
      0,
    ) || 0;
  const activeMembers =
    members.data?.filter((m: { status?: string }) => m.status === "active").length || 0;

  const activeIssues =
    circulation.data?.filter(
      (c: { status?: string; due_date?: string }) => c.status === "issued",
    ) || [];
  const overdues = activeIssues.filter(
    (c: { status?: string; due_date?: string }) => c.due_date && isPast(new Date(c.due_date)),
  );

  const totalFines =
    fines.data
      ?.filter((f: { status?: string; amount?: string | number }) => f.status === "pending")
      .reduce(
        (sum: number, f: { status?: string; amount?: string | number }) => sum + Number(f.amount),
        0,
      ) || 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Library Dashboard"
        description="Overview of library operations, catalog, and circulation."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Physical Books"
            value={totalBooks}
            icon={BookOpen}
            hint="Total copies in stock"
          />
          <StatCard
            label="Active Members"
            value={activeMembers}
            icon={Users}
            hint="Students & Staff"
          />
          <StatCard
            label="Active Circulations"
            value={activeIssues.length}
            icon={Clock}
            hint={`${overdues.length} currently overdue`}
          />
          <StatCard
            label="Pending Fines"
            value={`₹${totalFines}`}
            icon={AlertTriangle}
            hint="To be collected"
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/library/circulation"
              className="flex items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">Issue / Return</span>
              </div>
            </a>
            <a
              href="/library/catalog"
              className="flex items-center justify-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="text-center">
                <Search className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="text-sm font-medium">OPAC Search</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// We need a dummy Search icon for the quick actions since we didn't import it at the top
function Search(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
