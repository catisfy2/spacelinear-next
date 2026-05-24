"use client";

import { FileText, StickyNote, Bot } from "lucide-react";

interface MentionItem {
  type: "material" | "note" | "agent";
  label: string;
  action: string;
}

interface MentionMenuProps {
  items: MentionItem[];
  query: string;
  onSelect: (action: string) => void;
}

export function MentionMenu({ items, query, onSelect }: MentionMenuProps) {
  const filtered = query
    ? items.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  if (filtered.length === 0 && !query) {
    return (
      <div className="w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
        <div className="border-b border-border px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Mentions
          </p>
        </div>
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
          No materials or notes yet. Start typing to search.
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
        <div className="border-b border-border px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Mentions
          </p>
        </div>
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
          No results for &ldquo;{query}&rdquo;
        </div>
      </div>
    );
  }

  // Group items by type
  const groups = new Map<string, MentionItem[]>();
  for (const item of filtered) {
    const key = item.type === "material"
      ? "Materials"
      : item.type === "note"
        ? "Notes"
        : "Agents";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return (
    <div className="w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Mentions</p>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {Array.from(groups.entries()).map(([groupName, groupItems]) => (
          <div key={groupName}>
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {groupName}
            </p>
            {groupItems.map((item, i) => {
              const Icon =
                item.type === "material"
                  ? FileText
                  : item.type === "note"
                    ? StickyNote
                    : Bot;
              return (
                <button
                  key={`${item.label}-${i}`}
                  type="button"
                  onClick={() => onSelect(item.action)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{item.label}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.type}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
