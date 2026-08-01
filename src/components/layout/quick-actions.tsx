import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";

const actions = [
  { label: "Add student", to: "/students", permission: "student.manage" },
  { label: "Add faculty member", to: "/faculty", permission: "faculty.manage" },
  { label: "Add staff member", to: "/staff", permission: "staff.manage" },
  { label: "Create department", to: "/departments", permission: "department.manage" },
  { label: "Create program", to: "/programs", permission: "program.manage" },
  { label: "Create course", to: "/courses", permission: "course.manage" },
  { label: "Upload document", to: "/documents", permission: "document.manage" },
  { label: "Upload media", to: "/media", permission: "media.manage" },
  { label: "Invite user", to: "/users", permission: "user.invite" },
] as const;

export function QuickActions() {
  const { can } = useAccess();
  const available = actions.filter((action) => can(action.permission));
  if (available.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.map((action) => (
          <DropdownMenuItem key={action.label} asChild>
            <Link to={action.to}>{action.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
