import { Monitor, Moon, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { useTheme } from "../lib/theme";
import type { ThemeOption } from "../types";
import { Button } from "@/components/ui/button";

const themeItems: Array<{
  id: ThemeOption;
  label: string;
  icon: typeof Sun;
}> = [
  { id: "system", label: "System", icon: Monitor },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
];

export function ThemeToggle({ onThemeChange }: { onThemeChange?: (theme: ThemeOption) => void }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const activeItem = useMemo(
    () => themeItems.find((item) => item.id === theme) ?? themeItems[0],
    [theme],
  );
  const ActiveIcon = activeItem.icon;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        title={`Theme: ${activeItem.label}`}
        aria-label={`Theme: ${activeItem.label}. Click to change.`}
        className="rounded-xl border-zinc-200/70 bg-white/85 shadow-sm transition hover:border-orange-300 hover:text-orange-700 dark:border-slate-700 dark:bg-slate-800/85 dark:hover:border-amber-300/70 dark:hover:bg-slate-800 dark:hover:text-amber-100"
      >
        <ActiveIcon className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-40 rounded-2xl border border-zinc-200/80 bg-white/95 p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
          {themeItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === theme;
            return (
              <Button
                type="button"
                key={item.id}
                variant="ghost"
                className={`w-full justify-start rounded-xl px-3 py-2 text-sm ${
                  isActive
                    ? "bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-amber-500/20 dark:text-amber-100 dark:hover:bg-amber-500/20"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                onClick={() => {
                  setTheme(item.id);
                  onThemeChange?.(item.id);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
