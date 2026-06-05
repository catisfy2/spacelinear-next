"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Plus } from 'lucide-react';
import { CreateSubjectModal } from '@/components/subjects/CreateSubjectModal';
import { Progress } from '@/components/ui/progress';
import { startOfDay } from 'date-fns';
import { PageShell } from '@/components/app/PageShell';
import { PageHeader } from '@/components/app/PageHeader';
import { Button } from '@/components/ui/button';
import { AgentPanel } from "@/components/agent/AgentPanel";

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
    <PageShell>
      <PageHeader
        title="Subjects"
        description="Organize topics into subjects and track progress."
        actions={
          <Button size="sm" className="rounded-lg" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Subject
          </Button>
        }
      />

      {subjects.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="text-4xl">📚</div>
          <h2 className="text-lg font-medium text-foreground">No subjects yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create your first subject to start organizing your topics.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Subject
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {subjectStats.map(({ subject, totalCount, dueCount, mastery }) => (
            <div key={subject.id}>
              <Link
                href={`/subjects/${subject.id}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
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
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateSubjectModal onClose={() => setShowCreate(false)} />}
      <AgentPanel context="subjects" />
    </PageShell>
  );
}
