import { createFileRoute, Outlet, redirect, useRouter, Navigate } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";

import { useAccess } from "@/hooks/useAccess";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { snapshot, loading } = useAccess();
  const router = useRouter();

  if (loading) return null;

  const isNoTenant = snapshot?.tenants.length === 0 && !snapshot?.is_platform_admin;
  const isOnboarding = router.state.location.pathname === "/onboarding";

  if (isNoTenant && !isOnboarding) {
    return <Navigate to="/onboarding" />;
  }

  if (!isNoTenant && isOnboarding) {
    return <Navigate to="/dashboard" />;
  }

  // If on onboarding, render without AppShell
  if (isOnboarding) {
    return <Outlet />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
