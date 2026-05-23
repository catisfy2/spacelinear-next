"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, Hash, Flame, PanelRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATE_CONFIG,
  DIFFICULTY_CONFIG,
  formatNextReview,
  formatInterval,
} from '@/lib/constants';
import { previewIntervals } from '@/lib/algorithm';
import type { Difficulty } from '@/lib/types';
import { TopicNoteEditor } from '@/components/topics/TopicNoteEditor';
import { TopicResources } from '@/components/topics/TopicResources';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TopicActionsMenu } from '@/components/topics/TopicActionsMenu';

type Tab = 'notes' | 'resources';

export function TopicPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { topics, subjects, reviewHistory, submitReview, aiGenerationStatus, startPollingAiContent } = useStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
  );
  const [isResizing, setIsResizing] = useState(false);
  const [confirmDifficulty, setConfirmDifficulty] = useState<Difficulty | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmittingDifficulty, setIsSubmittingDifficulty] = useState(false);

  const topic = topics.find(t => t.id === id);
  const subject = topic ? subjects.find(s => s.id === topic.subjectId) : undefined;

  useEffect(() => {
    if (topic && !topic.description && aiGenerationStatus[topic.id] !== 'done') {
      startPollingAiContent(topic.id);
    }
  }, [topic?.id, topic?.description]);

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <p className="text-muted-foreground text-sm">Topic not found.</p>
        <button
          onClick={() => router.replace('/topics')}
          className="text-sm text-primary hover:underline"
        >
          Back to Topics
        </button>
      </div>
    );
  }

  const stateConfig = STATE_CONFIG[topic.state];
  const difficultyIntervals = previewIntervals(topic);
  const history = reviewHistory
    .filter(h => h.topicId === topic.id)
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());

  const handleDifficultyClick = (difficulty: Difficulty) => {
    setConfirmDifficulty(difficulty);
    setShowConfirmDialog(true);
  };

  const handleConfirmDifficulty = async () => {
    if (!user || !confirmDifficulty) return;
    try {
      setIsSubmittingDifficulty(true);
      await submitReview(topic.id, confirmDifficulty, user.id);
      setShowConfirmDialog(false);
      setConfirmDifficulty(null);
    } finally {
      setIsSubmittingDifficulty(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const handleResizeMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || isSidebarCollapsed) return;

    setIsResizing(true);
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const nextWidth = startWidth - deltaX;
      const clamped = Math.min(420, Math.max(260, nextWidth));
      setSidebarWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col px-4 py-6 space-y-7 bg-background">
      {/* Difficulty card */}
      <section className="rounded-[28px] px-5 py-4 space-y-3 bg-card text-foreground shadow-xl border border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
          Mark your difficulty
        </h3>
        <div className="flex items-stretch gap-2 mt-[2px]">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(difficultyKey => {
            const config = DIFFICULTY_CONFIG[difficultyKey];
            const interval = difficultyIntervals[difficultyKey];

            const colorMap: Record<string, string> = {
              'sl-relearn':
                'border-sl-relearn/40 text-sl-relearn bg-card hover:bg-sl-relearn/5',
              'sl-hard': 'border-sl-hard/40 text-sl-hard bg-card hover:bg-sl-hard/5',
              'sl-medium':
                'border-sl-medium/40 text-sl-medium bg-card hover:bg-sl-medium/5',
              'sl-easy': 'border-sl-easy/40 text-sl-easy bg-card hover:bg-sl-easy/5',
            };

            return (
              <button
                key={difficultyKey}
                type="button"
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl border text-xs transition-colors',
                  colorMap[config.color],
                )}
                onClick={() => handleDifficultyClick(difficultyKey)}
              >
                <span className="font-medium">{config.label}</span>
                <span className="opacity-60 font-mono">{interval}d</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Properties + review history */}
      <section className="space-y-5">
        <div className="rounded-2xl px-0 py-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
              Properties
            </h3>
            <div className="grid grid-cols-[120px_1fr] gap-y-2.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-foreground capitalize">{stateConfig.label}</span>

              <span className="text-muted-foreground">Next review</span>
              <span className="text-foreground">{formatNextReview(topic.nextReviewDate)}</span>

              <span className="text-muted-foreground">Next review date</span>
              <span className="text-foreground font-mono text-xs">
                {new Date(topic.nextReviewDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>

              <span className="text-muted-foreground">Interval</span>
              <span className="text-foreground font-mono">
                {formatInterval(topic.currentIntervalDays)}
              </span>

              <span className="text-muted-foreground">Ease</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-mono">
                  {topic.easeFactor.toFixed(2)}
                </span>
                <div className="h-1.5 bg-secondary rounded-full w-20 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, ((topic.easeFactor - 1.3) / 1.7) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <span className="text-muted-foreground">Streak</span>
              <span className="text-foreground font-mono">{topic.streak}</span>

              <span className="text-muted-foreground">Reviews</span>
              <span className="text-foreground">{topic.totalReviews} total</span>

              {topic.tags.length > 0 && (
                <>
                  <span className="text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {topic.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-accent px-2 py-0.5 rounded text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
              Review History
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reviews yet</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 10).map(entry => {
                  const config = DIFFICULTY_CONFIG[entry.difficultySelected];
                  return (
                    <div key={entry.id} className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground font-mono w-16 flex-shrink-0">
                        {new Date(entry.reviewedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className={cn('font-medium w-16', `text-${config.color}`)}>
                        {config.label}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {entry.intervalBeforeDays}d → {entry.intervalAfterDays}d
                      </span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        e{entry.easeFactor.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-full relative">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3 min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/topics" className="hover:text-foreground transition-colors">
                Topics
              </Link>
              {subject && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <Link
                    href={`/subjects/${subject.id}`}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <span>{subject.icon}</span>
                    <span>{subject.name}</span>
                  </Link>
                </>
              )}
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground truncate max-w-[200px]">{topic.title}</span>
            </nav>

            {/* Title + meta */}
            <div>
              <h1 className="text-2xl font-semibold text-foreground leading-tight mb-2">
                {topic.title}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {/* State pill */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border',
                    `border-${stateConfig.color}/40 text-${stateConfig.color}`,
                  )}
                >
                  <span>{stateConfig.icon}</span>
                  {stateConfig.label}
                </span>

                {/* Streak */}
                {topic.streak > 2 && (
                  <span className="flex items-center gap-1 text-xs text-sl-hard">
                    <Flame className="w-3 h-3" />
                    {topic.streak} streak
                  </span>
                )}

                {/* Tags row */}
                {topic.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    {topic.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-accent px-1.5 py-0.5 rounded text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {aiGenerationStatus[topic.id] === 'pending' && topic.tags.length === 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
                    Generating tags...
                  </div>
                )}
              </div>

              {topic.description ? (
                <p className="mt-3 text-sm text-muted-foreground max-w-xl">
                  {topic.description}
                </p>
              ) : aiGenerationStatus[topic.id] === 'pending' ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  AI is generating description...
                </div>
              ) : null}
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <TopicActionsMenu
              topicId={topic.id}
              onDeleted={() => router.replace('/topics')}
            />
            <button
              type="button"
              onClick={handleToggleSidebar}
              title="Toggle details"
              className={cn(
                'p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-accent',
                !isSidebarCollapsed && 'bg-accent text-foreground',
              )}
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-0 border-b border-border flex-shrink-0">
          {(['notes', 'resources'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px rounded-t-md',
                activeTab === tab
                  ? 'border-primary text-foreground bg-background'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/40',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1">
          {activeTab === 'notes' && (
            <div className="px-0 py-0">
              <TopicNoteEditor topicId={topic.id} />
            </div>
          )}
          {activeTab === 'resources' && (
            <div className="px-6 py-5">
              <TopicResources topicId={topic.id} />
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar — resizable & collapsible */}
      {isDesktop && (
        <>
          {/* Resize handle (desktop only) */}
          <div
            className={cn(
              'hidden md:block cursor-col-resize select-none transition-colors',
              isSidebarCollapsed ? 'w-0' : 'w-1 hover:bg-border',
              isResizing && 'bg-border',
            )}
            onMouseDown={handleResizeMouseDown}
          />

          <aside
            className="hidden md:block border-t md:border-t-0 md:border-l border-border bg-muted/40 flex-shrink-0 overflow-hidden"
            style={
              isSidebarCollapsed
                ? { width: 0 }
                : { width: sidebarWidth, minWidth: 260, maxWidth: 420 }
            }
          >
            {renderSidebarContent()}
          </aside>
        </>
      )}

      {/* Mobile / small screens: stacked, toggle-only, no resize */}
      {!isDesktop && !isSidebarCollapsed && (
        <aside className="w-full border-t border-border bg-muted/40 flex-shrink-0">
          {renderSidebarContent()}
        </aside>
      )}

      <AlertDialog
        open={showConfirmDialog}
        onOpenChange={open => {
          if (isSubmittingDifficulty) return;
          setShowConfirmDialog(open);
          if (!open) {
            setConfirmDifficulty(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDifficulty
                ? `Mark as ${DIFFICULTY_CONFIG[confirmDifficulty].label}?`
                : 'Confirm difficulty'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDifficulty && (
                <span>
                  This will record a review with difficulty "
                  {DIFFICULTY_CONFIG[confirmDifficulty].label}". Next review in{' '}
                  {difficultyIntervals[confirmDifficulty]}d.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingDifficulty}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDifficulty}
              disabled={isSubmittingDifficulty}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingDifficulty ? 'Saving...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
