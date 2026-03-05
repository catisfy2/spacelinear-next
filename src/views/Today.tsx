"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { previewIntervals } from '@/lib/algorithm';
import { formatInterval, DIFFICULTY_CONFIG, formatRelativeTime } from '@/lib/constants';
import type { Difficulty, Topic } from '@/lib/types';
import { Flame, Clock, BarChart2, ChevronRight } from 'lucide-react';

function RatingButton({ difficulty, intervalDays, onSelect }: { difficulty: Difficulty; intervalDays: number; onSelect: () => void }) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const colorMap: Record<string, string> = {
    'sl-relearn': 'border-sl-relearn/30 hover:bg-sl-relearn/10 text-sl-relearn',
    'sl-hard': 'border-sl-hard/30 hover:bg-sl-hard/10 text-sl-hard',
    'sl-medium': 'border-sl-medium/30 hover:bg-sl-medium/10 text-sl-medium',
    'sl-easy': 'border-sl-easy/30 hover:bg-sl-easy/10 text-sl-easy',
  };

  return (
    <button
      onClick={onSelect}
      className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-colors ${colorMap[config.color]}`}
    >
      <span className="text-sm font-medium">{config.label}</span>
      <span className="text-xs opacity-70">{formatInterval(intervalDays)}</span>
      <kbd className="text-[10px] font-mono opacity-40 mt-0.5">{config.key}</kbd>
    </button>
  );
}

export function TodayPage() {
  const { getDueTopics, submitReview, subjects } = useStore();
  const { user } = useAuth();
  const dueTopics = useMemo(() => getDueTopics(), [getDueTopics]);
  const [queue] = useState<Topic[]>(dueTopics);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, upgrades: 0, downgrades: 0 });

  const currentTopic = queue[currentIndex];
  const subject = currentTopic ? subjects.find(s => s.id === currentTopic.subjectId) : null;
  const intervals = currentTopic ? previewIntervals(currentTopic) : null;

  const handleRate = useCallback((difficulty: Difficulty) => {
    if (!currentTopic || !user) return;
    submitReview(currentTopic.id, difficulty, user.id);

    const isUpgrade = difficulty === 'easy' || difficulty === 'medium';
    const isDowngrade = difficulty === 'relearn' || difficulty === 'hard';

    setSessionStats(prev => ({
      total: prev.total + 1,
      upgrades: prev.upgrades + (isUpgrade ? 1 : 0),
      downgrades: prev.downgrades + (isDowngrade ? 1 : 0),
    }));

    setShowRating(false);
    if (currentIndex + 1 >= queue.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentTopic, currentIndex, queue.length, submitReview, user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' && !showRating) {
        e.preventDefault();
        setShowRating(true);
      }
      if (showRating) {
        const keyMap: Record<string, Difficulty> = { '1': 'relearn', '2': 'hard', '3': 'medium', '4': 'easy' };
        if (keyMap[e.key]) handleRate(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showRating, handleRate]);

  if (queue.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full gap-4 text-center px-4"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-semibold text-foreground">All caught up!</h2>
        <p className="text-muted-foreground max-w-md">No topics due for review. Go learn something new or check back later.</p>
      </motion.div>
    );
  }

  if (sessionComplete) {
    const retention = sessionStats.total > 0 ? Math.round((sessionStats.upgrades / sessionStats.total) * 100) : 0;
    const statCards = [
      { value: sessionStats.total, label: 'reviewed', className: 'text-foreground' },
      { value: `${retention}%`, label: 'retention', className: 'text-foreground' },
      { value: `↑ ${sessionStats.upgrades}`, label: 'upgrades', className: 'text-sl-easy' },
      { value: `↓ ${sessionStats.downgrades}`, label: 'downgrades', className: 'text-sl-relearn' },
    ];
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full gap-6 text-center px-4"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-semibold text-foreground">Session Complete</h2>
        <motion.div
          className="grid grid-cols-2 gap-4 text-sm max-w-xs w-full"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
        >
          {statCards.map(({ value, label, className }) => (
            <motion.div
              key={label}
              className="bg-card rounded-lg p-4 border border-border"
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}
            >
              <div className={`text-2xl font-bold ${className}`}>{value}</div>
              <div className="text-muted-foreground">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Today's Review</span>
          <span className="font-mono">{currentIndex + 1} / {queue.length}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTopic.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-card border border-border rounded-xl p-8">
              {/* Subject */}
              {subject && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>{subject.icon}</span>
                  <span>{subject.name}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-semibold text-foreground mb-3">{currentTopic.title}</h1>

              {/* Description */}
              {currentTopic.description && (
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{currentTopic.description}</p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-6 text-xs text-muted-foreground mb-8">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Streak: {currentTopic.streak}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Reviews: {currentTopic.totalReviews}</span>
                </div>
                {currentTopic.lastReviewedAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last: {formatRelativeTime(currentTopic.lastReviewedAt)}</span>
                  </div>
                )}
              </div>

              {/* Rating section */}
              {!showRating ? (
                <button
                  onClick={() => setShowRating(true)}
                  className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors text-sm font-medium"
                >
                  I'm ready to rate · <kbd className="font-mono text-xs opacity-60">Space</kbd>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  {intervals && (Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                    <RatingButton key={d} difficulty={d} intervalDays={intervals[d]} onSelect={() => handleRate(d)} />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
