import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface AccessTenant {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  logo_url: string | null;
  status: string;
}

export interface AccessRole {
  tenant_id: string | null;
  key: string;
  name: string;
  level: number;
  default_route: string | null;
}

export interface AccessSnapshot {
  user_id: string | null;
  is_platform_admin: boolean;
  tenants: AccessTenant[];
  roles: AccessRole[];
  permissions: Record<string, string[]>;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  is_primary: boolean;
}

interface AccessContextValue {
  loading: boolean;
  error: Error | null;
  snapshot: AccessSnapshot | null;
  tenant: AccessTenant | null;
  tenants: AccessTenant[];
  setTenantId: (id: string) => void;
  campus: Campus | null;
  campuses: Campus[];
  setCampusId: (id: string | null) => void;
  roles: AccessRole[];
  activeRole: AccessRole | null;
  setActiveRoleKey: (key: string) => void;
  isPlatformAdmin: boolean;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  refetch: () => void;
}

const TENANT_KEY = "campusos.tenant";
const CAMPUS_KEY = "campusos.campus";
const ROLE_KEY = "campusos.role";

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [campusId, setCampusIdState] = useState<string | null>(null);
  const [activeRoleKey, setActiveRoleKeyState] = useState<string | null>(null);

  useEffect(() => {
    setTenantIdState(window.localStorage.getItem(TENANT_KEY));
    setCampusIdState(window.localStorage.getItem(CAMPUS_KEY));
    setActiveRoleKeyState(window.localStorage.getItem(ROLE_KEY));
  }, []);

  const accessQuery = useQuery({
    queryKey: ["access", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_access" as never);
      if (error) throw error;
      return data as unknown as AccessSnapshot;
    },
  });

  const snapshot = accessQuery.data ?? null;
  const tenants = snapshot?.tenants ?? [];
  const tenant = useMemo(
    () => tenants.find((t) => t.id === tenantId) ?? tenants[0] ?? null,
    [tenants, tenantId],
  );

  const campusesQuery = useQuery({
    queryKey: ["campuses", tenant?.id],
    enabled: Boolean(tenant?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campuses")
        .select("id, name, code, is_primary")
        .eq("tenant_id", tenant!.id)
        .is("deleted_at", null)
        .order("is_primary", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as Campus[];
    },
  });

  const campuses = campusesQuery.data ?? [];
  const campus = campuses.find((c) => c.id === campusId) ?? null;

  const roles = useMemo(
    () => (snapshot?.roles ?? []).filter((r) => !r.tenant_id || r.tenant_id === tenant?.id),
    [snapshot, tenant?.id],
  );
  const activeRole = roles.find((r) => r.key === activeRoleKey) ?? roles[0] ?? null;

  const permissionSet = useMemo(() => {
    const set = new Set<string>();
    const map = snapshot?.permissions ?? {};
    for (const key of ["global", tenant?.id ?? ""]) {
      for (const perm of map[key] ?? []) set.add(perm);
    }
    return set;
  }, [snapshot, tenant?.id]);

  const can = useCallback(
    (permission: string) => Boolean(snapshot?.is_platform_admin) || permissionSet.has(permission),
    [permissionSet, snapshot],
  );

  const value: AccessContextValue = {
    loading: accessQuery.isLoading,
    error: (accessQuery.error as Error) ?? null,
    snapshot,
    tenant,
    tenants,
    setTenantId: (id) => {
      window.localStorage.setItem(TENANT_KEY, id);
      window.localStorage.removeItem(CAMPUS_KEY);
      setTenantIdState(id);
      setCampusIdState(null);
    },
    campus,
    campuses,
    setCampusId: (id) => {
      if (id) window.localStorage.setItem(CAMPUS_KEY, id);
      else window.localStorage.removeItem(CAMPUS_KEY);
      setCampusIdState(id);
    },
    roles,
    activeRole,
    setActiveRoleKey: (key) => {
      window.localStorage.setItem(ROLE_KEY, key);
      setActiveRoleKeyState(key);
    },
    isPlatformAdmin: Boolean(snapshot?.is_platform_admin),
    can,
    canAny: (permissions) => permissions.some(can),
    refetch: () => void accessQuery.refetch(),
  };

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used inside AccessProvider");
  return ctx;
}

/**
 * Renders children only when the signed-in user holds the permission.
 * This is a UX affordance only — every table is protected by row level
 * security and permission checks in the database.
 */
export function Can({
  permission,
  any,
  children,
  fallback = null,
}: {
  permission?: string;
  any?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can, canAny } = useAccess();
  const allowed = permission ? can(permission) : any ? canAny(any) : true;
  return <>{allowed ? children : fallback}</>;
}
