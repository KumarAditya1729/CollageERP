import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Printer,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv, printAsPdf } from "@/lib/export";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Raw value used for searching, sorting and exports. */
  value?: (row: T) => string | number | null | undefined;
  /** Custom cell rendering. Falls back to `value`. */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  defaultHidden?: boolean;
  alwaysVisible?: boolean;
}

interface ViewState {
  hidden: string[];
  pageSize: number;
  sortKey: string | null;
  sortDir: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  toolbar?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  bulkActions?: (ids: string[], clear: () => void) => ReactNode;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  exportName?: string;
  /** Persists column visibility, page size and sorting for this table. */
  storageKey?: string;
  pageSizeOptions?: number[];
  serverPagination?: {
    totalRows: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
}

function readValue<T>(column: DataTableColumn<T>, row: T) {
  if (column.value) return column.value(row);
  const raw = (row as Record<string, unknown>)[column.key];
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "object") return null;
  return raw as string | number;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  onRetry,
  searchPlaceholder = "Search…",
  filters,
  toolbar,
  rowActions,
  bulkActions,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  exportName = "Export",
  storageKey,
  pageSizeOptions = [10, 25, 50, 100],
  serverPagination,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>({
    hidden: columns.filter((c) => c.defaultHidden).map((c) => c.key),
    pageSize: pageSizeOptions[0] ?? 25,
    sortKey: null,
    sortDir: "asc",
  });

  useEffect(() => {
    if (!storageKey) return;
    const stored = window.localStorage.getItem(`campusos.view.${storageKey}`);
    if (stored) {
      try {
        setView((prev) => ({ ...prev, ...(JSON.parse(stored) as Partial<ViewState>) }));
      } catch {
        /* ignore malformed saved view */
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(`campusos.view.${storageKey}`, JSON.stringify(view));
  }, [storageKey, view]);

  useEffect(() => setPage(1), [query, view.pageSize]);

  const columnKeys = columns.map((c) => c.key).join(",");
  const visibleColumns = columns.filter((c) => c.alwaysVisible || !view.hidden.includes(c.key));

  const filtered = useMemo(() => {
    const source = rows ?? [];
    if (!query.trim()) return source;
    const needle = query.trim().toLowerCase();
    return source.filter((row) =>
      columns.some((column) =>
        String(readValue(column, row) ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, columnKeys]);

  const sorted = useMemo(() => {
    if (!view.sortKey) return filtered;
    const column = columns.find((c) => c.key === view.sortKey);
    if (!column) return filtered;
    const factor = view.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = readValue(column, a);
      const bv = readValue(column, b);
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, view.sortKey, view.sortDir, columnKeys]);

  const totalPages = serverPagination
    ? Math.max(1, Math.ceil(serverPagination.totalRows / serverPagination.pageSize))
    : Math.max(1, Math.ceil(sorted.length / view.pageSize));
  
  const currentPage = serverPagination ? serverPagination.page : Math.min(page, totalPages);
  
  const pageRows = serverPagination 
    ? (rows ?? [])
    : sorted.slice((currentPage - 1) * view.pageSize, currentPage * view.pageSize);

  const exportRows = () =>
    sorted.map((row) => visibleColumns.map((column) => readValue(column, row) ?? ""));
  const exportHeaders = visibleColumns.map((c) => c.header);

  const allOnPageSelected =
    pageRows.length > 0 && pageRows.every((row) => selected.includes(getRowId(row)));

  const toggleSort = (key: string) =>
    setView((prev) => ({
      ...prev,
      sortKey: key,
      sortDir: prev.sortKey === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
              aria-label="Search table"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          {filters}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={column.alwaysVisible || !view.hidden.includes(column.key)}
                  disabled={column.alwaysVisible}
                  onCheckedChange={(checked) =>
                    setView((prev) => ({
                      ...prev,
                      hidden: checked
                        ? prev.hidden.filter((key) => key !== column.key)
                        : [...prev.hidden, column.key],
                    }))
                  }
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => downloadCsv(exportName, exportHeaders, exportRows())}
              >
                <Download className="size-4" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printAsPdf(exportName, exportHeaders, exportRows())}>
                <Printer className="size-4" />
                Print / Save as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {bulkActions && selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-accent/40 px-3 py-2">
          <Badge variant="secondary">{selected.length} selected</Badge>
          {bulkActions(selected, () => setSelected([]))}
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
        {error ? (
          <ErrorState description={error.message} onRetry={onRetry} />
        ) : loading ? (
          <TableSkeleton columns={Math.min(visibleColumns.length, 6)} />
        ) : sorted.length === 0 ? (
          <EmptyState
            title={query ? "No matching records" : emptyTitle}
            description={
              query ? "Try a different search term or clear the filters." : emptyDescription
            }
            action={query ? undefined : emptyAction}
          />
        ) : (
          <div className="max-h-[calc(100vh-22rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  {bulkActions ? (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPageSelected}
                        aria-label="Select all rows on this page"
                        onCheckedChange={(checked) =>
                          setSelected((prev) => {
                            const ids = pageRows.map(getRowId);
                            return checked
                              ? Array.from(new Set([...prev, ...ids]))
                              : prev.filter((id) => !ids.includes(id));
                          })
                        }
                      />
                    </TableHead>
                  ) : null}
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn("whitespace-nowrap", column.headerClassName)}
                    >
                      {column.sortable === false ? (
                        column.header
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground"
                        >
                          {column.header}
                          {view.sortKey === column.key ? (
                            view.sortDir === "asc" ? (
                              <ArrowUp className="size-3.5" />
                            ) : (
                              <ArrowDown className="size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      )}
                    </TableHead>
                  ))}
                  {rowActions ? <TableHead className="w-12 text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                  const id = getRowId(row);
                  return (
                    <TableRow
                      key={id}
                      data-state={selected.includes(id) ? "selected" : undefined}
                      className={cn(onRowClick && "cursor-pointer")}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {bulkActions ? (
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selected.includes(id)}
                            aria-label="Select row"
                            onCheckedChange={(checked) =>
                              setSelected((prev) =>
                                checked ? [...prev, id] : prev.filter((value) => value !== id),
                              )
                            }
                          />
                        </TableCell>
                      ) : null}
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          {column.render ? column.render(row) : (readValue(column, row) ?? "—")}
                        </TableCell>
                      ))}
                      {rowActions ? (
                        <TableCell
                          className="text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {rowActions(row)}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {!loading && !error && (serverPagination ? serverPagination.totalRows > 0 : sorted.length > 0) ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * (serverPagination ? serverPagination.pageSize : view.pageSize) + 1}–
            {Math.min(currentPage * (serverPagination ? serverPagination.pageSize : view.pageSize), serverPagination ? serverPagination.totalRows : sorted.length)} of {serverPagination ? serverPagination.totalRows : sorted.length}
          </p>
          <div className="flex items-center space-x-2">
            <p className="hidden text-sm font-medium md:block">Rows per page</p>
            <Select
              value={String(serverPagination ? serverPagination.pageSize : view.pageSize)}
              onValueChange={(v) => {
                const size = Number(v);
                if (serverPagination) {
                  serverPagination.onPageSizeChange(size);
                } else {
                  setView((prev) => ({ ...prev, pageSize: size }));
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[120px]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => {
                  if (serverPagination) serverPagination.onPageChange(currentPage - 1);
                  else setPage((p) => p - 1);
                }}
                disabled={currentPage <= 1 || loading}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => {
                  if (serverPagination) serverPagination.onPageChange(currentPage + 1);
                  else setPage((p) => p + 1);
                }}
                disabled={currentPage >= totalPages || loading}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
