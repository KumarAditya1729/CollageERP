import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { useAccess } from "@/hooks/useAccess";
import { useLibraryCatalog } from "@/hooks/library/useLibrary";
import { OPACSearch } from "@/components/library/OPACSearch";
import { BookCard } from "@/components/library/BookCard";
import { BookDetailsDrawer } from "@/components/library/BookDetailsDrawer";

type CatalogItem = {
  id?: string;
  title?: string;
  item_type?: string;
  isbn?: string;
  lib_authors?: { name?: string };
  lib_categories?: { name?: string };
  total_copies?: number;
  cover_image_url?: string;
  lib_publishers?: { name?: string };
  [key: string]: unknown;
};

export const Route = createFileRoute("/_authenticated/library/catalog")({
  component: LibraryCatalog,
});

function LibraryCatalog() {
  const { can } = useAccess();
  const { data: catalog, isLoading } = useLibraryCatalog();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedBook, setSelectedBook] = useState<CatalogItem | null>(null);

  if (!can("library.view")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have access to the Library module.</p>
      </div>
    );
  }

  // OPAC Filtering Logic
  const filteredCatalog = catalog?.filter((item: CatalogItem) => {
    let match = true;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(q);
      const authorMatch = item.lib_authors?.name?.toLowerCase().includes(q);
      const isbnMatch = item.isbn?.toLowerCase().includes(q);
      match = match && !!(titleMatch || authorMatch || isbnMatch);
    }

    if (filters.type) {
      match = match && item.item_type === filters.type;
    }

    if (filters.category) {
      // In a real app this would map IDs or exact names. For now, simple string inclusion check
      match =
        match &&
        !!item.lib_categories?.name?.toLowerCase().includes(filters.category.toLowerCase());
    }

    return match;
  });

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)]">
      <PageHeader
        title="Catalog & OPAC"
        description="Search for books, journals, and digital assets."
      />

      <div className="bg-muted/30 p-6 rounded-xl border">
        <OPACSearch onSearch={setFilters} />
      </div>

      <div className="flex-1 overflow-auto -mx-6 px-6">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredCatalog?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
            <p>No items found matching your search criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 pb-6">
            {filteredCatalog?.map((item: CatalogItem) => (
              <BookCard key={item.id} item={item} onViewDetails={setSelectedBook} />
            ))}
          </div>
        )}
      </div>

      <BookDetailsDrawer
        item={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBook(null)}
        onReserve={(item) => {
          // Future integration with ReservationDialog
          console.log("Reserve", item);
        }}
      />
    </div>
  );
}
