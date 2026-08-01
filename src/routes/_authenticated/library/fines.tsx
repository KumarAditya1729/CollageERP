import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/page-header";
import { useAccess } from "@/hooks/useAccess";
import { useLibraryFines } from "@/hooks/library/useLibrary";
import { FineCard } from "@/components/library/FineCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/library/fines")({
  component: LibraryFines,
});

function LibraryFines() {
  const { can } = useAccess();
  const { data: fines, isLoading } = useLibraryFines();

  if (!can("library.manage")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to manage fines.</p>
      </div>
    );
  }

  const pendingFines = fines?.filter((f: { status?: string }) => f.status === "pending") || [];
  const paidFines = fines?.filter((f: { status?: string }) => f.status === "paid") || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Fines & Penalties" description="Track and manage library fines." />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Pending Fines ({pendingFines.length})</h3>
            {pendingFines.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending fines.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pendingFines.map((fine: { id?: string; [key: string]: unknown }) => (
                  <FineCard key={fine.id} fine={fine} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Recently Paid</h3>
            {paidFines.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent payments.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paidFines.slice(0, 6).map((fine: { id?: string; [key: string]: unknown }) => (
                  <FineCard key={fine.id} fine={fine} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
