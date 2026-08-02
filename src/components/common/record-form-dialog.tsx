import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type FieldType = "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  help?: string;
  full?: boolean;
  min?: number;
  max?: number;
}

export type RecordValues = Record<string, string | number | null>;

function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    if (field.type === "number") {
      schema = z.preprocess(
        (value) => (value === "" || value === null ? undefined : Number(value)),
        field.required
          ? z.number({ invalid_type_error: "Enter a number" })
          : z.number({ invalid_type_error: "Enter a number" }).optional(),
      );
      if (field.min !== undefined || field.max !== undefined) {
        schema = schema.superRefine((value, ctx) => {
          if (typeof value !== "number") return;
          if (field.min !== undefined && value < field.min)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Minimum is ${field.min}` });
          if (field.max !== undefined && value > field.max)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Maximum is ${field.max}` });
        });
      }
    } else if (field.type === "email") {
      const base = z.string().trim().email("Enter a valid email address").max(255);
      schema = field.required ? base : z.union([base, z.literal("")]).optional();
    } else {
      const base = z
        .string()
        .trim()
        .max(field.type === "textarea" ? 2000 : 255);
      schema = field.required
        ? base.min(1, `${field.label} is required`)
        : z.union([base, z.literal("")]).optional();
    }
    shape[field.name] = schema;
  }
  return z.object(shape);
}

export function RecordFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialValues,
  submitLabel = "Save",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initialValues?: RecordValues;
  submitLabel?: string;
  onSubmit: (values: RecordValues) => Promise<void>;
}) {
  const emptyValues = useMemo(() => {
    const base: RecordValues = {};
    for (const field of fields) base[field.name] = "";
    return base;
  }, [fields]);

  const [values, setValues] = useState<RecordValues>(emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({ ...emptyValues, ...(initialValues ?? {}) });
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = useMemo(
    () =>
      fields.some((field) => {
        const initial = (initialValues ?? {})[field.name] ?? "";
        const current = values[field.name] ?? "";
        return String(initial) !== String(current);
      }),
    [fields, initialValues, values],
  );

  useEffect(() => {
    if (!open || !dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [open, dirty]);

  const requestClose = (next: boolean) => {
    if (!next && dirty && !busy) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  };

  const submit = async () => {
    const schema = buildSchema(fields);
    const result = schema.safeParse(values);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const payload: RecordValues = {};
      for (const field of fields) {
        const raw = (result.data as RecordValues)[field.name];
        payload[field.name] = raw === "" || raw === undefined ? null : raw;
      }
      await onSubmit(payload);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-7 border-border/80">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            {description ? <DialogDescription className="text-sm mt-1">{description}</DialogDescription> : null}
          </DialogHeader>

          <form
            className="grid gap-5 sm:grid-cols-2 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {fields.map((field) => {
              const id = `field-${field.name}`;
              const error = errors[field.name];
              const value = values[field.name] ?? "";
              return (
                <div key={field.name} className={cn("space-y-1.5", field.full && "sm:col-span-2")}>
                  <Label htmlFor={id} className="text-xs font-semibold tracking-wide uppercase text-muted-foreground/90 flex items-center">
                    {field.label}
                    {field.required ? <span className="ml-1 text-destructive font-bold">*</span> : null}
                  </Label>

                  {field.type === "select" ? (
                    <Select
                      value={String(value || "")}
                      onValueChange={(next) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.name]: next === "__none" ? "" : next,
                        }))
                      }
                    >
                      <SelectTrigger id={id} aria-invalid={Boolean(error)}>
                        <SelectValue placeholder={field.placeholder ?? "Select…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!field.required ? <SelectItem value="__none">Not set</SelectItem> : null}
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      value={String(value)}
                      placeholder={field.placeholder}
                      aria-invalid={Boolean(error)}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                    />
                  ) : (
                    <Input
                      id={id}
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : (field.type ?? "text")
                      }
                      value={String(value)}
                      placeholder={field.placeholder}
                      aria-invalid={Boolean(error)}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                    />
                  )}

                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : field.help ? (
                    <p className="text-xs text-muted-foreground">{field.help}</p>
                  ) : null}
                </div>
              );
            })}
          </form>

          <DialogFooter className="pt-4 mt-2">
            <Button variant="outline" onClick={() => requestClose(false)} disabled={busy} className="w-24">
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={busy} className="w-32 shadow-sm font-semibold">
              {busy ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Discard unsaved changes?"
        description="You have edits that have not been saved yet."
        confirmLabel="Discard"
        destructive
        onConfirm={() => {
          setConfirmClose(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
