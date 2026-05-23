"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { previewIntervals } from '@/lib/algorithm';
import { formatInterval, DIFFICULTY_CONFIG, formatRelativeTime } from '@/lib/constants';
import type { Difficulty, QuizQuestion, Topic } from '@/lib/types';
import { hasQuizContent } from '@/lib/quiz';
import { QuizCard } from '@/components/quiz/QuizCard';
import { Flame, Clock, BarChart2, ChevronRight, Play, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTopicModal } from '@/components/topics/CreateTopicModal';
import { PageShell } from '@/components/app/PageShell';
import { MetricCard } from '@/components/app/MetricCard';
import { EmptyState } from '@/components/app/EmptyState';
import { TopicStateBadge } from '@/components/app/TopicStateBadge';
import { TopicDifficultyBadge } from '@/components/app/TopicDifficultyBadge';
import { formatEstimatedMinutes } from '@/lib/reviewEstimates';
import {
  getCalendarReviewStreak,
  getRecentRetention30d,
  getMaxTopicStreak,
  countDueTomorrow,
  getWeakestSubject,
} from '@/lib/stats';
import { cn } from '@/lib/utils';

type SessionPhase = 'overview' | 'review' | 'complete';

function RatingButton({
  difficulty,
  intervalDays,
  onSelect,
}: {
  difficulty: Difficulty;
  intervalDays: number;
  onSelect: () => void;
}) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const colorMap: Record<string, string> = {
    'sl-relearn': 'border-sl-relearn/30 hover:bg-sl-relearn/10 text-sl-relearn',
    'sl-hard': 'border-sl-hard/30 hover:bg-sl-hard/10 text-sl-hard',
    'sl-medium': 'border-sl-medium/30 hover:bg-sl-medium/10 text-sl-medium',
    'sl-easy': 'border-sl-easy/30 hover:bg-sl-easy/10 text-sl-easy',
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-3 transition-colors',
        colorMap[config.color],
      )}
    >
      <span className="text-sm font-medium">{config.label}</span>
      <span className="text-xs opacity-70">{formatInterval(intervalDays)}</span>
      <kbd className="mt-0.5 font-mono text-[10px] opacity-40">{config.key}</kbd>
    </button>
  );
}

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

type ReviewMode = 'quiz' | 'manual';

export function TodayPage() {
  const { getDueTopics, submitReview, subjects, topics, reviewHistory, resources, fetchResources } =
    useStore();
  const { user, session } = useAuth();
  const dueTopics = useMemo(() => getDueTopics(), [getDueTopics, topics]);

  const [phase, setPhase] = useState<SessionPhase>('overview');
  const [queue, setQueue] = useState<Topic[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('manual');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ total: 0, upgrades: 0, downgrades: 0 });
  const [showCreateTopic, setShowCreateTopic] = useState(false);

  const retention30d = useMemo(
    () => getRecentRetention30d(reviewHistory),
    [reviewHistory],
  );
  const calendarStreak = useMemo(
    () => getCalendarReviewStreak(reviewHistory),
    [reviewHistory],
  );
  const bestTopicStreak = useMemo(() => getMaxTopicStreak(topics), [topics]);
  const tomorrowDue = useMemo(() => countDueTomorrow(topics), [topics]);
  const weakest = useMemo(() => getWeakestSubject(subjects, topics), [subjects, topics]);

  const resetQuizState = useCallback(() => {
    setQuizQuestions(null);
    setQuizLoading(false);
    setQuizError(null);
  }, []);

  const resetReviewState = useCallback(() => {
    setShowRating(false);
    setReviewMode('manual');
    resetQuizState();
  }, [resetQuizState]);

  const startReview = useCallback(() => {
    const fresh = getDueTopics();
    setQueue(fresh);
    setCurrentIndex(0);
    resetReviewState();
    setSessionStats({ total: 0, upgrades: 0, downgrades: 0 });
    setPhase('review');
  }, [getDueTopics, resetReviewState]);

  const currentTopic = queue[currentIndex];
  const subject = currentTopic ? subjects.find((s) => s.id === currentTopic.subjectId) : null;
  const intervals = currentTopic ? previewIntervals(currentTopic) : null;
  const topicResources = useMemo(
    () => (currentTopic ? resources.filter((r) => r.entityId === currentTopic.id) : []),
    [currentTopic, resources],
  );

  useEffect(() => {
    if (phase !== 'review' || !currentTopic || !user) return;

    let cancelled = false;

    const prepareReview = async () => {
      setShowRating(false);
      resetQuizState();
      await fetchResources(currentTopic.id, user.id);

      if (cancelled) return;

      const latestResources = useStore
        .getState()
        .resources.filter((resource) => resource.entityId === currentTopic.id);

      if (!hasQuizContent(currentTopic, latestResources)) {
        setReviewMode('manual');
        return;
      }

      if (!session?.access_token) {
        setReviewMode('manual');
        setQuizError('Unable to generate quiz. Rate manually instead.');
        return;
      }

      setReviewMode('quiz');
      setQuizLoading(true);

      try {
        const response = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId: currentTopic.id,
            accessToken: session.access_token,
          }),
        });

        if (cancelled) return;

        if (!response.ok) {
          throw new Error('Quiz generation failed');
        }

        const data = (await response.json()) as { questions: QuizQuestion[] };
        if (!data.questions?.length) {
          throw new Error('No quiz questions returned');
        }

        setQuizQuestions(data.questions);
      } catch {
        if (cancelled) return;
        setReviewMode('manual');
        setQuizError('Could not generate quiz. Rate manually instead.');
      } finally {
        if (!cancelled) {
          setQuizLoading(false);
        }
      }
    };

    void prepareReview();

    return () => {
      cancelled = true;
    };
  }, [phase, currentTopic, user, session?.access_token, fetchResources, resetQuizState]);

  const handleRate = useCallback(
    (difficulty: Difficulty) => {
      if (!currentTopic || !user) return;
      submitReview(currentTopic.id, difficulty, user.id);

      const isUpgrade = difficulty === 'easy' || difficulty === 'medium';
      const isDowngrade = difficulty === 'relearn' || difficulty === 'hard';

      setSessionStats((prev) => ({
        total: prev.total + 1,
        upgrades: prev.upgrades + (isUpgrade ? 1 : 0),
        downgrades: prev.downgrades + (isDowngrade ? 1 : 0),
      }));

      resetReviewState();
      if (currentIndex + 1 >= queue.length) {
        setPhase('complete');
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [currentTopic, currentIndex, queue.length, submitReview, user, resetReviewState],
  );

  useEffect(() => {
    if (phase !== 'review' || reviewMode !== 'manual') return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.key === ' ' && !showRating) {
        e.preventDefault();
        setShowRating(true);
      }
      if (showRating) {
        const keyMap: Record<string, Difficulty> = {
          '1': 'relearn',
          '2': 'hard',
          '3': 'medium',
          '4': 'easy',
        };
        if (keyMap[e.key]) handleRate(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, reviewMode, showRating, handleRate]);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const previewList = useMemo(() => dueTopics.slice(0, 8), [dueTopics]);

  if (phase === 'overview') {
    const hasDue = dueTopics.length > 0;
    return (
      <PageShell maxWidth="wide" className="pb-12">
        <div className="space-y-8">
          <div>
            <p className="text-sm text-muted-foreground">
              {greetingLabel()}, {displayName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Today</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Your daily overview and review session. Stay consistent—small sessions compound.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Due today"
              value={dueTopics.length}
              hint={hasDue ? formatEstimatedMinutes(dueTopics.length) : 'Nothing scheduled'}
              icon={Sparkles}
              className="sm:col-span-2 lg:col-span-1"
            />
            <MetricCard
              label="Review streak"
              value={calendarStreak}
              hint="Days in a row with a review"
              icon={Flame}
            />
            <MetricCard
              label="30d retention"
              value={`${retention30d}%`}
              hint="Good or easy ratings"
            />
            <MetricCard
              label="Best topic streak"
              value={bestTopicStreak}
              hint="Across all topics"
            />
          </div>

          {hasDue ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {dueTopics.length} topic{dueTopics.length !== 1 ? 's' : ''} due
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estimated {formatEstimatedMinutes(dueTopics.length)} · Keyboard-friendly flow
                  </p>
                </div>
                <Button size="lg" className="rounded-lg" onClick={startReview}>
                  <Play className="mr-2 h-4 w-4" />
                  Start review
                </Button>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Due now
                </p>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {previewList.map((t) => {
                    const sub = subjects.find((s) => s.id === t.subjectId);
                    return (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{t.title}</p>
                          {sub && (
                            <p className="text-xs text-muted-foreground">
                              {sub.icon} {sub.name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <TopicStateBadge state={t.state} />
                          {t.currentDifficulty ? (
                            <TopicDifficultyBadge difficulty={t.currentDifficulty} />
                          ) : null}
                          {t.lastReviewedAt && (
                            <span className="text-xs text-muted-foreground">
                              Last {formatRelativeTime(t.lastReviewedAt)}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="🎉"
              title="You're caught up"
              description="No topics are due today. Add new material or peek at Pulse to see your progress."
              primaryAction={
                <Button onClick={() => setShowCreateTopic(true)}>Add topic</Button>
              }
              secondaryAction={
                <Button variant="outline" asChild>
                  <Link href="/pulse">Open Pulse</Link>
                </Button>
              }
            />
          )}
        </div>
        {showCreateTopic && <CreateTopicModal onClose={() => setShowCreateTopic(false)} />}
      </PageShell>
    );
  }

  if (phase === 'complete') {
    const retention =
      sessionStats.total > 0
        ? Math.round((sessionStats.upgrades / sessionStats.total) * 100)
        : 0;

    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-8 text-center">
          <div className="text-5xl" aria-hidden>
            ✅
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Session complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nice work. Consistency beats intensity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            <MetricCard label="Reviewed" value={sessionStats.total} className="p-3" />
            <MetricCard label="Retention" value={`${retention}%`} className="p-3" />
            <MetricCard
              label="Upgrades"
              value={`↑ ${sessionStats.upgrades}`}
              className="p-3"
            />
            <MetricCard
              label="Downgrades"
              value={`↓ ${sessionStats.downgrades}`}
              className="p-3"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Tomorrow:</span>{' '}
              {tomorrowDue} topic{tomorrowDue !== 1 ? 's' : ''} scheduled
            </p>
            {weakest && weakest.subject ? (
              <p>
                <span className="font-medium text-foreground">Focus area:</span>{' '}
                {weakest.subject.icon} {weakest.subject.name} ({weakest.mastery}% easy)
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={() => setPhase('overview')}>
              Back to Today
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pulse">Open Pulse</Link>
            </Button>
            <Button onClick={() => setShowCreateTopic(true)}>Add topic</Button>
          </div>
        </div>
        {showCreateTopic && <CreateTopicModal onClose={() => setShowCreateTopic(false)} />}
      </div>
    );
  }

  /* review phase */
  if (queue.length === 0) {
    return (
      <EmptyState
        title="Nothing to review"
        description="Your queue is empty. Return to the overview to refresh."
        primaryAction={
          <Button onClick={() => setPhase('overview')}>Back to overview</Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Review</span>
          <span className="font-mono">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
        <div className="mx-auto mt-2 h-1 max-w-2xl overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${(currentIndex / queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
        <div key={currentTopic.id} className="w-full max-w-2xl">
            <div className="rounded-xl border border-border bg-card p-6 shadow-2xs sm:p-8">
              {subject && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{subject.icon}</span>
                  <span>{subject.name}</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}

              <h1 className="mb-3 text-2xl font-semibold text-foreground">{currentTopic.title}</h1>

              {currentTopic.description && (
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  {currentTopic.description}
                </p>
              )}

              <div className="mb-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Streak: {currentTopic.streak}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Reviews: {currentTopic.totalReviews}</span>
                </div>
                {currentTopic.lastReviewedAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last: {formatRelativeTime(currentTopic.lastReviewedAt)}</span>
                  </div>
                )}
              </div>

              {reviewMode === 'quiz' && quizLoading && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Generating quiz…</p>
                  <p className="text-xs text-muted-foreground">
                    Building questions from your notes and resources
                  </p>
                </div>
              )}

              {reviewMode === 'quiz' && !quizLoading && quizQuestions && intervals && (
                <QuizCard
                  questions={quizQuestions}
                  intervals={intervals}
                  onConfirm={handleRate}
                />
              )}

              {reviewMode === 'manual' && (
                <>
                  {quizError && (
                    <p className="mb-4 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                      {quizError}
                    </p>
                  )}
                  {!hasQuizContent(currentTopic, topicResources) && (
                    <p className="mb-4 text-xs text-muted-foreground">
                      Add notes or resources to this topic to unlock AI quizzes.
                    </p>
                  )}
                  {!showRating ? (
                    <button
                      type="button"
                      onClick={() => setShowRating(true)}
                      className="w-full rounded-lg bg-secondary py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
                    >
                      I&apos;m ready to rate ·{' '}
                      <kbd className="font-mono text-xs opacity-60">Space</kbd>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      {intervals &&
                        (Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                          <RatingButton
                            key={d}
                            difficulty={d}
                            intervalDays={intervals[d]}
                            onSelect={() => handleRate(d)}
                          />
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
