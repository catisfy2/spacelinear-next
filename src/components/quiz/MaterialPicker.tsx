"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Search, FileText, Link as LinkIcon, Type } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  file: <FileText className="size-4" />,
  link: <LinkIcon className="size-4" />,
  text: <Type className="size-4" />,
};

export function MaterialPicker({
  selectedIds,
  onToggle,
  supplementWithWeb,
  onSupplementToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
  supplementWithWeb: boolean;
  onSupplementToggle: () => void;
}) {
  const { materials } = useStore();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return materials.filter(
      (m) =>
        m.type !== "folder" &&
        !m.deletedAt &&
        (search
          ? m.name.toLowerCase().includes(search.toLowerCase())
          : true),
    );
  }, [materials, search]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No materials yet. Upload study materials first or try another mode.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search materials..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {filtered.map((material) => (
          <button
            key={material.id}
            type="button"
            onClick={() => onToggle(material.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selectedIds.includes(material.id)
                ? "bg-primary/10 text-foreground"
                : "hover:bg-accent text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded border transition-colors",
                selectedIds.includes(material.id)
                  ? "border-primary bg-primary text-white"
                  : "border-border",
              )}
            >
              {selectedIds.includes(material.id) && (
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {typeIcons[material.type] ?? <FileText className="size-4" />}
            <span className="flex-1 truncate">{material.name}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={supplementWithWeb}
          onChange={onSupplementToggle}
          className="rounded border-border"
        />
        Also search the web for related content
      </label>
    </div>
  );
}
