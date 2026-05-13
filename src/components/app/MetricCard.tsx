import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-2xs',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
