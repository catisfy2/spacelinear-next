"use client";

import { Badge } from "@/components/ui/badge";
import type { ChangelogEntry } from "@/lib/docs-utils";

interface ChangelogSectionProps {
  entries: ChangelogEntry[];
}

export function ChangelogSection({ entries }: ChangelogSectionProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-8">
      {entries.map((entry) => {
        const changes = entry.changes as string[];
        return (
          <div key={entry.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:h-full before:w-0.5 before:bg-border last:before:hidden">
            <div className="mb-2 flex items-center gap-3">
              <Badge variant="secondary" className="font-mono text-xs">
                {entry.version}
              </Badge>
              <time className="text-xs text-muted-foreground">{entry.date}</time>
            </div>
            {Array.isArray(changes) && (
              <ul className="space-y-1">
                {changes.map((change, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    {change}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
