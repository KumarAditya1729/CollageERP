import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/common/resource-page";
import { useAccess } from "@/hooks/useAccess";

type MemberRow = {
  member_number?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
};

export const Route = createFileRoute("/_authenticated/library/members")({
  component: LibraryMembers,
});

function LibraryMembers() {
  const { can, tenant } = useAccess();

  if (!can("library.manage")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to manage members.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ResourcePage
        title="Library Members"
        description="Manage library membership and borrowing limits."
        table="lib_members"
        select="id, member_number, status, created_at"
        entityLabel="member"
        storageKey="library_members"
        managePermission="library.manage"
        columns={[
          {
            key: "member_number",
            header: "Member ID",
          },
          {
            key: "status",
            header: "Status",
            render: (row: MemberRow) => (
              <span
                className={`px-2 py-1 rounded-full text-xs ${row.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {String(row.status || "").toUpperCase()}
              </span>
            ),
          },
          {
            key: "created_at",
            header: "Joined Date",
            value: (row: MemberRow) =>
              row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
          },
        ]}
        fields={[
          {
            name: "member_number",
            label: "Member ID",
            type: "text",
            required: true,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ],
            required: true,
          },
        ]}
        toFormValues={(row: MemberRow) => ({
          member_number: row.member_number || "",
          status: row.status || "",
        })}
      />
    </div>
  );
}
