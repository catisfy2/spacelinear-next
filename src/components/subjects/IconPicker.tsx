"use client";

import { useState, useMemo } from "react";
import { SUBJECT_ICONS } from "@/lib/subject-icons";
import { SubjectIcon } from "./SubjectIcon";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const ICONS_PER_PAGE = 40;

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return SUBJECT_ICONS;
    const q = search.toLowerCase();
    return SUBJECT_ICONS.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.keywords.some((k) => k.includes(q)),
    );
  }, [search]);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ICONS_PER_PAGE));
  const paged = filtered.slice(0, page * ICONS_PER_PAGE);

  const handleShowMore = () => setPage((p) => p + 1);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search icons..."
          className="w-full h-8 rounded-md border border-border bg-secondary pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Grid */}
      <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto">
        {paged.map((entry) => {
          const isSelected = value === entry.name;
          return (
            <button
              key={entry.name}
              type="button"
              onClick={() => onChange(entry.name)}
              title={entry.name}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors shrink-0",
                isSelected
                  ? "bg-accent ring-1 ring-ring"
                  : "hover:bg-accent/50",
              )}
            >
              <SubjectIcon name={entry.name} size={16} />
            </button>
          );
        })}
      </div>

      {/* Show more */}
      {page < totalPages && (
        <button
          type="button"
          onClick={handleShowMore}
          className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 rounded-md hover:bg-accent/50"
        >
          Show {Math.min(ICONS_PER_PAGE, filtered.length - paged.length)} more
          icons
        </button>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No icons found
        </p>
      )}
    </div>
  );
}
