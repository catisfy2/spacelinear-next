"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { StudyModeButton } from "./StudyModeButton";
import { QuizButton } from "./QuizButton";
import { TopicListItem } from "./TopicListItem";
import { TopicSchedulerSidebar } from "./TopicSchedulerSidebar";
import { CreateWindow } from "@/components/topics/CreateWindow";

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

const DEFAULT_VISIBLE = 4;

export function TodayTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { topics, subjects } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);

  const dueTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics
      .filter((t) => {
        if (t.state === "backlog") return false;
        const d = new Date(t.nextReviewDate);
        d.setHours(0, 0, 0, 0);
        return d < tomorrow;
      })
      .sort((a, b) => {
        const order: Record<string, number> = {
          new: 0,
          relearn: 1,
          hard: 2,
          medium: 3,
          easy: 4,
        };
        const aOrder = order[a.currentDifficulty ?? "easy"] ?? 5;
        const bOrder = order[b.currentDifficulty ?? "easy"] ?? 5;
        if (a.state === "new" && b.state !== "new") return -1;
        if (a.state !== "new" && b.state === "new") return 1;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [topics]);

  const visibleTopics = useMemo(
    () => (expanded ? dueTopics : dueTopics.slice(0, DEFAULT_VISIBLE)),
    [dueTopics, expanded],
  );

  const hasMore = dueTopics.length > DEFAULT_VISIBLE;

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const handleExpand = useCallback(() => setExpanded(true), []);
  const handleCollapse = useCallback(() => setExpanded(false), []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-px">
      <div className="flex flex-col gap-[28px] items-center">
        <p className="text-[32px] font-medium text-primary">
          {greetingLabel()}, {displayName}!
        </p>

        <div className="flex gap-[15px] w-[490px]">
          <StudyModeButton />
          <QuizButton />
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          {visibleTopics.map((topic) => (
            <TopicListItem
              key={topic.id}
              topic={topic}
              subject={subjects.find((s) => s.id === topic.subjectId)}
            />
          ))}
        </div>

        <div className="flex flex-col items-center justify-center w-full">
          {hasMore && !expanded ? (
            <button
              type="button"
              onClick={handleExpand}
              className="flex items-center gap-[10px] px-[9px] py-[2px]"
            >
              <p className="text-[14px] font-medium text-foreground/70 whitespace-nowrap">
                Expand
              </p>
              <svg
                width="10"
                height="5"
                viewBox="0 0 10 5"
                fill="none"
                className="shrink-0 text-foreground/70"
              >
                <path
                  d="M1 1L5 4L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : expanded ? (
            <button
              type="button"
              onClick={handleCollapse}
              className="flex items-center gap-[10px] px-[9px] py-[2px]"
            >
              <p className="text-[14px] font-medium text-foreground/70 whitespace-nowrap">
                Show Less
              </p>
              <svg
                width="10"
                height="5"
                viewBox="0 0 10 5"
                fill="none"
                className="shrink-0 rotate-180 text-foreground/70"
              >
                <path
                  d="M1 1L5 4L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => router.push("/mochi")}
            className="px-[5px] py-[2px]"
          >
            <p className="text-[14px] font-medium text-primary/90 whitespace-nowrap">
              Chat With Mochi
            </p>
          </button>
          <div className="flex gap-[5px]">
            <button
              type="button"
              onClick={() => setShowScheduler(true)}
              className="px-[5px] py-[2px]"
            >
              <p className="text-[14px] font-medium text-primary/90 whitespace-nowrap">
                + Add Topic
              </p>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateTopic(true)}
              className="px-[5px] py-[2px]"
            >
              <p className="text-[14px] font-medium text-primary/90 whitespace-nowrap">
                + Create Topic
              </p>
            </button>
          </div>
        </div>
      </div>

      <TopicSchedulerSidebar
        open={showScheduler}
        onClose={() => setShowScheduler(false)}
        onCreateTopic={() => {
          setShowScheduler(false);
          setShowCreateTopic(true);
        }}
      />

      {showCreateTopic && (
        <CreateWindow onClose={() => setShowCreateTopic(false)} />
      )}
    </div>
  );
}
