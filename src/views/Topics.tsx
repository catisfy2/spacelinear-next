"use client";

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
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
import { SubjectsListView } from "@/components/topics/SubjectsListView";

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
  const { topics, subjects, scheduleTopicForToday, archiveTopic, unarchiveTopic } = useStore();

  const [viewMode, setViewMode] = useState<ToggleMode>("topics");
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

  const handleToggleChange = useCallback((mode: ToggleMode) => {
    setViewMode(mode);
    setSelectedTopicIds(new Set());
  }, []);

  const handlePillChange = useCallback((pill: PillMode) => {
    setActivePill(pill);
    setSelectedTopicIds(new Set());
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

  const isHiddenFromDateAndState = useCallback(
    (t: Topic) => (t.planId && t.state === "backlog") || t.state === "archived",
    [],
  );

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, Topic[]>();

    if (activePill === "archived") {
      for (const topic of sortedTopics) {
        if (topic.state !== "archived") continue;
        const label = "Archived";
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(topic);
      }
      return groups;
    }

    if (activePill === "date") {
      for (const topic of sortedTopics) {
        if (isHiddenFromDateAndState(topic)) continue;
        const label = getDateLabel(topic.nextReviewDate);
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(topic);
      }
      return groups;
    }

    if (activePill === "subject") {
      for (const topic of sortedTopics) {
        if (topic.state === "archived") continue;
        const subject = subjectMap.get(topic.subjectId);
        const label = subject?.name ?? "Unknown";
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label)!.push(topic);
      }
      return groups;
    }

    if (activePill === "state") {
      for (const topic of sortedTopics) {
        if (isHiddenFromDateAndState(topic)) continue;
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
  }, [sortedTopics, activePill, subjectMap, isHiddenFromDateAndState]);

  const selectedTopicObjs = useMemo(
    () => topics.filter((t) => selectedTopicIds.has(t.id)),
    [topics, selectedTopicIds],
  );

  const allSelectedArchived = useMemo(
    () =>
      selectedTopicObjs.length > 0 &&
      selectedTopicObjs.every((t) => t.state === "archived"),
    [selectedTopicObjs],
  );

  const handleBatchStudyToday = useCallback(async () => {
    for (const id of selectedTopicIds) {
      await scheduleTopicForToday(id);
    }
    setSelectedTopicIds(new Set());
  }, [selectedTopicIds, scheduleTopicForToday]);

  const handleBatchArchive = useCallback(async () => {
    for (const id of selectedTopicIds) {
      await archiveTopic(id);
    }
    setSelectedTopicIds(new Set());
  }, [selectedTopicIds, archiveTopic]);

  const handleBatchUnarchive = useCallback(async () => {
    for (const id of selectedTopicIds) {
      await unarchiveTopic(id);
    }
    setSelectedTopicIds(new Set());
  }, [selectedTopicIds, unarchiveTopic]);

  if (topics.length === 0 && viewMode === "topics") {
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
        <TopicsSubjectsToggle value={viewMode} onChange={handleToggleChange} />
      </div>

      <div className="flex flex-col gap-[32px] items-start w-[1246px] max-w-full">
        {viewMode === "subjects" ? (
          <>
            <div className="flex items-center justify-between w-full">
              <div className="bg-[rgba(206,126,79,0.4)] flex items-center justify-center px-[18px] py-[6px] rounded-[30px]">
                <span className="font-medium text-[#784121] text-[14px] whitespace-nowrap">
                  All Subject
                </span>
              </div>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground">
                <path d="M4 7H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 13H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 19H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <SubjectsListView />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between w-full">
              <FilterPills value={activePill} onChange={handlePillChange} />

              {selectedTopicObjs.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-card-foreground/60">
                    {selectedTopicObjs.length} selected
                  </span>
                  {allSelectedArchived ? (
                    <button
                      type="button"
                      onClick={handleBatchUnarchive}
                      className="bg-primary flex items-center justify-center px-4 py-1.5 rounded-[31px] text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Unarchive
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleBatchStudyToday}
                        className="bg-primary flex items-center justify-center px-4 py-1.5 rounded-[31px] text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Study Today
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchArchive}
                        className="bg-muted flex items-center justify-center px-4 py-1.5 rounded-[31px] text-[13px] font-medium text-card-foreground/60 transition-opacity hover:opacity-90"
                      >
                        Archive
                      </button>
                    </>
                  )}
                </div>
              )}
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
          </>
        )}
      </div>

      {showCreateTopic && (
        <CreateWindow onClose={() => setShowCreateTopic(false)} />
      )}
    </div>
  );
}
