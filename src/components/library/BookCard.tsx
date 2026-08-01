import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  item: {
    id?: string;
    title?: string;
    item_type?: string;
    cover_image_url?: string;
    lib_authors?: { name?: string };
    lib_categories?: { name?: string };
    lib_publishers?: { name?: string };
    [key: string]: unknown;
  };
  onViewDetails: (item: BookCardProps["item"]) => void;
}

export function BookCard({ item, onViewDetails }: BookCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-0 bg-muted/20 relative aspect-[2/1] md:aspect-[3/4] flex items-center justify-center">
        {item.cover_image_url ? (
          <img src={item.cover_image_url} alt={item.title} className="object-cover w-full h-full" />
        ) : (
          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
        )}
        <Badge
          className="absolute top-2 right-2 shadow-sm"
          variant={item.item_type === "ebook" ? "secondary" : "default"}
        >
          {String(item.item_type || "").toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold line-clamp-2 leading-tight" title={item.title}>
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {item.lib_authors?.name || "Unknown Author"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="text-[10px] font-normal">
            {item.lib_categories?.name || "Uncategorized"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t flex items-center justify-between mt-auto">
        <span className="text-xs font-medium text-muted-foreground">
          {item.lib_publishers?.name}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onViewDetails(item)}>
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
