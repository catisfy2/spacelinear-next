"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Topic, Subject } from "@/lib/types";

function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

export function StudyTopicsCard({
  topics,
  subjects,
  onExpand,
}: {
  topics: Topic[];
  subjects: Subject[];
  onExpand?: () => void;
}) {
  const displayTopics = useMemo(() => {
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
      .slice(0, 3);
  }, [topics]);

  if (displayTopics.length === 0) return null;

  return (
    <div className="flex w-[354px] shrink-0 flex-col gap-[17px] overflow-clip rounded-[24px] bg-gradient-to-b from-[#f6f3ea] to-[#f5e7b9] px-[22px] py-[12px] dark:from-[#1c1a16] dark:to-[#221e12]">
      <div className="flex items-end justify-between">
        <p className="text-[12px] font-medium text-[#383838] dark:text-foreground">
          Today&rsquo;s study
        </p>
        <button
          type="button"
          onClick={onExpand}
          className="relative block size-[16px] shrink-0"
          aria-label="Expand to see all study topics"
        >
          <div className="absolute inset-[-6.25%]">
            <img alt="" className="block size-full max-w-none" src="/assets/today/expand-icon.svg" />
          </div>
        </button>
      </div>
      <div className="flex flex-col gap-[8px]">
        {displayTopics.map((topic) => {
          const subject = subjects.find((s) => s.id === topic.subjectId);
          return (
            <div
              key={topic.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-[8px]">
                <span
                  className={cn(
                    "size-[10px] shrink-0 rounded-full",
                    bulletColor(topic),
                  )}
                  aria-hidden
                />
                <p className="text-[16px] font-medium text-foreground">
                  {topic.title}
                </p>
              </div>
              {subject && (
                <p className="shrink-0 text-[11px] font-medium text-secondary-foreground">
                  {subject.name}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Link
        href="/topics"
        className="flex w-[310px] items-center justify-center gap-[8px] opacity-80"
      >
        <p className="text-[12px] font-normal text-foreground">See more</p>
        <div className="relative h-[4px] w-[9px] shrink-0">
          <div className="absolute inset-[-12.5%_-5.56%]">
            <img alt="" className="block size-full max-w-none" src="/assets/today/chevron-icon-down.svg" />
          </div>
        </div>
      </Link>
    </div>
  );
}
