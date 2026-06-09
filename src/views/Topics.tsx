"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import type { Topic } from "@/lib/types";
import { TopicRow } from "@/components/app/TopicRow";
import {
  TopicsSubjectsToggle,
  type ToggleMode,
} from "@/components/topics/ToggleSwitch";
import { FilterPills, type PillMode } from "@/components/topics/FilterPills";
import { SectionGroup } from "@/components/topics/SectionGroup";
import { CreateWindow } from "@/components/topics/CreateWindow";

const STATE_GROUP_ORDER = ["Learning", "Reviewing", "New & Backlog"];

const STATE_MAP: Record<string, string> = {
  learning: "Learning",
  relearning: "Learning",
  reviewing: "Reviewing",
  new: "New & Backlog",
  backlog: "New & Backlog",
};

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  return format(target, "d MMM");
}

export function TopicsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { topics, subjects, refreshAll } = useStore();

  // Refresh data on mount so agent-created items appear immediately
  useEffect(() => {
    if (user) refreshAll(user.id);
  }, [user, refreshAll]);

  const [activePill, setActivePill] = useState<PillMode>("date");
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(
    new Set(),
  );
  const [showCreateTopic, setShowCreateTopic] = useState(false);

  const toggleTopicSelection = useCallback((id: string) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleChange = useCallback(
    (mode: ToggleMode) => {
      if (mode === "subjects") {
        router.push("/subjects");
      }
    },
    [router],
  );

  const handlePillChange = useCallback((pill: PillMode) => {
    setActivePill(pill);
  }, []);

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const sortedTopics = useMemo(() => {
    const sorted = [...topics];
    sorted.sort(
      (a, b) =>
        new Date(a.nextReviewDate).getTime() -
        new Date(b.nextReviewDate).getTime(),
    );
    return sorted;
  }, [topics]);

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, Topic[]>();

    if (activePill === "date") {
      for (const topic of sortedTopics) {
        const label = getDateLabel(topic.nextReviewDate);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(topic);
      }
      return groups;
    }

    if (activePill === "subject") {
      for (const topic of sortedTopics) {
        const subject = subjectMap.get(topic.subjectId);
        const label = subject?.name ?? "Unknown";
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(topic);
      }
      return groups;
    }

    if (activePill === "state") {
      for (const topic of sortedTopics) {
        const label = STATE_MAP[topic.state] ?? "Other";
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(topic);
      }
      const ordered = new Map<string, Topic[]>();
      for (const key of STATE_GROUP_ORDER) {
        if (groups.has(key)) ordered.set(key, groups.get(key)!);
      }
      return ordered;
    }

    return groups;
  }, [sortedTopics, activePill, subjectMap]);

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center size-full min-h-[60vh]">
        <p className="text-[18px] font-medium text-foreground mb-[16px]">
          No topics yet
        </p>
        <button
          type="button"
          onClick={() => setShowCreateTopic(true)}
          className="flex items-center justify-center px-[24px] py-[10px] rounded-[33px] bg-primary text-background text-[16px] font-medium transition-colors hover:bg-primary/90"
        >
          Create Topic
        </button>
        {showCreateTopic && (
          <CreateWindow onClose={() => setShowCreateTopic(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[32px] items-center px-[22px] py-[16px] size-full bg-background">
      <div className="flex items-center p-[10px] w-full">
        <TopicsSubjectsToggle value="topics" onChange={handleToggleChange} />
      </div>

      <div className="flex flex-col gap-[32px] items-start w-[1246px] max-w-full">
        <div className="flex items-center justify-between w-full">
          <FilterPills value={activePill} onChange={handlePillChange} />
        </div>

        {[...groupedTopics.entries()].map(([groupLabel, topicList]) => (
          <SectionGroup key={groupLabel} label={groupLabel} defaultOpen={true}>
            {topicList.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                subject={subjectMap.get(topic.subjectId)}
                selected={selectedTopicIds.has(topic.id)}
                onToggle={toggleTopicSelection}
                showSubject={activePill !== "subject"}
                showDate={activePill === "subject"}
              />
            ))}
          </SectionGroup>
        ))}
      </div>

      {showCreateTopic && (
        <CreateWindow onClose={() => setShowCreateTopic(false)} />
      )}
    </div>
  );
}
