"use client";

import { useDocsLiveData } from "@/hooks/useDocsLiveData";

interface Traction {
  stats?: Array<{ label: string; value: string; suffix?: string }>;
  milestones?: Array<{ date: string; title: string; description?: string }>;
}

export function TractionMetrics({ content }: { content: any }) {
  const live = useDocsLiveData();
  const data = content as Traction;

  function resolveValue(val: string): string {
    switch (val) {
      case "live":
        return String(live.totalTopics);
      default:
        return val;
    }
  }

  return (
    <div className="space-y-10">
      {data.stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {data.stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <div className="text-2xl font-bold text-foreground">
                {resolveValue(stat.value)}
                {stat.suffix || ""}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.milestones && (
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Milestones
          </h4>
          <div className="space-y-4">
            {data.milestones.map((ms, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-24 shrink-0 pt-0.5 text-sm font-medium text-muted-foreground">
                  {ms.date}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {ms.title}
                  </div>
                  {ms.description && (
                    <div className="text-sm text-muted-foreground">
                      {ms.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
