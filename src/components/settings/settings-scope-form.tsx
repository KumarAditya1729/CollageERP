import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, InlineLoader, EmptyState } from "@/components/common/states";
import { useSettings, type SettingDefinition, type SettingScope } from "@/hooks/useSettings";

function optionValues(definition: SettingDefinition): string[] {
  const options = definition.options as { choices?: unknown } | null;
  const choices = Array.isArray(options?.choices) ? options?.choices : null;
  return (choices ?? []).map((choice) => String(choice));
}

function SettingInput({
  definition,
  value,
  onChange,
}: {
  definition: SettingDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const choices = optionValues(definition);

  if (definition.data_type === "boolean") {
    return (
      <Switch
        checked={Boolean(value)}
        aria-label={definition.label}
        onCheckedChange={(checked) => onChange(checked)}
      />
    );
  }

  if (choices.length > 0) {
    return (
      <Select value={value == null ? "" : String(value)} onValueChange={(next) => onChange(next)}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {choices.map((choice) => (
            <SelectItem key={choice} value={choice}>
              {choice}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (definition.data_type === "number" || definition.data_type === "integer") {
    return (
      <Input
        type="number"
        className="w-full sm:w-72"
        value={value == null ? "" : String(value)}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
      />
    );
  }

  if (definition.data_type === "json") {
    return (
      <Textarea
        rows={5}
        className="font-mono text-xs"
        value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (definition.data_type === "text_long") {
    return (
      <Textarea
        rows={4}
        value={value == null ? "" : String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <Input
      className="w-full sm:w-96"
      type={definition.is_secret ? "password" : "text"}
      value={value == null ? "" : String(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/**
 * Renders every setting registered in the settings engine for a scope and
 * writes changes back to tenant_settings.
 */
export function SettingsScopeForm({ scope }: { scope: SettingScope }) {
  const { definitions, valueFor, isLoading, error, refetch, save, saving } = useSettings(scope);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft({});
  }, [scope, definitions.length]);

  if (isLoading) return <InlineLoader label="Loading settings" />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (definitions.length === 0) {
    return (
      <EmptyState
        title="No settings registered"
        description="This area has no configurable settings in the catalogue yet."
      />
    );
  }

  const dirty = Object.keys(draft).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize">{scope} settings</CardTitle>
        <CardDescription>
          Values apply to the active college. Unsaved changes are highlighted until you save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {definitions.map((definition) => {
          const current = definition.key in draft ? draft[definition.key] : valueFor(definition);
          return (
            <div
              key={definition.id}
              className="grid gap-2 border-b pb-5 last:border-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
            >
              <div className="space-y-1">
                <Label className="text-sm font-medium">{definition.label}</Label>
                {definition.description ? (
                  <p className="text-xs text-muted-foreground">{definition.description}</p>
                ) : null}
                <p className="font-mono text-[11px] text-muted-foreground/70">{definition.key}</p>
              </div>
              <div>
                <SettingInput
                  definition={definition}
                  value={current}
                  onChange={(next) => setDraft((prev) => ({ ...prev, [definition.key]: next }))}
                />
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3">
          <Button
            disabled={!dirty || saving}
            onClick={async () => {
              await save(draft);
              setDraft({});
            }}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save settings
          </Button>
          <Button variant="ghost" disabled={!dirty || saving} onClick={() => setDraft({})}>
            Discard
          </Button>
          {dirty ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
