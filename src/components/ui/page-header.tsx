import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Single action element */
  action?: ReactNode;
  /** Multiple action elements (alias for action) */
  actions?: ReactNode;
}

export function PageHeader({ title, description, action, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {(actions ?? action) && <div>{actions ?? action}</div>}
    </div>
  );
}
