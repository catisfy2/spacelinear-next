"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useStore } from "@/store/useStore";
import type { Topic } from "@/lib/types";

function getTargetDate(topics: Topic[]): string {
  const activeTopics = topics.filter(
    (t) => t.state !== "archived" && t.state !== "backlog",
  );
  if (activeTopics.length === 0) return "\u2014";
  const sorted = [...activeTopics].sort(
    (a, b) =>
      new Date(a.nextReviewDate).getTime() -
      new Date(b.nextReviewDate).getTime(),
  );
  return format(new Date(sorted[0].nextReviewDate), "d MMM");
}

export function SubjectsListView() {
  const { subjects, topics } = useStore();

  const subjectStats = useMemo(() => {
    return subjects.map((subject) => {
      const subTopics = topics.filter((t) => t.subjectId === subject.id);
      const totalCount = subTopics.length;
      const reviewed = subTopics.filter((t) => t.totalReviews > 0);
      const mastery =
        reviewed.length > 0
          ? Math.round(
              reviewed.reduce(
                (sum, t) => sum + (t.correctReviews / t.totalReviews) * 100,
                0,
              ) / reviewed.length,
            )
          : 0;
      const targetDate = getTargetDate(subTopics);
      return { subject, totalCount, mastery, targetDate };
    });
  }, [subjects, topics]);

  if (subjectStats.length === 0) {
    return (
      <div className="flex items-center justify-center w-full py-12 text-muted-foreground text-sm">
        No subjects yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[6px] items-start w-full">
      <div className="flex h-[40px] items-center justify-between overflow-clip px-[22px] py-[6px] w-full">
        <div className="flex gap-[10px] items-center py-px shrink-0">
          <div className="w-[33px] h-[18px] shrink-0" />
          <span className="font-medium text-[14px] text-foreground whitespace-nowrap">
            Subject Name
          </span>
        </div>
        <div className="flex items-center gap-[38px] shrink-0">
          <span className="font-medium text-[14px] text-foreground whitespace-nowrap w-[60px] text-center">
            Progress
          </span>
          <span className="font-medium text-[14px] text-foreground whitespace-nowrap w-[60px] text-center">
            Topics
          </span>
          <span className="font-medium text-[14px] text-foreground whitespace-nowrap w-[68px] text-center">
            Target Date
          </span>
        </div>
      </div>

      {subjectStats.map(({ subject, totalCount, mastery, targetDate }) => (
        <Link
          key={subject.id}
          href={`/subjects/${subject.id}`}
          className="flex h-[40px] items-center justify-between overflow-clip px-[22px] py-[6px] w-full rounded-[14px] transition-colors hover:bg-sl-surface-hover"
        >
          <div className="flex gap-[10px] items-center py-px shrink-0">
            <div className="w-[33px] h-[28px] flex items-center justify-center shrink-0 text-[20px]">
              {subject.icon}
            </div>
            <span className="font-medium text-[18px] text-card-foreground whitespace-nowrap">
              {subject.name}
            </span>
          </div>
          <div className="flex items-center justify-between w-[247px] shrink-0">
            <span className="font-medium text-[16px] text-card-foreground text-center w-[60px]">
              {mastery}%
            </span>
            <span className="font-medium text-[16px] text-card-foreground text-center w-[60px]">
              {totalCount}
            </span>
            <span className="font-medium text-[16px] text-card-foreground text-center w-[68px]">
              {targetDate}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
