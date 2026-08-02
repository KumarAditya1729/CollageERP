import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Sparkles, LayoutGrid, Layers } from "lucide-react";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { WizardForm, type WizardStep } from "@/components/common/wizard-form";
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

export type FieldType = "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "time" | "checkbox" | "url" | "password" | "textarea" | "select";

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
  group?: string;
}

export type RecordValues = Record<string, any>;

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
  submitLabel = "Save Record",
  onSubmit,
  defaultWizard = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initialValues?: any;
  submitLabel?: string;
  onSubmit: (values: RecordValues) => Promise<void>;
  defaultWizard?: boolean;
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
  const [isWizardMode, setIsWizardMode] = useState(defaultWizard || fields.length >= 6);

  useEffect(() => {
    if (!open) return;
    setValues({ ...emptyValues, ...(initialValues ?? {}) });
    setErrors({});
    setIsWizardMode(defaultWizard || fields.length >= 6);
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

  const renderField = (field: FieldDef) => {
    const id = `field-${field.name}`;
    const error = errors[field.name];
    const value = values[field.name] ?? "";
    return (
      <div key={field.name} className={cn("space-y-1.5", field.full && "sm:col-span-2")}>
        <Label htmlFor={id} className="text-xs font-bold font-mono tracking-wider uppercase text-muted-foreground/90 flex items-center">
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
            <SelectTrigger id={id} aria-invalid={Boolean(error)} className="h-10 rounded-[14px] bg-background">
              <SelectValue placeholder={field.placeholder ?? "Select option..."} />
            </SelectTrigger>
            <SelectContent className="rounded-[16px]">
              {!field.required ? <SelectItem value="__none">Not specified</SelectItem> : null}
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
            className="rounded-[14px] bg-background min-h-[100px]"
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
            className="h-10 rounded-[14px] bg-background"
            onChange={(event) =>
              setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
            }
          />
        )}

        {error ? (
          <p className="text-xs text-destructive font-semibold flex items-center gap-1">⚠️ {error}</p>
        ) : field.help ? (
          <p className="text-xs text-muted-foreground">{field.help}</p>
        ) : null}
      </div>
    );
  };

  const wizardSteps = useMemo<WizardStep[]>(() => {
    if (!isWizardMode || fields.length < 3) return [];
    const mid = Math.ceil(fields.length / 2);
    const firstHalf = fields.slice(0, mid);
    const secondHalf = fields.slice(mid);

    return [
      {
        id: "step-1",
        title: "Primary Specification",
        description: "Enter primary core details and identifiers for this record.",
        content: <div className="grid gap-5 sm:grid-cols-2 py-2">{firstHalf.map(renderField)}</div>,
      },
      {
        id: "step-2",
        title: "Secondary Parameters & Review",
        description: "Verify operational flags and additional specifications before final submission.",
        content: <div className="grid gap-5 sm:grid-cols-2 py-2">{secondHalf.map(renderField)}</div>,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, isWizardMode, values, errors]);

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className={cn("max-h-[90vh] overflow-y-auto p-7 rounded-[24px] border border-border bg-card shadow-2xl transition-all duration-180", isWizardMode && fields.length >= 4 ? "sm:max-w-3xl" : "sm:max-w-2xl")}>
          <DialogHeader className="pb-4 border-b border-border/70 flex flex-row items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {title}
              </DialogTitle>
              {description ? <DialogDescription className="text-xs text-muted-foreground mt-1">{description}</DialogDescription> : null}
            </div>
            {fields.length >= 4 && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsWizardMode(!isWizardMode)}
                className="h-8 rounded-[12px] text-[11px] font-mono font-semibold text-muted-foreground hover:text-primary shrink-0 gap-1.5"
                title="Toggle between single page grid and multi-step wizard flow"
              >
                {isWizardMode ? (
                  <>
                    <LayoutGrid className="size-3.5" />
                    <span>Grid View</span>
                  </>
                ) : (
                  <>
                    <Layers className="size-3.5 text-purple-600" />
                    <span>Wizard Flow</span>
                  </>
                )}
              </Button>
            )}
          </DialogHeader>

          {isWizardMode && wizardSteps.length > 0 ? (
            <div className="py-2">
              <WizardForm
                steps={wizardSteps}
                onComplete={() => void submit()}
                onCancel={() => requestClose(false)}
                isSubmitting={busy}
                completeLabel={submitLabel}
              />
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2 py-3">
                {fields.map(renderField)}
              </div>

              <DialogFooter className="pt-4 border-t border-border/70">
                <Button type="button" variant="outline" onClick={() => requestClose(false)} disabled={busy} className="h-10 px-5 rounded-[14px] text-xs font-semibold">
                  Cancel
                </Button>
                <Button type="submit" disabled={busy} className="h-10 px-6 rounded-[14px] text-xs font-bold shadow-md bg-primary hover:bg-primary/90">
                  {busy ? "Processing…" : submitLabel}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Discard unsaved modifications?"
        description="You have entered data that has not been submitted yet to the database."
        confirmLabel="Discard & Exit"
        destructive
        onConfirm={() => {
          setConfirmClose(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
