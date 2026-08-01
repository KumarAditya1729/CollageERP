import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { PageHeader, type Crumb } from "@/components/common/page-header";
import {
  RecordFormDialog,
  type FieldDef,
  type RecordValues,
} from "@/components/common/record-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccess } from "@/hooks/useAccess";
import { useResourceList, useResourceMutations } from "@/hooks/useResource";

export interface ResourcePageProps<T extends Record<string, unknown>> {
  title: string;
  description: string;
  crumbs?: Crumb[];
  table: string;
  select: string;
  orderBy?: { column: string; ascending?: boolean };
  campusScoped?: boolean;
  columns: DataTableColumn<T>[];
  fields: FieldDef[];
  /** Maps a row to the form's initial values when editing. */
  toFormValues: (row: T) => RecordValues;
  managePermission: string;
  entityLabel: string;
  storageKey: string;
  filters?: ReactNode;
  summary?: ReactNode;
  rowExtras?: (row: T) => ReactNode;
  /** Hide the page header when embedded inside a tabbed page. */
  hideHeader?: boolean;
  /** Extra values merged into every create payload (e.g. parent ids). */
  defaults?: RecordValues;
  onRowClick?: (row: T) => void;
}

export function ResourcePage<T extends Record<string, unknown>>({
  title,
  description,
  crumbs,
  table,
  select,
  orderBy,
  campusScoped,
  columns,
  fields,
  toFormValues,
  managePermission,
  entityLabel,
  storageKey,
  filters,
  summary,
  rowExtras,
  hideHeader,
  defaults,
  onRowClick,
}: ResourcePageProps<T>) {
  const { can } = useAccess();
  const canManage = can(managePermission);
  const query = useResourceList<T>({ table, select, orderBy, campusScoped });
  const { create, update, remove } = useResourceMutations({ table });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <>
      {hideHeader ? (
        canManage ? (
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New {entityLabel}
            </Button>
          </div>
        ) : null
      ) : (
        <PageHeader
          title={title}
          description={description}
          crumbs={crumbs}
          actions={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New {entityLabel}
              </Button>
            ) : null
          }
        />
      )}

      {summary}

      <DataTable<T>
        columns={columns}
        rows={query.data}
        getRowId={(row) => String(row.id)}
        loading={query.isLoading}
        error={(query.error as Error) ?? null}
        onRetry={() => void query.refetch()}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        onRowClick={onRowClick}
        filters={filters}
        storageKey={storageKey}
        exportName={storageKey}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        emptyDescription={
          canManage
            ? `Create the first ${entityLabel} to get started.`
            : `Nothing has been added yet, and you don't have permission to create ${title.toLowerCase()}.`
        }
        emptyAction={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New {entityLabel}
            </Button>
          ) : undefined
        }
        bulkActions={
          canManage
            ? (ids, clear) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingDelete(ids);
                    clear();
                  }}
                >
                  <Trash2 className="size-4" />
                  Remove selected
                </Button>
              )
            : undefined
        }
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {rowExtras?.(row)}
              <DropdownMenuItem disabled={!canManage} onClick={() => openEdit(row)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canManage}
                className="text-destructive focus:text-destructive"
                onClick={() => setPendingDelete([String(row.id)])}
              >
                <Trash2 className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? `Edit ${entityLabel}` : `New ${entityLabel}`}
        description={
          editing
            ? "Update this record. Changes are written to your college workspace immediately."
            : `Add a new ${entityLabel} to your college workspace.`
        }
        fields={fields}
        initialValues={editing ? toFormValues(editing) : undefined}
        submitLabel={editing ? "Save changes" : `Create ${entityLabel}`}
        onSubmit={async (values) => {
          if (editing) await update.mutateAsync({ id: String(editing.id), values });
          else await create.mutateAsync({ ...defaults, ...values });
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Remove ${pendingDelete?.length ?? 0} ${entityLabel}${(pendingDelete?.length ?? 0) > 1 ? "s" : ""}?`}
        description="The record is soft deleted and kept in the audit trail, so it can be restored by an administrator."
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (pendingDelete) await remove.mutateAsync(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
