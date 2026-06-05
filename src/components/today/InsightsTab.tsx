import { BarChart3 } from "lucide-react";

export function InsightsTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <BarChart3 className="size-12 text-muted-foreground/40" />
      <div>
        <h2 className="text-lg font-semibold text-foreground">Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your learning insights will appear here.
        </p>
      </div>
    </div>
  );
}
