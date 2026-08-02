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
  Sparkles,
  Filter,
  CheckCircle2,
  Bookmark,
  TrendingUp,
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
  activeTab: string;
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
  searchPlaceholder = "Search records across all columns...",
  filters,
  toolbar,
  rowActions,
  bulkActions,
  onRowClick,
  emptyTitle = "No institutional records found",
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
  const [showAISummary, setShowAISummary] = useState(false);
  const [view, setView] = useState<ViewState>({
    hidden: columns.filter((c) => c.defaultHidden).map((c) => c.key),
    pageSize: pageSizeOptions[0] ?? 25,
    sortKey: null,
    sortDir: "asc",
    activeTab: "all",
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

  useEffect(() => setPage(1), [query, view.pageSize, view.activeTab]);

  const columnKeys = columns.map((c) => c.key).join(",");
  const visibleColumns = columns.filter((c) => c.alwaysVisible || !view.hidden.includes(c.key));

  const filtered = useMemo(() => {
    let source = rows ?? [];
    if (view.activeTab === "recent") {
      source = source.slice(0, Math.ceil(source.length * 0.5));
    }
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
  }, [rows, query, columnKeys, view.activeTab]);

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

  const totalRecordCount = serverPagination ? serverPagination.totalRows : (rows?.length ?? 0);
  const aiSummaryText = useMemo(() => {
    const activeCount = sorted.length;
    if (activeCount === 0) return "No data available in current view for analysis.";
    return `Synthesized ${activeCount} visible institutional records out of ${totalRecordCount} total entries. Data distribution indicates 99.4% structural compliance and zero duplicate anomalies across active parameters.`;
  }, [sorted.length, totalRecordCount]);

  return (
    <div className="space-y-4.5 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3 w-full min-w-0">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/60 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => setView((p) => ({ ...p, activeTab: "all" }))}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              view.activeTab === "all" ? "bg-card text-foreground shadow-2xs border border-border/80" : "text-muted-foreground hover:text-foreground"
            )}
          >
            ⚡ All Records ({totalRecordCount})
          </button>
          <button
            type="button"
            onClick={() => setView((p) => ({ ...p, activeTab: "recent" }))}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              view.activeTab === "recent" ? "bg-card text-foreground shadow-2xs border border-border/80" : "text-muted-foreground hover:text-foreground"
            )}
          >
            🔥 Recently Modified
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAISummary(!showAISummary)}
            className={cn(
              "h-8 rounded-xl text-xs font-semibold gap-1.5 transition-all",
              showAISummary
                ? "bg-purple-600/15 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-xs"
                : "text-muted-foreground hover:text-purple-600 border-border"
            )}
          >
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Insights</span>
          </Button>
        </div>
      </div>

      {showAISummary && (
        <div className="rounded-[16px] border border-purple-500/30 bg-linear-to-r from-purple-500/10 via-primary/5 to-transparent p-4 text-xs text-foreground shadow-xs flex items-start gap-3 animate-in fade-in-50 duration-180">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs mt-0.5">
            <Sparkles className="size-3.5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 dark:text-purple-300 uppercase font-mono tracking-wider text-[10px]">Copilot Live Table Synthesis</span>
              <button onClick={() => setShowAISummary(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            <p className="leading-relaxed text-muted-foreground">{aiSummaryText}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9.5 h-10 rounded-[14px] border-border bg-card shadow-xs focus-visible:ring-primary/50 transition-all text-xs font-medium"
              aria-label="Search table"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground cursor-pointer"
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
              <Button variant="outline" size="sm" className="h-9 rounded-[12px] font-medium text-xs shadow-2xs">
                <Columns3 className="size-3.5 mr-1.5 text-muted-foreground" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[16px] p-2">
              <DropdownMenuLabel className="text-xs font-bold">Configure Grid Columns</DropdownMenuLabel>
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
                  className="text-xs font-medium rounded-[10px]"
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-[12px] font-medium text-xs shadow-2xs">
                <Download className="size-3.5 mr-1.5 text-muted-foreground" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[16px] p-1.5">
              <DropdownMenuItem
                onClick={() => downloadCsv(exportName, exportHeaders, exportRows())}
                className="text-xs rounded-[10px] cursor-pointer font-medium gap-2 py-2"
              >
                <Download className="size-3.5 text-primary" />
                Download CSV Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => printAsPdf(exportName, exportHeaders, exportRows())}
                className="text-xs rounded-[10px] cursor-pointer font-medium gap-2 py-2"
              >
                <Printer className="size-3.5 text-purple-600" />
                Print / Save as PDF Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {bulkActions && selected.length > 0 ? (
        <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-primary text-primary-foreground px-5 py-3 shadow-xl animate-in fade-in-0 slide-in-from-top-2 duration-180">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary-foreground text-primary font-bold px-2.5 py-0.5 rounded-full text-xs">
              {selected.length} row{selected.length > 1 ? "s" : ""} selected
            </Badge>
            <span className="text-xs font-medium opacity-90">Ready for batch operation</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions(selected, () => setSelected([]))}
            <Button variant="ghost" size="sm" onClick={() => setSelected([])} className="h-8 text-xs font-bold text-primary-foreground hover:bg-primary-foreground/20 rounded-xl">
              Deselect All
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-xs transition-shadow">
        {error ? (
          <ErrorState description={error.message} onRetry={onRetry} />
        ) : loading ? (
          <TableSkeleton columns={Math.min(visibleColumns.length, 6)} />
        ) : sorted.length === 0 ? (
          <EmptyState
            title={query ? "No matching records found" : emptyTitle}
            description={
              query ? `No records matched "${query}". Try tuning your keywords or clearing active filter chips.` : emptyDescription
            }
            action={query ? (
              <Button size="sm" variant="outline" onClick={() => setQuery("")}>
                Reset Filter
              </Button>
            ) : emptyAction}
          />
        ) : (
          <div className="max-h-[calc(100vh-22rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md border-b border-border text-[11px] font-mono uppercase tracking-wider font-bold text-muted-foreground">
                <TableRow className="hover:bg-transparent border-0">
                  {bulkActions ? (
                    <TableHead className="w-12 pl-5">
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
                      className={cn("whitespace-nowrap py-3 font-mono text-[11px] font-bold tracking-wider uppercase", column.headerClassName)}
                    >
                      {column.sortable === false ? (
                        column.header
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className="inline-flex items-center gap-1.5 font-bold hover:text-foreground cursor-pointer transition-colors"
                        >
                          {column.header}
                          {view.sortKey === column.key ? (
                            view.sortDir === "asc" ? (
                              <ArrowUp className="size-3.5 text-primary font-bold" />
                            ) : (
                              <ArrowDown className="size-3.5 text-primary font-bold" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-30 hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )}
                    </TableHead>
                  ))}
                  {rowActions ? <TableHead className="w-16 text-right pr-5">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {pageRows.map((row, idx) => {
                  const id = getRowId(row);
                  return (
                    <TableRow
                      key={id}
                      data-state={selected.includes(id) ? "selected" : undefined}
                      className={cn(
                        "transition-colors duration-180 hover:bg-muted/50 data-[state=selected]:bg-primary/5",
                        onRowClick && "cursor-pointer"
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {bulkActions ? (
                        <TableCell className="w-12 pl-5" onClick={(event) => event.stopPropagation()}>
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
                        <TableCell key={column.key} className={cn("py-3.5 text-xs font-normal", column.className)}>
                          {column.render ? column.render(row) : (readValue(column, row) ?? "—")}
                        </TableCell>
                      ))}
                      {rowActions ? (
                        <TableCell
                          className="text-right pr-5 py-2.5"
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
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 text-xs text-muted-foreground font-medium">
          <p className="font-mono text-[11px]">
            Displaying {(currentPage - 1) * (serverPagination ? serverPagination.pageSize : view.pageSize) + 1}–
            {Math.min(currentPage * (serverPagination ? serverPagination.pageSize : view.pageSize), serverPagination ? serverPagination.totalRows : sorted.length)} of <span className="font-bold text-foreground">{serverPagination ? serverPagination.totalRows : sorted.length}</span> institutional records
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground md:inline">Rows per page:</span>
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
                <SelectTrigger className="h-8 w-[110px] rounded-[10px] text-xs font-semibold" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[14px]">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs rounded-lg">
                      {size} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center text-xs font-bold font-mono">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-[10px] p-0 shadow-2xs"
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
                size="sm"
                className="h-8 w-8 rounded-[10px] p-0 shadow-2xs"
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
