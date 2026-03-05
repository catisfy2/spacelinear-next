"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Plus, BookOpen } from 'lucide-react';
import { CreateSubjectModal } from '@/components/subjects/CreateSubjectModal';
import { Progress } from '@/components/ui/progress';
import { isToday, startOfDay } from 'date-fns';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

export function SubjectsPage() {
  const { subjects, topics } = useStore();
  const [showCreate, setShowCreate] = useState(false);

  const subjectStats = useMemo(() => {
    return subjects.map(subject => {
      const subTopics = topics.filter(t => t.subjectId === subject.id);
      const totalCount = subTopics.length;
      const dueCount = subTopics.filter(t => {
        const d = startOfDay(new Date(t.nextReviewDate));
        return d <= startOfDay(new Date());
      }).length;
      const reviewed = subTopics.filter(t => t.totalReviews > 0);
      const mastery = reviewed.length > 0
        ? Math.round(reviewed.reduce((sum, t) => sum + (t.correctReviews / t.totalReviews) * 100, 0) / reviewed.length)
        : 0;
      return { subject, totalCount, dueCount, mastery };
    });
  }, [subjects, topics]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Subjects</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Subject
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="text-4xl">📚</div>
            <h2 className="text-lg font-medium text-foreground">No subjects yet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create your first subject to start organizing your topics.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Subject
            </button>
          </div>
        ) : (
          <motion.div
            className="grid gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {subjectStats.map(({ subject, totalCount, dueCount, mastery }) => (
              <motion.div key={subject.id} variants={itemVariants}>
              <Link
                href={`/subjects/${subject.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <span className="text-2xl flex-shrink-0">{subject.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{subject.name}</span>
                    {dueCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {dueCount} due
                      </span>
                    )}
                  </div>
                  {subject.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{subject.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{totalCount} topic{totalCount !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <Progress value={mastery} className="h-1.5" />
                      <span className="text-xs text-muted-foreground font-mono">{mastery}%</span>
                    </div>
                  </div>
                </div>
              </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateSubjectModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}
