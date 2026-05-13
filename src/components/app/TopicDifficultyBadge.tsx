import { DIFFICULTY_CONFIG } from '@/lib/constants';
import type { Difficulty } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const variantClass: Record<Difficulty, string> = {
  relearn: 'border-sl-relearn/40 text-sl-relearn bg-sl-relearn/10',
  hard: 'border-sl-hard/40 text-sl-hard bg-sl-hard/10',
  medium: 'border-sl-medium/40 text-sl-medium bg-sl-medium/10',
  easy: 'border-sl-easy/40 text-sl-easy bg-sl-easy/10',
};

export function TopicDifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  const c = DIFFICULTY_CONFIG[difficulty];
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded px-1.5 py-0 text-[11px] font-medium',
        variantClass[difficulty],
        className,
      )}
    >
      {c.label}
    </Badge>
  );
}
