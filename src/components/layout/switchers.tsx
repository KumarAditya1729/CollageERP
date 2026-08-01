import { useQuery } from "@tanstack/react-query";
import {
  Building,
  Building2,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronsUpDown,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccess } from "@/hooks/useAccess";
import { PREF_KEYS } from "@/hooks/useLocalList";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function SwitcherButton({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <Button
      variant="ghost"
      className="h-9 max-w-[190px] justify-start gap-2 px-2"
      aria-label={label}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-sm font-medium">{value}</span>
      <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
    </Button>
  );
}

export function OrganizationSwitcher() {
  const { tenant, tenants, setTenantId } = useAccess();
  if (!tenant) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <SwitcherButton icon={Building2} label="Switch college" value={tenant.name} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Colleges</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => setTenantId(option.id)}>
            <Building2 className="size-4" />
            <span className="truncate">{option.name}</span>
            {option.id === tenant.id ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CampusSwitcher() {
  const { campus, campuses, setCampusId } = useAccess();
  if (campuses.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <SwitcherButton
            icon={Building}
            label="Switch campus"
            value={campus?.name ?? "All campuses"}
          />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Campus</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCampusId(null)}>
          <Building className="size-4" />
          All campuses
          {!campus ? <Check className="ml-auto size-4" /> : null}
        </DropdownMenuItem>
        {campuses.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => setCampusId(option.id)}>
            <Building className="size-4" />
            <span className="truncate">{option.name}</span>
            {campus?.id === option.id ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoleSwitcher({ className }: { className?: string }) {
  const { roles, activeRole, setActiveRoleKey } = useAccess();
  if (roles.length < 2 || !activeRole) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <ShieldCheck className="size-4 text-muted-foreground" />
          <span className="max-w-[130px] truncate">{activeRole.name}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Acting as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => (
          <DropdownMenuItem key={role.key} onClick={() => setActiveRoleKey(role.key)}>
            <ShieldCheck className="size-4" />
            <span className="truncate">{role.name}</span>
            {role.key === activeRole.key ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AcademicPeriodSwitcher({
  label,
  storageKey,
  options,
  icon: Icon,
}: {
  label: string;
  storageKey: string;
  options: { id: string; name: string; is_current: boolean | null }[];
  icon: typeof Building2;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  if (options.length === 0) return null;
  const selected =
    options.find((option) => option.id === selectedId) ??
    options.find((o) => o.is_current) ??
    options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <SwitcherButton icon={Icon} label={label} value={selected.name} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => {
              window.localStorage.setItem(storageKey, option.id);
              setSelectedId(option.id);
            }}
          >
            <Icon className="size-4" />
            <span className="truncate">{option.name}</span>
            {option.id === selected.id ? <Check className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AcademicYearSwitcher() {
  const { tenant } = useAccess();
  const { data } = useQuery({
    queryKey: ["academic-years", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id, name, is_current")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AcademicPeriodSwitcher
      label="Academic year"
      storageKey={PREF_KEYS.academicYear}
      options={data ?? []}
      icon={CalendarRange}
    />
  );
}

export function AcademicSessionSwitcher() {
  const { tenant } = useAccess();
  const { data } = useQuery({
    queryKey: ["academic-sessions", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_sessions")
        .select("id, name, is_current")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("term_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AcademicPeriodSwitcher
      label="Session"
      storageKey={PREF_KEYS.academicSession}
      options={data ?? []}
      icon={CalendarDays}
    />
  );
}
