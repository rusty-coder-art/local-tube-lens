import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

interface CommentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  minLikes: string;
  onMinLikesChange: (likes: string) => void;
}

export const CommentFilters = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  minLikes,
  onMinLikesChange,
}: CommentFiltersProps) => {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-accent" />
        <h3 className="font-semibold">Filter Comments</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search in comments..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort" className="text-sm">Sort By</Label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger id="sort" className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="likes">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minLikes" className="text-sm">Minimum Likes</Label>
          <Input
            id="minLikes"
            type="number"
            min="0"
            placeholder="0"
            value={minLikes}
            onChange={(e) => onMinLikesChange(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
      </div>
    </Card>
  );
};
