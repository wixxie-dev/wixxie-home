import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  allTags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  search: string;
  onSearchChange: (search: string) => void;
};

export function SearchFilterBar({ allTags, activeTag, onTagChange, search, onSearchChange }: Props) {
  return (
    <Card className="rounded-2xl border-zinc-200/70 bg-white/75 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <CardContent className="space-y-3 p-4">
        <Input
          placeholder="Filter services by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl border-zinc-200 bg-white dark:border-white/15 dark:bg-slate-950/70"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTag === null ? "default" : "outline"}
            onClick={() => onTagChange(null)}
            className={
              activeTag === null
                ? "rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
                : "rounded-full border-zinc-300/70 bg-white/80 dark:border-white/15 dark:bg-slate-900/60"
            }
          >
            All
          </Button>
          {allTags.map((tag) => (
            <Button
              type="button"
              key={tag}
              size="sm"
              variant={activeTag === tag ? "default" : "outline"}
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
              className={
                activeTag === tag
                  ? "rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
                  : "rounded-full border-zinc-300/70 bg-white/80 dark:border-white/15 dark:bg-slate-900/60"
              }
            >
              {tag}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
