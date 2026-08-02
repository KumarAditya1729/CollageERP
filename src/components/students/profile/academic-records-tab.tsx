import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InlineLoader } from "@/components/common/states";
import { humanise } from "@/lib/students";
import { formatDate } from "@/lib/export";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export function AcademicRecordsTab({
  row,
  departmentName,
  programName,
  semesterName,
  yearName,
  credits,
  cgpa,
  enrollments,
}: {
  row: any;
  departmentName: string | null;
  programName: string | null;
  semesterName: string | null;
  yearName: string | null;
  credits: number | string | null;
  cgpa: string | null;
  enrollments: any;
}) {
  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Academic profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Department" value={departmentName ?? "—"} />
          <Field label="Programme" value={programName ?? "—"} />
          <Field label="Semester" value={semesterName ?? "—"} />
          <Field label="Academic year" value={yearName ?? "—"} />
          <Field label="Admission number" value={row.admission_number} />
          <Field label="Registration number" value={row.registration_number ?? "—"} />
          <Field label="Roll number" value={row.roll_number ?? "—"} />
          <Field label="Admitted on" value={formatDate(row.admission_date)} />
          <Field label="Graduated on" value={formatDate(row.graduation_date)} />
          <Field label="Credits registered" value={credits || "—"} />
          <Field label="CGPA" value={cgpa ?? "Awaiting results"} />
          <Field
            label="Academic standing"
            value={
              row.status === "enrolled"
                ? cgpa && Number(cgpa) < 5
                  ? "Needs support"
                  : "Good standing"
                : humanise(row.status)
            }
          />
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Registered courses</CardTitle>
          <CardDescription>Live enrolments from the academic records.</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.isLoading ? <InlineLoader /> : null}
          {!enrollments.isLoading && !(enrollments.data ?? []).length ? (
            <p className="text-sm text-muted-foreground">No course registrations yet.</p>
          ) : null}
          <ul className="space-y-2">
            {(enrollments.data ?? []).map((item: any) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{item.courses?.code}</span> ·{" "}
                  {item.courses?.title}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {item.courses?.credits ? `${item.courses.credits} credits` : null}
                  <Badge variant="outline" className="capitalize">
                    {humanise(item.status)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
