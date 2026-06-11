"use client";

interface FlowStep {
  stage: string;
  description: string;
}

interface DataFlowData {
  steps?: FlowStep[];
  description?: string;
}

const stageColors: Record<string, string> = {
  Input: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  Processing: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  "AI Enhancement": "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30",
  Output: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  "Feedback Loop": "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30",
};

export function DataFlowBlock({ data }: { data: DataFlowData }) {
  if (!data?.steps) return null;

  return (
    <div className="space-y-4">
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <div className="flex flex-wrap items-start gap-3">
        {data.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`rounded-lg border-2 px-4 py-3 ${
                stageColors[step.stage] || "border-border bg-card"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {step.stage}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {step.description}
              </div>
            </div>
            {i < data.steps.length - 1 && (
              <div className="hidden text-muted-foreground md:block">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
