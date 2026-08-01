import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CampusOS" },
      {
        name: "description",
        content:
          "Configure branding, academics, finance, notifications, integrations and security for your college.",
      },
      { property: "og:title", content: "Settings — CampusOS" },
      { property: "og:description", content: "College-wide configuration for CampusOS." },
    ],
  }),
  component: SettingsLayout,
});

export const settingsSections: { label: string; items: { title: string; to: string }[] }[] = [
  {
    label: "College",
    items: [
      { title: "General", to: "/settings/general" },
      { title: "Branding", to: "/settings/branding" },
      { title: "Academic", to: "/settings/academic" },
      { title: "Finance", to: "/settings/finance" },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Notifications", to: "/settings/notification" },
      { title: "Email templates", to: "/settings/templates/email" },
      { title: "SMS templates", to: "/settings/templates/sms" },
      { title: "WhatsApp templates", to: "/settings/templates/whatsapp" },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Feature flags", to: "/settings/features" },
      { title: "Integrations", to: "/settings/integration" },
      { title: "API & webhooks", to: "/settings/api" },
      { title: "Storage", to: "/settings/storage" },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Security", to: "/settings/security" },
      { title: "Roles", to: "/roles" },
      { title: "Audit log", to: "/activity" },
    ],
  },
];

function SettingsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Everything that shapes how CampusOS behaves for your college."
        crumbs={[{ label: "Administration" }, { label: "Settings" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="space-y-5" aria-label="Settings sections">
          {settingsSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.label}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    pathname === item.to && "bg-muted font-medium text-foreground",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
