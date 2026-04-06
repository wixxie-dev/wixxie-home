import { Search } from "lucide-react";
import type { SearchEngine } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function buildSearchUrl(engine: SearchEngine, query: string) {
  const q = encodeURIComponent(query);
  switch (engine) {
    case "google":
      return `https://www.google.com/search?q=${q}`;
    case "bing":
      return `https://www.bing.com/search?q=${q}`;
    case "startpage":
      return `https://www.startpage.com/search?q=${q}`;
    case "duckduckgo":
    default:
      return `https://duckduckgo.com/?q=${q}`;
  }
}

export function WebSearchBar({ searchEngine }: { searchEngine: SearchEngine }) {
  return (
    <Card className="rounded-2xl border-zinc-200/75 bg-white/90 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:shadow-[0_10px_30px_rgba(2,6,23,0.45)]">
      <CardContent className="p-2">
        <form
          className="flex w-full items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.elements.namedItem("web-search") as HTMLInputElement | null;
            const query = input?.value.trim();
            if (!query) {
              return;
            }
            window.open(buildSearchUrl(searchEngine, query), "_blank", "noopener,noreferrer");
          }}
        >
          <Search className="h-4 w-4 text-orange-500 dark:text-amber-300" />
          <Input
            name="web-search"
            placeholder="Search the web..."
            className="h-8 border-0 bg-transparent px-0 py-0 text-zinc-800 shadow-none focus-visible:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-400"
          />
          <span className="rounded-xl bg-orange-100 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-orange-700 dark:bg-amber-500/25 dark:text-amber-100">
            {searchEngine}
          </span>
        </form>
      </CardContent>
    </Card>
  );
}
