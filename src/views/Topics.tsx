"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import type { TopicState, Subject } from '@/lib/types';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateTopicModal } from '@/components/topics/CreateTopicModal';
import { CreateSubjectModal } from '@/components/subjects/CreateSubjectModal';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/app/PageHeader';
import { PageShell } from '@/components/app/PageShell';
import { EmptyState } from '@/components/app/EmptyState';
import { TopicRow } from '@/components/app/TopicRow';
import { Button } from '@/components/ui/button';

/** Preserve the previous grouped view order when flattening the list. */
const STATE_RANK: Record<TopicState, number> = {
  relearning: 0,
  learning: 1,
  new: 2,
  reviewing: 3,
};

type StateFilter = 'all' | 'due' | 'backlog' | TopicState;

const FILTER_CHIPS: { id: StateFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'due', label: 'Due' },
  { id: 'new', label: 'New' },
  { id: 'learning', label: 'Learning' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'relearning', label: 'Relearning' },
  { id: 'backlog', label: 'Backlog' },
];

export function TopicsPage() {
  const { topics, subjects, getDueTopics } = useStore();
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const searchParams = useSearchParams();
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (searchParams.get('create-subject') === 'true') {
      setShowCreateSubject(true);
    }
  }, [searchParams]);

  const dueIdSet = useMemo(() => new Set(getDueTopics().map((t) => t.id)), [getDueTopics, topics]);

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = topics;

    if (filterSubjectId !== 'all') {
      result = result.filter((t) => t.subjectId === filterSubjectId);
    }

    if (stateFilter === 'due') {
      result = result.filter((t) => dueIdSet.has(t.id));
    } else if (stateFilter === 'backlog') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 30);
      result = result.filter((t) => new Date(t.nextReviewDate) > cutoff);
    } else if (stateFilter !== 'all') {
      result = result.filter((t) => t.state === stateFilter);
    }

    if (q) {
      result = result.filter((t) => {
        const subj = subjects.find((s) => s.id === t.subjectId);
        const inTitle = t.title.toLowerCase().includes(q);
        const inSubject = subj?.name.toLowerCase().includes(q);
        return inTitle || inSubject;
      });
    }

    return result;
  }, [topics, subjects, filterSubjectId, stateFilter, search, dueIdSet]);

  const displayTopics = useMemo(
    () =>
      [...filteredTopics].sort(
        (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state],
      ),
    [filteredTopics],
  );

  return (
    <>
      <PageShell>
        <div className="border-b border-border pb-6">
          <PageHeader
            title="Topics"
            description="Search, filter, and open any topic."
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setShowCreateSubject(true)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Subject
                </Button>
                <Button size="sm" className="rounded-lg" onClick={() => setShowCreateTopic(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Topic
                </Button>
              </>
            }
          />

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics or subjects…"
              className="rounded-lg pl-9"
              aria-label="Search topics"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger className="w-[200px] rounded-lg">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setStateFilter(chip.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  stateFilter === chip.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {topics.length === 0 ? (
          <EmptyState
            className="min-h-[50vh]"
            icon="📚"
            title="No topics yet"
            description="Create a subject first, then add topics to start your spaced repetition journey."
            primaryAction={
              <Button onClick={() => setShowCreateSubject(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create subject
              </Button>
            }
          />
        ) : filteredTopics.length === 0 ? (
          <EmptyState
            className="min-h-[40vh]"
            title="No matches"
            description="Try another filter or search term."
            primaryAction={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStateFilter('all');
                  setFilterSubjectId('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {displayTopics.map((topic) => {
              const subj = subjects.find((s) => s.id === topic.subjectId);
              return <TopicRow key={topic.id} topic={topic} subject={subj} />;
            })}
          </div>
        )}
      </PageShell>

      {showCreateTopic && <CreateTopicModal onClose={() => setShowCreateTopic(false)} />}
      {showCreateSubject && <CreateSubjectModal onClose={() => setShowCreateSubject(false)} />}
    </>
  );
}
