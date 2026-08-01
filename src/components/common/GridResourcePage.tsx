/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  RecordFormDialog,
  type FieldDef,
  type RecordValues,
} from "@/components/common/record-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

export interface GridResourcePageProps<T> {
  title: string;
  description: string;
  items?: T[];
  data?: T[];
  isLoading: boolean;
  renderItem?: (item: T, onEdit: (item: T) => void, onDelete: (item: T) => void) => ReactNode;
  CardComponent?: React.ComponentType<any>;
  fields?: FieldDef[];
  formSchema?: Record<string, any>;
  toFormValues?: (item: T) => RecordValues;
  onCreate?: (values: RecordValues) => Promise<void>;
  createMutation?: any;
  onUpdate?: (id: string, values: RecordValues) => Promise<void>;
  updateMutation?: any;
  onDelete?: (id: string) => Promise<void>;
  deleteMutation?: any;
  entityLabel?: string;
  customAction?: { label: string; onClick: () => void };
  searchKeys?: string[];
  searchPlaceholder?: string;
}

export function GridResourcePage<T extends { id: string }>({
  title,
  description,
  items,
  data,
  isLoading,
  renderItem,
  CardComponent,
  fields,
  formSchema,
  toFormValues = (item) => item as any,
  onCreate,
  createMutation,
  onUpdate,
  updateMutation,
  onDelete,
  deleteMutation,
  entityLabel = "Item",
  customAction,
  searchKeys,
  searchPlaceholder,
}: GridResourcePageProps<T>) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const effectiveItems = items || data || [];
  const effectiveFields =
    fields ||
    (formSchema ? Object.entries(formSchema).map(([key, def]) => ({ name: key, ...def })) : []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: T) => {
    setSelectedItem(item);
    setFormOpen(true);
  };

  const handleDelete = (item: T) => {
    setSelectedItem(item);
    setDeleteOpen(true);
  };

  const handleSubmit = async (values: RecordValues) => {
    if (selectedItem) {
      if (onUpdate) await onUpdate(selectedItem.id, values);
      else if (updateMutation) await updateMutation.mutateAsync({ id: selectedItem.id, ...values });
    } else {
      if (onCreate) await onCreate(values);
      else if (createMutation) await createMutation.mutateAsync(values);
    }
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      if (onDelete) await onDelete(selectedItem.id);
      else if (deleteMutation) await deleteMutation.mutateAsync(selectedItem.id);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="flex items-center justify-end gap-2">
        {customAction && (
          <Button variant="outline" onClick={customAction.onClick}>
            {customAction.label}
          </Button>
        )}
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add {entityLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {effectiveItems.map((item) =>
            renderItem ? (
              renderItem(item, handleEdit, handleDelete)
            ) : CardComponent ? (
              <CardComponent
                key={item.id}
                {...{ [entityLabel.toLowerCase()]: item, item: item }}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            ) : null,
          )}
        </div>
      )}

      {effectiveItems.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-center text-muted-foreground">
          <p>No {entityLabel.toLowerCase()}s found.</p>
        </div>
      )}

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selectedItem ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
        fields={effectiveFields}
        initialValues={selectedItem ? toFormValues(selectedItem) : {}}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${entityLabel}?`}
        description={`Are you sure you want to delete this ${entityLabel.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
