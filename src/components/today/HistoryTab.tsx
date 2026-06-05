import { History } from "lucide-react";

export function HistoryTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <History className="size-12 text-muted-foreground/40" />
      <div>
        <h2 className="text-lg font-semibold text-foreground">History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your study history will appear here.
        </p>
      </div>
    </div>
  );
}
