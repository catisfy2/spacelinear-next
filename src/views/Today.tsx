"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import type {
  Difficulty,
  Topic,
  Subject,
  ReviewHistoryEntry,
} from "@/lib/types";
import { format } from "date-fns";
import { Flame, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTopicModal } from "@/components/topics/CreateTopicModal";
import { PageShell } from "@/components/app/PageShell";
import { EmptyState } from "@/components/app/EmptyState";
import { TopicDifficultyBadge } from "@/components/app/TopicDifficultyBadge";
import { TopicStateBadge } from "@/components/app/TopicStateBadge";
import { ReviewDialog } from "@/components/today";
import { getCalendarReviewStreak } from "@/lib/stats";
import { cn } from "@/lib/utils";

// ─── helpers ───────────────────────────────────────────────────────────

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.getTime() >= today.getTime()) return "Today";
  if (d.getTime() >= yesterday.getTime()) return "Yesterday";
  return format(d, "d MMM");
}

/** Color for the bullet dot based on current difficulty or state */
function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

// ─── merged review entry with topic info ────────────────────────────────

interface EnrichedReview {
  entry: ReviewHistoryEntry;
  topic: Topic;
  subject?: Subject;
}

function enrichReviews(
  history: ReviewHistoryEntry[],
  topics: Topic[],
  subjects: Subject[],
): EnrichedReview[] {
  const result: EnrichedReview[] = [];
  for (const entry of history) {
    const topic = topics.find((t) => t.id === entry.topicId);
    if (!topic) continue;
    const subject = subjects.find((s) => s.id === topic.subjectId);
    result.push({ entry, topic, subject });
  }
  return result;
}

function groupByDate(
  enriched: EnrichedReview[],
): Map<string, EnrichedReview[]> {
  const groups = new Map<string, EnrichedReview[]>();
  for (const item of enriched) {
    const key = formatDateHeader(item.entry.reviewedAt);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return groups;
}

// ─── Today Page ─────────────────────────────────────────────────────────

export function TodayPage() {
  const { getDueTopics, submitReview, topics, subjects, reviewHistory } =
    useStore();
  const { user } = useAuth();

  const dueTopics = useMemo(() => getDueTopics(), [getDueTopics, topics]);
  const calendarStreak = useMemo(
    () => getCalendarReviewStreak(reviewHistory),
    [reviewHistory],
  );

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  // ── recently-reviewed tracking (for strike-through) ──
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // ── dialog state ──
  const [dialogTopic, setDialogTopic] = useState<Topic | null>(null);
  const [showCreateTopic, setShowCreateTopic] = useState(false);

  const dialogSubject = dialogTopic
    ? subjects.find((s) => s.id === dialogTopic.subjectId)
    : undefined;

  const openDialog = useCallback((topic: Topic) => {
    setDialogTopic(topic);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogTopic(null);
  }, []);

  const handleCommit = useCallback(
    (difficulty: Difficulty, commitMessage?: string) => {
      if (!dialogTopic || !user) return;
      submitReview(dialogTopic.id, difficulty, user.id, commitMessage);
      setReviewedIds((prev) => new Set(prev).add(dialogTopic.id));
      closeDialog();
    },
    [dialogTopic, user, submitReview, closeDialog],
  );

  // ── past commits ──
  const enrichedHistory = useMemo(
    () => enrichReviews(reviewHistory, topics, subjects),
    [reviewHistory, topics, subjects],
  );
  const historyGroups = useMemo(
    () => groupByDate(enrichedHistory),
    [enrichedHistory],
  );
  // Sort groups by date descending (most recent first)
  const sortedGroups = useMemo(
    () =>
      Array.from(historyGroups.entries()).sort(([a], [b]) => {
        // "Today" always first, then "Yesterday", then chronological reverse
        const order = ["Today", "Yesterday"];
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        // Compare dates by parsing
        const da = new Date(a);
        const db = new Date(b);
        return db.getTime() - da.getTime();
      }),
    [historyGroups],
  );

  // ── empty state ──
  const hasDue = dueTopics.length > 0;
  const hasHistory = enrichedHistory.length > 0;

  return (
    <PageShell maxWidth="narrow" className="pb-12">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greetingLabel()}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
            {displayName}
          </h1>
        </div>
        {calendarStreak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-sl-hard/10 px-3 py-1.5 text-sm font-medium text-sl-hard">
            <Flame className="h-4 w-4" />
            <span>{calendarStreak}d</span>
          </div>
        )}
      </div>

      {/* ── Today section ── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today</h2>
          <button
            type="button"
            onClick={() => setShowCreateTopic(true)}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add topic</span>
          </button>
        </div>

        {hasDue ? (
          <ul className="mt-3">
            {dueTopics.map((topic) => {
              const sub = subjects.find((s) => s.id === topic.subjectId);
              const isReviewed = reviewedIds.has(topic.id);
              return (
                <li
                  key={topic.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                    isReviewed ? "opacity-40" : "hover:bg-accent/40",
                  )}
                >
                  {/* colored bullet */}
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      bulletColor(topic),
                    )}
                    aria-hidden
                  />

                  {/* topic info — tap to navigate */}
                  <Link
                    href={`/topics/${topic.id}`}
                    className={cn(
                      "min-w-0 flex-1",
                      isReviewed ? "pointer-events-none" : "",
                    )}
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        isReviewed
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}
                    >
                      {topic.title}
                    </p>
                    {sub && (
                      <p className="mt-0.5 truncate text-xs text-foreground/70">
                        {sub.icon} {sub.name}
                      </p>
                    )}
                  </Link>

                  {/* topic state badge (for non-new topics) */}
                  {topic.state !== "new" && !isReviewed && (
                    <div className="hidden shrink-0 sm:block">
                      <TopicStateBadge state={topic.state} />
                    </div>
                  )}

                  {/* difficulty badge (for reviewed topics) */}
                  {topic.currentDifficulty && !isReviewed && (
                    <div className="hidden shrink-0 sm:block">
                      <TopicDifficultyBadge
                        difficulty={topic.currentDifficulty}
                      />
                    </div>
                  )}

                  {/* ◯ button — opens review dialog */}
                  <button
                    type="button"
                    onClick={() => openDialog(topic)}
                    disabled={isReviewed}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
                      isReviewed
                        ? "border-muted text-muted-foreground/30 cursor-not-allowed"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                    )}
                    aria-label={`Review ${topic.title}`}
                  >
                    ◯
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon="🎉"
              title="All caught up!"
              description="No topics due today. Take a break or add new material."
              primaryAction={
                <Button onClick={() => setShowCreateTopic(true)}>
                  Add topic
                </Button>
              }
            />
          </div>
        )}
      </section>

      {/* ── Past Commits section ── */}
      {hasHistory && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            Past Commits
          </h2>

          <div className="mt-3 space-y-6">
            {sortedGroups.map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dateLabel}
                </p>
                <ul>
                  {items.map(({ entry, topic, subject }) => (
                    <li
                      key={entry.id}
                      className="rounded-lg px-4 py-3 transition-colors hover:bg-accent/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/topics/${topic.id}`}
                            className="truncate text-sm font-semibold text-foreground hover:text-primary"
                          >
                            {topic.title}
                          </Link>
                          {subject && (
                            <p className="mt-0.5 truncate text-xs text-foreground/70">
                              {subject.icon} {subject.name}
                            </p>
                          )}
                        </div>
                        <TopicDifficultyBadge
                          difficulty={entry.difficultySelected}
                          className="shrink-0"
                        />
                      </div>
                      {entry.commitMessage && (
                        <p className="mt-1.5 text-sm italic text-foreground/70">
                          &ldquo;{entry.commitMessage}&rdquo;
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Dialogs ── */}
      {dialogTopic && (
        <ReviewDialog
          topic={dialogTopic}
          subject={dialogSubject}
          open={!!dialogTopic}
          onClose={closeDialog}
          onCommit={handleCommit}
        />
      )}
      {showCreateTopic && (
        <CreateTopicModal onClose={() => setShowCreateTopic(false)} />
      )}
    </PageShell>
  );
}
