"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  ReviewDialog,
  BacklogSidebar,
  TodayDropZone,
  TodayTopicItem,
} from "@/components/today";
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
  const { submitReview, topics, subjects, reviewHistory } = useStore();
  const { user } = useAuth();

  const dueTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics
      .filter((t) => {
        if (t.state === "backlog") return false;
        const d = new Date(t.nextReviewDate);
        d.setHours(0, 0, 0, 0);
        return d < tomorrow;
      })
      .sort((a, b) => {
        const stateOrder: Record<string, number> = {
          relearning: 0,
          learning: 1,
          new: 2,
          reviewing: 3,
        };
        return (stateOrder[a.state] ?? 3) - (stateOrder[b.state] ?? 3);
      });
  }, [topics]);
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

  // ── drag & drop ──
  const isMobile = useIsMobile();
  const [activeDragTopic, setActiveDragTopic] = useState<Topic | null>(null);
  const { scheduleTopicForToday, moveToBacklog } = useStore();

  // 200ms hold before drag for today items; immediate drag for backlog items (marked data-drag-immediate)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
      bypassActivationConstraint({ activeNode }) {
        // Backlog sidebar items have data-drag-immediate → drag immediately
        const el = activeNode?.node?.current;
        return el?.hasAttribute("data-drag-immediate") === true;
      },
    }),
  );

  const backlogTopics = useMemo(
    () => topics.filter((t) => t.state === "backlog"),
    [topics],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as
      | { topic: Topic; subject?: Subject }
      | undefined;
    if (data?.topic) {
      setActiveDragTopic(data.topic);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragTopic(null);
      const { active, over } = event;
      if (!over) return;

      const topicId = active.id as string;
      const sourceData = active.data.current as { topic: Topic } | undefined;
      const sourceState = sourceData?.topic?.state;

      if (over.id === "today-zone" && sourceState === "backlog") {
        scheduleTopicForToday(topicId);
      } else if (over.id === "backlog-zone" && sourceState === "new") {
        moveToBacklog(topicId);
      }
    },
    [scheduleTopicForToday, moveToBacklog],
  );

  const activeDragSubject = activeDragTopic
    ? subjects.find((s) => s.id === activeDragTopic.subjectId)
    : undefined;

  // ── empty state ──
  const hasDue = dueTopics.length > 0;
  const hasHistory = enrichedHistory.length > 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

          <TodayDropZone>
            {hasDue ? (
              <ul className="mt-3">
                {dueTopics.map((topic) => {
                  const sub = subjects.find((s) => s.id === topic.subjectId);
                  const isReviewed = reviewedIds.has(topic.id);
                  return (
                    <TodayTopicItem
                      key={topic.id}
                      topic={topic}
                      subject={sub}
                      isReviewed={isReviewed}
                      onReview={openDialog}
                    />
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
          </TodayDropZone>
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

      {/* ── Backlog sidebar (desktop only) ── */}
      {!isMobile && (
        <BacklogSidebar topics={backlogTopics} subjects={subjects} />
      )}

      {/* ── Drag overlay preview ── */}
      <DragOverlay dropAnimation={null}>
        {activeDragTopic ? (
          <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5 shadow-xl ring-1 ring-border">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                bulletColor(activeDragTopic),
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {activeDragTopic.title}
              </p>
              {activeDragSubject && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {activeDragSubject.icon} {activeDragSubject.name}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
