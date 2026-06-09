"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function TopicPicker({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const { topics, subjects } = useStore();
  const [search, setSearch] = useState("");

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const grouped = useMemo(() => {
    const filtered = topics.filter(
      (t) =>
        t.state !== "archived" &&
        (search
          ? t.title.toLowerCase().includes(search.toLowerCase())
          : true),
    );

    const groups = new Map<string, typeof filtered>();
    for (const topic of filtered) {
      const subjectName = subjectMap.get(topic.subjectId) ?? "General";
      const existing = groups.get(subjectName) ?? [];
      existing.push(topic);
      groups.set(subjectName, existing);
    }
    return groups;
  }, [topics, subjectMap, search]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
        {Array.from(grouped.entries()).map(([subjectName, topicList]) => (
          <div key={subjectName}>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {subjectName}
            </p>
            {topicList.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onToggle(topic.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  selectedIds.includes(topic.id)
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-accent text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded border transition-colors",
                    selectedIds.includes(topic.id)
                      ? "border-primary bg-primary text-white"
                      : "border-border",
                  )}
                >
                  {selectedIds.includes(topic.id) && (
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="flex-1 truncate">{topic.title}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
