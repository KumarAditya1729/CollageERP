import { Link, createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Scheduled maintenance — CampusOS" },
      {
        name: "description",
        content: "CampusOS is briefly unavailable while scheduled maintenance completes.",
      },
      { property: "og:title", content: "Scheduled maintenance — CampusOS" },
      { property: "og:description", content: "CampusOS will be back shortly after maintenance." },
    ],
  }),
  component: () => (
    <StatusPage
      icon={Wrench}
      title="CampusOS is under maintenance"
      description="We're applying an update to your college workspace. This usually takes a few minutes."
      primary={
        <Button asChild>
          <Link to="/dashboard" reloadDocument>
            Try again
          </Link>
        </Button>
      }
    />
  ),
});
