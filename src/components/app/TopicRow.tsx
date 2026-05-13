import Link from 'next/link';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNextReview } from '@/lib/constants';
import type { Subject, Topic } from '@/lib/types';
import { TopicActionsMenu } from '@/components/topics/TopicActionsMenu';
import { TopicStateBadge } from '@/components/app/TopicStateBadge';
import { TopicDifficultyBadge } from '@/components/app/TopicDifficultyBadge';

export function TopicRow({
  topic,
  subject,
  className,
}: {
  topic: Topic;
  subject?: Subject;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent/40',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Link
          href={`/topics/${topic.id}`}
          className="block truncate text-left text-base font-medium text-foreground hover:text-primary"
        >
          {topic.title}
        </Link>
        {subject ? (
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden>{subject.icon}</span>
            <span className="truncate">{subject.name}</span>
          </div>
        ) : null}
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <TopicStateBadge state={topic.state} />
        {topic.currentDifficulty ? (
          <TopicDifficultyBadge difficulty={topic.currentDifficulty} />
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right sm:flex-row sm:items-center sm:gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {formatNextReview(topic.nextReviewDate)}
        </span>
        {topic.streak > 0 ? (
          <span className="flex items-center gap-0.5 text-xs tabular-nums text-sl-hard">
            <Flame className="h-3 w-3" />
            {topic.streak}
          </span>
        ) : (
          <span className="w-8 sm:inline-block" aria-hidden />
        )}
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <TopicActionsMenu topicId={topic.id} />
        </div>
      </div>
    </div>
  );
}
