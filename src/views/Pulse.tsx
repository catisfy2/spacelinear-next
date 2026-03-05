"use client";

import { useStore } from '@/store/useStore';
import { useMemo } from 'react';
import { Flame, Target, BookOpen, TrendingUp } from 'lucide-react';
import type { ReviewHistoryEntry } from '@/lib/types';

export function PulsePage() {
  const { topics, subjects, reviewHistory } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const dueNow = topics.filter(t => new Date(t.nextReviewDate) <= now).length;
    const totalReviews = reviewHistory.length;
    const last30d = reviewHistory.filter(h => {
      const d = new Date(h.reviewedAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return d >= thirtyDaysAgo;
    });
    const recentRetention = last30d.length > 0
      ? Math.round((last30d.filter(h => h.difficultySelected === 'medium' || h.difficultySelected === 'easy').length / last30d.length) * 100)
      : 0;

    const stateBreakdown = {
      new: topics.filter(t => t.state === 'new').length,
      learning: topics.filter(t => t.state === 'learning').length,
      reviewing: topics.filter(t => t.state === 'reviewing').length,
      relearning: topics.filter(t => t.state === 'relearning').length,
    };

    const maxStreak = topics.reduce((max, t) => Math.max(max, t.streak), 0);

    return { dueNow, totalReviews, recentRetention, stateBreakdown, maxStreak, last30dCount: last30d.length };
  }, [topics, reviewHistory]);

  const subjectStats = useMemo(() => {
    return subjects.map(s => {
      const subjectTopics = topics.filter(t => t.subjectId === s.id);
      const total = subjectTopics.length;
      const easy = subjectTopics.filter(t => t.currentDifficulty === 'easy').length;
      const due = subjectTopics.filter(t => new Date(t.nextReviewDate) <= new Date()).length;
      const mastery = total > 0 ? Math.round((easy / total) * 100) : 0;
      return { ...s, total, mastery, due };
    });
  }, [subjects, topics]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-lg font-semibold text-foreground mb-6">Pulse</h1>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="text-4xl">📊</div>
          <h2 className="text-lg font-medium text-foreground">No data yet</h2>
          <p className="text-sm text-muted-foreground">Start reviewing topics to see your learning analytics here.</p>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Target} label="Due Now" value={stats.dueNow} />
            <StatCard icon={BookOpen} label="Total Reviews" value={stats.totalReviews} />
            <StatCard icon={TrendingUp} label="30d Retention" value={`${stats.recentRetention}%`} />
            <StatCard icon={Flame} label="Best Streak" value={stats.maxStreak} />
          </div>

          {/* Review activity heatmap */}
          <ReviewHeatmap reviewHistory={reviewHistory} />

          {/* Topics by state */}
          <div className="bg-card border border-border rounded-lg p-5 mb-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Topics by State</h3>
            <div className="flex gap-2 h-6 rounded-md overflow-hidden">
              {stats.stateBreakdown.reviewing > 0 && (
                <div
                  className="bg-sl-easy rounded-sm"
                  style={{ flex: stats.stateBreakdown.reviewing }}
                  title={`Reviewing: ${stats.stateBreakdown.reviewing}`}
                />
              )}
              {stats.stateBreakdown.learning > 0 && (
                <div
                  className="bg-sl-hard rounded-sm"
                  style={{ flex: stats.stateBreakdown.learning }}
                  title={`Learning: ${stats.stateBreakdown.learning}`}
                />
              )}
              {stats.stateBreakdown.new > 0 && (
                <div
                  className="bg-muted-foreground/30 rounded-sm"
                  style={{ flex: stats.stateBreakdown.new }}
                  title={`New: ${stats.stateBreakdown.new}`}
                />
              )}
              {stats.stateBreakdown.relearning > 0 && (
                <div
                  className="bg-sl-relearn rounded-sm"
                  style={{ flex: stats.stateBreakdown.relearning }}
                  title={`Relearning: ${stats.stateBreakdown.relearning}`}
                />
              )}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-sl-easy" /> Reviewing ({stats.stateBreakdown.reviewing})</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-sl-hard" /> Learning ({stats.stateBreakdown.learning})</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-muted-foreground/30" /> New ({stats.stateBreakdown.new})</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-sl-relearn" /> Relearn ({stats.stateBreakdown.relearning})</span>
            </div>
          </div>

          {/* Subject mastery */}
          {subjectStats.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Subject Mastery</h3>
              <div className="space-y-3">
                {subjectStats.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-sm flex-shrink-0">{s.icon}</span>
                    <span className="text-sm text-foreground w-32 truncate">{s.name}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${s.mastery}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right">{s.mastery}%</span>
                    {s.due > 0 && (
                      <span className="text-xs font-mono text-sl-relearn">{s.due} due</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCellColor(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-primary/25';
  if (count <= 3) return 'bg-primary/50';
  if (count <= 6) return 'bg-primary/75';
  return 'bg-primary';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format a Date as YYYY-MM-DD in local time
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ReviewHeatmap({ reviewHistory }: { reviewHistory: ReviewHistoryEntry[] }) {
  const { weeks, monthPositions, totalReviews } = useMemo(() => {
    // Convert each reviewedAt ISO string to local date key
    const reviewsByDay: Record<string, number> = {};
    for (const h of reviewHistory) {
      const day = localDateKey(new Date(h.reviewedAt));
      reviewsByDay[day] = (reviewsByDay[day] ?? 0) + 1;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build 371 days back so the first cell aligns to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 370);
    // Step back to the previous Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: { date: Date; key: string; count: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= today) {
      const key = localDateKey(cursor);
      days.push({ date: new Date(cursor), key, count: reviewsByDay[key] ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Group into weeks (columns of 7)
    const cols: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }

    // Month label positions: record which column index a new month first appears
    const seen = new Set<string>();
    const positions: { col: number; label: string }[] = [];
    cols.forEach((week, colIdx) => {
      for (const day of week) {
        const monthKey = `${day.date.getFullYear()}-${day.date.getMonth()}`;
        if (!seen.has(monthKey)) {
          seen.add(monthKey);
          positions.push({ col: colIdx, label: MONTH_LABELS[day.date.getMonth()] });
          break;
        }
      }
    });

    const total = Object.values(reviewsByDay).reduce((s, v) => s + v, 0);

    return { weeks: cols, monthPositions: positions, totalReviews: total };
  }, [reviewHistory]);

  const CELL = 11; // px per cell
  const GAP = 2;   // px gap

  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Review Activity</h3>
        <span className="text-xs text-muted-foreground">{totalReviews} total reviews</span>
      </div>

      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        <div className="inline-flex gap-1 min-w-max">
          {/* Weekday labels column */}
          <div className="flex flex-col justify-between pt-5 pr-1" style={{ gap: GAP }}>
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className="text-muted-foreground text-right leading-none"
                style={{
                  fontSize: 9,
                  height: CELL,
                  lineHeight: `${CELL}px`,
                  visibility: i % 2 === 1 ? 'visible' : 'hidden',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels row */}
            <div className="flex mb-1" style={{ gap: GAP }}>
              {weeks.map((_, colIdx) => {
                const pos = monthPositions.find(p => p.col === colIdx);
                return (
                  <div
                    key={colIdx}
                    className="text-muted-foreground shrink-0"
                    style={{ fontSize: 9, width: CELL, lineHeight: '12px', height: 12 }}
                  >
                    {pos ? pos.label : ''}
                  </div>
                );
              })}
            </div>

            {/* Week columns */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day) => {
                    const tooltip = day.count > 0
                      ? `${day.count} review${day.count > 1 ? 's' : ''} on ${formatDate(day.date)}`
                      : formatDate(day.date);
                    return (
                      <div
                        key={day.key}
                        title={tooltip}
                        className={`rounded-sm shrink-0 cursor-default transition-opacity hover:opacity-80 ${getCellColor(day.count)}`}
                        style={{ width: CELL, height: CELL }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-xs text-muted-foreground">Less</span>
        {[0, 1, 2, 4, 7].map((n) => (
          <div
            key={n}
            className={`rounded-sm ${getCellColor(n)}`}
            style={{ width: CELL, height: CELL }}
          />
        ))}
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
}
