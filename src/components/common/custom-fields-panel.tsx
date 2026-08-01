import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState, InlineLoader } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/useAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Definition {
  id: string;
  key: string;
  label: string;
  field_type: string;
  help_text: string | null;
  placeholder: string | null;
  options: unknown;
  is_required: boolean;
  section: string | null;
}

/** Renders the tenant's custom field definitions for an entity and persists values. */
export function CustomFieldsPanel({
  entityType,
  entityId,
  canManage = true,
}: {
  entityType: string;
  entityId: string;
  canManage?: boolean;
}) {
  const { tenant } = useAccess();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string | boolean>>({});

  const definitions = useQuery({
    queryKey: ["custom-field-definitions", entityType, tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .select("id, key, label, field_type, help_text, placeholder, options, is_required, section")
        .eq("tenant_id", tenant!.id)
        .eq("entity_type", entityType)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Definition[];
    },
  });

  const stored = useQuery({
    queryKey: ["custom-field-values", entityType, entityId],
    enabled: Boolean(entityId && tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_field_values")
        .select("id, definition_id, value")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; definition_id: string; value: unknown }[];
    },
  });

  useEffect(() => {
    if (!stored.data) return;
    const next: Record<string, string | boolean> = {};
    for (const row of stored.data) {
      next[row.definition_id] =
        typeof row.value === "boolean" ? row.value : String(row.value ?? "");
    }
    setValues(next);
  }, [stored.data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = (definitions.data ?? []).map((definition) => ({
        tenant_id: tenant!.id,
        definition_id: definition.id,
        entity_type: entityType,
        entity_id: entityId,
        value: (values[definition.id] ?? "") as never,
        updated_by: user?.id ?? null,
        created_by: user?.id ?? null,
      }));
      if (!rows.length) return;
      const { error } = await supabase
        .from("custom_field_values")
        .upsert(rows as never, { onConflict: "definition_id,entity_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Custom fields saved");
      void queryClient.invalidateQueries({
        queryKey: ["custom-field-values", entityType, entityId],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (definitions.isLoading || stored.isLoading)
    return <InlineLoader label="Loading custom fields" />;

  if (!definitions.data?.length) {
    return (
      <EmptyState
        title="No custom fields configured"
        description="Define extra fields for students under Settings to capture institution-specific data."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {definitions.data.map((definition) => {
          const id = `cf-${definition.id}`;
          const raw = values[definition.id] ?? "";
          const options = Array.isArray(definition.options) ? (definition.options as string[]) : [];
          return (
            <div key={definition.id} className="space-y-2">
              <Label htmlFor={id}>
                {definition.label}
                {definition.is_required ? <span className="ml-0.5 text-destructive">*</span> : null}
              </Label>
              {definition.field_type === "boolean" ? (
                <Switch
                  id={id}
                  checked={Boolean(raw)}
                  disabled={!canManage}
                  onCheckedChange={(checked) =>
                    setValues((prev) => ({ ...prev, [definition.id]: checked }))
                  }
                />
              ) : definition.field_type === "select" && options.length ? (
                <Select
                  value={String(raw)}
                  disabled={!canManage}
                  onValueChange={(next) =>
                    setValues((prev) => ({ ...prev, [definition.id]: next }))
                  }
                >
                  <SelectTrigger id={id}>
                    <SelectValue placeholder={definition.placeholder ?? "Select…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={String(option)} value={String(option)}>
                        {String(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : definition.field_type === "textarea" ? (
                <Textarea
                  id={id}
                  value={String(raw)}
                  disabled={!canManage}
                  placeholder={definition.placeholder ?? undefined}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [definition.id]: event.target.value }))
                  }
                />
              ) : (
                <Input
                  id={id}
                  type={
                    definition.field_type === "number" || definition.field_type === "decimal"
                      ? "number"
                      : definition.field_type === "date"
                        ? "date"
                        : definition.field_type === "email"
                          ? "email"
                          : "text"
                  }
                  value={String(raw)}
                  disabled={!canManage}
                  placeholder={definition.placeholder ?? undefined}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [definition.id]: event.target.value }))
                  }
                />
              )}
              {definition.help_text ? (
                <p className="text-xs text-muted-foreground">{definition.help_text}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save custom fields"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
