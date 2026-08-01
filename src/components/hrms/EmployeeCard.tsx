import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, Mail, Phone } from "lucide-react";
import type { StaffRow } from "@/hooks/hrms/useEmployees";

interface EmployeeCardProps {
  employee: StaffRow;
  onClick?: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const initials = [employee.first_name[0], employee.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const statusColor: Record<string, "default" | "secondary" | "destructive"> = {
    active: "default",
    probation: "secondary",
    on_leave: "secondary",
    resigned: "destructive",
    terminated: "destructive",
  };

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={employee.photo_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-base truncate">
                {employee.first_name} {employee.last_name}
              </p>
              <Badge
                variant={statusColor[employee.employment_status] ?? "secondary"}
                className="shrink-0"
              >
                {employee.employment_status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {employee.employee_code}
            </p>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {employee.designation ?? "No designation"}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
              {employee.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {employee.email}
                </span>
              )}
              {employee.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {employee.phone}
                </span>
              )}
              {employee.date_of_joining && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(employee.date_of_joining).toLocaleDateString()}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {employee.employment_type.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
