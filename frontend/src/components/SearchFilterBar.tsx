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
    <Card className="rounded-2xl border-zinc-200/70 bg-white/75 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-[0_12px_28px_rgba(2,6,23,0.4)]">
      <CardContent className="space-y-3 p-4">
        <Input
          placeholder="Filter services by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-xl border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTag === null ? "default" : "outline"}
            onClick={() => onTagChange(null)}
            className={
              activeTag === null
                ? "rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400"
                : "rounded-full border-zinc-300/70 bg-white/80 dark:border-slate-700 dark:bg-slate-800/75 dark:text-zinc-100"
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
                  ? "rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400"
                  : "rounded-full border-zinc-300/70 bg-white/80 dark:border-slate-700 dark:bg-slate-800/75 dark:text-zinc-100"
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
