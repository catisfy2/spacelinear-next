import { STATE_CONFIG } from '@/lib/constants';
import type { TopicState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const variantClass: Record<TopicState, string> = {
  relearning: 'border-sl-relearn/40 text-sl-relearn bg-sl-relearn/10',
  learning: 'border-sl-hard/40 text-sl-hard bg-sl-hard/10',
  new: 'border-muted-foreground/30 text-muted-foreground bg-muted/80',
  reviewing: 'border-sl-easy/40 text-sl-easy bg-sl-easy/10',
};

export function TopicStateBadge({
  state,
  className,
}: {
  state: TopicState;
  className?: string;
}) {
  const c = STATE_CONFIG[state];
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded px-1.5 py-0 text-[11px] font-medium capitalize',
        variantClass[state],
        className,
      )}
    >
      <span className="mr-0.5 opacity-70">{c.icon}</span>
      {c.label}
    </Badge>
  );
}
