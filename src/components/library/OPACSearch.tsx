import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface OPACSearchProps {
  onSearch: (filters: Record<string, string>) => void;
}

export function OPACSearch({ onSearch }: OPACSearchProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const handleSearch = () => {
    onSearch({
      query,
      type: type !== "all" ? type : "",
      category: category !== "all" ? category : "",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex w-full items-center gap-2 max-w-3xl mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search books, authors, ISBN..."
          className="pl-9 h-11 bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-11 px-3">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Search Filters</h4>
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="book">Physical Books</SelectItem>
                  <SelectItem value="ebook">E-Books</SelectItem>
                  <SelectItem value="journal">Journals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fiction">Fiction</SelectItem>
                  <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="textbook">Textbook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSearch}>
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button className="h-11 px-8" onClick={handleSearch}>
        Search
      </Button>
    </div>
  );
}
