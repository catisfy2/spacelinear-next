"use client";

interface RoadmapItem {
  title: string;
  description?: string;
}

interface RoadmapData {
  short_term?: RoadmapItem[] | string[];
  mid_term?: RoadmapItem[] | string[];
  long_term?: RoadmapItem[] | string[];
}

const phases = [
  { key: "short_term" as const, label: "Short Term", color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" },
  { key: "mid_term" as const, label: "Mid Term", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { key: "long_term" as const, label: "Long Term", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
];

export function RoadmapBlock({ data }: { data: RoadmapData }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const items = data[phase.key];
        if (!items || items.length === 0) return null;

        return (
          <div key={phase.key}>
            <div className={`mb-3 inline-block rounded-full border px-3 py-1 text-xs font-medium ${phase.color}`}>
              {phase.label}
            </div>
            <ul className="space-y-2">
              {items.map((item, i) => {
                const title = typeof item === "string" ? item : item.title;
                const description = typeof item === "string" ? undefined : item.description;
                return (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-border" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {title}
                      </div>
                      {description && (
                        <div className="text-sm text-muted-foreground">
                          {description}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
