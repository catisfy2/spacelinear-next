"use client";

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { formatNextReview, STATE_CONFIG, DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from '@/lib/constants';
import type { Topic, TopicState, Subject } from '@/lib/types';
import { Plus, ChevronRight, Flame, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateTopicModal } from '@/components/topics/CreateTopicModal';
import { CreateSubjectModal } from '@/components/subjects/CreateSubjectModal';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopicActionsMenu } from '@/components/topics/TopicActionsMenu';

const STATE_ORDER: TopicState[] = ['relearning', 'learning', 'new', 'reviewing'];

function StatusGroup({ state, topics, subjects }: {
  state: TopicState;
  topics: Topic[];
  subjects: Subject[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const config = STATE_CONFIG[state];

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm bg-muted text-muted-foreground hover:bg-accent/50 transition-colors">

        <motion.span
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.span>
        <span className="opacity-60">
          {config.icon}
        </span>
        <span className="font-normal text-xs font-sans">
          {config.label}
        </span>
        <span className="text-xs font-mono ml-1">
          {topics.length}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && topics.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {topics.map((topic) => {
              const subject = subjects.find((s) => s.id === topic.subjectId);
              return (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-accent/50 transition-colors pl-10 group">

                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', `bg-${config.color}`)} />
                  <Link
                    href={`/topics/${topic.id}`}
                    className="flex-1 truncate text-base text-foreground font-normal text-left hover:text-primary transition-colors">
                    {topic.title}
                  </Link>
                  {subject &&
                    <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <span>{subject.icon}</span>
                      <span>{subject.name}</span>
                    </span>
                  }
                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                    {formatNextReview(topic.nextReviewDate)}
                  </span>
                  {topic.streak > 2 &&
                    <span className="flex items-center gap-0.5 text-xs text-sl-hard flex-shrink-0">
                      <Flame className="w-3 h-3" />{topic.streak}
                    </span>
                  }
                  <div className="opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <TopicActionsMenu topicId={topic.id} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>);

}

export function TopicsPage() {
  const { topics, subjects } = useStore();
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const searchParams = useSearchParams();
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'backlog'>('all');

  // Open create subject modal from sidebar link
  useEffect(() => {
    if (searchParams.get('create-subject') === 'true') {
      setShowCreateSubject(true);
    }
  }, [searchParams]);

  const filteredTopics = useMemo(() => {
    let result = topics;
    if (filterSubjectId) {
      result = result.filter((t) => t.subjectId === filterSubjectId);
    }
    if (activeTab === 'active') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      result = result.filter((t) => new Date(t.nextReviewDate) <= sevenDaysFromNow);
    } else if (activeTab === 'backlog') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      result = result.filter((t) => new Date(t.nextReviewDate) > thirtyDaysFromNow);
    }
    return result;
  }, [topics, filterSubjectId, activeTab]);

  const groupedTopics = useMemo(() => {
    const groups: Record<TopicState, Topic[]> = { relearning: [], learning: [], new: [], reviewing: [] };
    filteredTopics.forEach((t) => {
      if (groups[t.state]) groups[t.state].push(t);
    });
    return groups;
  }, [filteredTopics]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-foreground">All Topics</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateSubject(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">

                <Plus className="w-3.5 h-3.5" /> Subject
              </button>
              <button
                onClick={() => setShowCreateTopic(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">

                <Plus className="w-3.5 h-3.5" /> Topic
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-3">
            {(['all', 'active', 'backlog'] as const).map((tab) =>
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors capitalize',
                activeTab === tab ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>

                {tab}
              </button>
            )}
          </div>

          {/* Filters */}
          {filterSubjectId &&
          <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Filter:</span>
              <button
              onClick={() => setFilterSubjectId(null)}
              className="flex items-center gap-1 text-xs bg-accent px-2 py-1 rounded text-foreground">

                {subjects.find((s) => s.id === filterSubjectId)?.name}
                <X className="w-3 h-3" />
              </button>
            </div>
          }
        </div>

        {/* Board */}
        <div className="flex-1 overflow-y-auto border-t border-border">
          {topics.length === 0 ?
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
              <div className="text-4xl">📚</div>
              <h2 className="text-lg font-medium text-foreground">No topics yet</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create a subject first, then add topics to start your spaced repetition journey.
              </p>
              <button
              onClick={() => setShowCreateSubject(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">

                <Plus className="w-4 h-4" /> Create Subject
              </button>
            </div> :

          STATE_ORDER.map((state) =>
            <StatusGroup
              key={state}
              state={state}
              topics={groupedTopics[state]}
              subjects={subjects}
            />
          )
          }
        </div>
      </div>

      <AnimatePresence>
        {showCreateTopic && <CreateTopicModal onClose={() => setShowCreateTopic(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateSubject && <CreateSubjectModal onClose={() => setShowCreateSubject(false)} />}
      </AnimatePresence>
    </div>);

}