import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * Shared full-page status screen used for 401, 403, 404, 500 and maintenance.
 */
export function StatusPage({
  code,
  title,
  description,
  icon: Icon,
  primary,
  secondary,
}: {
  code?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md text-center">
        {Icon ? (
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-muted/40">
            <Icon className="size-5 text-muted-foreground" aria-hidden />
          </div>
        ) : null}
        {code ? (
          <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {code}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {primary ?? (
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          )}
          {secondary}
        </div>
      </div>
    </main>
  );
}
