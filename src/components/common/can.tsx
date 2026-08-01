import { ReactNode } from "react";
import { useAccess } from "@/hooks/useAccess";

interface CanProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renders children only if the current user has the given permission.
 * Optionally renders a fallback node if permission is denied.
 */
export function Can({ permission, fallback = null, children }: CanProps) {
  const { can } = useAccess();
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
