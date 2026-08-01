import { BookOpen } from "lucide-react";
import { EntityComments } from "@/components/common/entity-comments";
import { EntityTimeline } from "@/components/common/entity-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DrawerItem = {
  id?: string;
  title?: string;
  item_type?: string;
  isbn?: string;
  description?: string;
  cover_image_url?: string;
  total_copies?: number;
  available_copies?: number;
  lib_authors?: { name?: string };
  lib_categories?: { name?: string };
  lib_publishers?: { name?: string };
  publication_year?: number;
  call_number?: string;
  digital_url?: string;
  [key: string]: unknown;
};

interface BookDetailsDrawerProps {
  item: DrawerItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve?: (item: DrawerItem) => void;
}

export function BookDetailsDrawer({ item, open, onOpenChange, onReserve }: BookDetailsDrawerProps) {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b pb-4 shrink-0">
          <SheetTitle className="flex items-start gap-4 text-left">
            <div className="h-20 w-16 bg-muted rounded overflow-hidden shrink-0 flex items-center justify-center">
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold leading-tight">{item.title}</h2>
              <p className="text-muted-foreground">{item.lib_authors?.name || "Unknown Author"}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={item.item_type === "ebook" ? "secondary" : "default"}>
                  {item.item_type?.toUpperCase()}
                </Badge>
                {item.isbn && <Badge variant="outline">ISBN: {item.isbn}</Badge>}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b h-12 px-6 shrink-0 bg-transparent">
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-muted/50 rounded-b-none h-12 border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="copies"
              className="data-[state=active]:bg-muted/50 rounded-b-none h-12 border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Availability
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-muted/50 rounded-b-none h-12 border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="details" className="m-0 space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.description || "No description available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Publisher</div>
                  <div className="font-medium">{item.lib_publishers?.name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Category</div>
                  <div className="font-medium">{item.lib_categories?.name || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Publication Year</div>
                  <div className="font-medium">{item.publication_year || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Call Number</div>
                  <div className="font-medium">{item.call_number || "N/A"}</div>
                </div>
              </div>

              {item.item_type === "ebook" && item.digital_url && (
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => window.open(item.digital_url, "_blank")}
                  >
                    Read Online
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="copies" className="m-0 space-y-4">
              {item.item_type === "ebook" ? (
                <div className="text-center p-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>This is a digital asset. No physical copies to track.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border p-4 rounded-lg bg-muted/20">
                    <div>
                      <div className="text-sm font-medium">Total Copies</div>
                      <div className="text-2xl font-bold">{item.total_copies || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Available</div>
                      <div className="text-2xl font-bold text-green-600">
                        {item.available_copies || 0}
                      </div>
                    </div>
                  </div>

                  {(item.available_copies || 0) > 0 ? (
                    <Button className="w-full" onClick={() => onReserve?.(item)}>
                      Reserve a Copy
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      Currently Unavailable
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="m-0 space-y-8">
              <EntityComments entityId={item.id || ""} entityType="lib_items" />
              <EntityTimeline entityId={item.id || ""} entityType="lib_items" />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
