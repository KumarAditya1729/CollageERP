import { Link, createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/forbidden")({
  head: () => ({
    meta: [
      { title: "Access denied — CampusOS" },
      { name: "description", content: "You do not have permission to open this area of CampusOS." },
      { property: "og:title", content: "Access denied — CampusOS" },
      {
        property: "og:description",
        content: "Ask an administrator for access to this CampusOS area.",
      },
    ],
  }),
  component: () => (
    <StatusPage
      code="403"
      icon={ShieldAlert}
      title="You don't have access to this page"
      description="Your role doesn't include the permission needed here. Ask a college administrator to grant it."
      primary={
        <Button asChild>
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  ),
});
