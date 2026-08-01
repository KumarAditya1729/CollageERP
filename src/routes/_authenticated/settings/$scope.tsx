import { createFileRoute, notFound } from "@tanstack/react-router";

import { SettingsScopeForm } from "@/components/settings/settings-scope-form";
import { StatusPage } from "@/components/common/status-page";
import type { SettingScope } from "@/hooks/useSettings";

const SCOPES: SettingScope[] = [
  "general",
  "academic",
  "finance",
  "notification",
  "branding",
  "security",
  "integration",
];

export const Route = createFileRoute("/_authenticated/settings/$scope")({
  head: ({ params }) => {
    const label = params.scope.charAt(0).toUpperCase() + params.scope.slice(1);
    return {
      meta: [
        { title: `${label} settings — CampusOS` },
        {
          name: "description",
          content: `Configure ${params.scope} settings for your college in CampusOS.`,
        },
        { property: "og:title", content: `${label} settings — CampusOS` },
        {
          property: "og:description",
          content: `Configure ${params.scope} settings for your college.`,
        },
      ],
    };
  },
  beforeLoad: ({ params }) => {
    if (!SCOPES.includes(params.scope as SettingScope)) throw notFound();
  },
  component: SettingsScopePage,
  errorComponent: ({ error }) => (
    <StatusPage code="500" title="Settings unavailable" description={error.message} />
  ),
  notFoundComponent: () => (
    <StatusPage
      code="404"
      title="Unknown settings area"
      description="This settings section does not exist."
    />
  ),
});

function SettingsScopePage() {
  const { scope } = Route.useParams();
  return <SettingsScopeForm scope={scope as SettingScope} />;
}
