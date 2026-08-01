import { Link, createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Session expired — CampusOS" },
      {
        name: "description",
        content: "Your CampusOS session has expired. Sign in again to continue working.",
      },
      { property: "og:title", content: "Session expired — CampusOS" },
      { property: "og:description", content: "Sign in again to continue using CampusOS." },
    ],
  }),
  component: () => (
    <StatusPage
      code="401"
      icon={Lock}
      title="Your session has expired"
      description="For your security CampusOS signed you out. Sign in again to pick up where you left off."
      primary={
        <Button asChild>
          <Link to="/auth">Sign in again</Link>
        </Button>
      }
    />
  ),
});
