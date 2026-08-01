import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { ResourcePage } from "@/components/common/resource-page";
import { useAccess } from "@/hooks/useAccess";

export const Route = createFileRoute("/_authenticated/library/settings")({
  component: LibrarySettings,
});

function LibrarySettings() {
  const { can, tenant } = useAccess();

  if (!can("library.manage")) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          You do not have permission to manage library settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)]">
      <PageHeader
        title="Library Settings"
        description="Manage categories, publishers, authors, and circulation rules."
      />

      <Tabs defaultValue="categories" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="publishers">Publishers</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto mt-4 pb-4">
          <TabsContent value="categories" className="m-0 h-full">
            <ResourcePage
              title="Categories"
              description="Manage library book categories"
              table="lib_categories"
              select="id, name"
              entityLabel="category"
              managePermission="library.manage"
              storageKey="library_categories"
              columns={[{ key: "name", header: "Name" }]}
              fields={[{ name: "name", label: "Category Name", type: "text", required: true }]}
              toFormValues={(row: { name?: string }) => ({ name: row.name || "" })}
            />
          </TabsContent>

          <TabsContent value="publishers" className="m-0 h-full">
            <ResourcePage
              title="Publishers"
              description="Manage book publishers"
              table="lib_publishers"
              select="id, name"
              entityLabel="publisher"
              managePermission="library.manage"
              storageKey="library_publishers"
              columns={[{ key: "name", header: "Name" }]}
              fields={[{ name: "name", label: "Publisher Name", type: "text", required: true }]}
              toFormValues={(row: { name?: string }) => ({ name: row.name || "" })}
            />
          </TabsContent>

          <TabsContent value="authors" className="m-0 h-full">
            <ResourcePage
              title="Authors"
              description="Manage book authors"
              table="lib_authors"
              select="id, name"
              entityLabel="author"
              managePermission="library.manage"
              storageKey="library_authors"
              columns={[{ key: "name", header: "Name" }]}
              fields={[{ name: "name", label: "Author Name", type: "text", required: true }]}
              toFormValues={(row: { name?: string }) => ({ name: row.name || "" })}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
