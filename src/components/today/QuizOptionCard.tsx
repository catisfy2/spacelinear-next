"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";

export function QuizOptionCard() {
  const router = useRouter();
  const { topics } = useStore();

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const dueCount = topics.filter(
    (t) => new Date(t.nextReviewDate) <= today && t.state !== "archived",
  ).length;

  return (
    <button
      type="button"
      onClick={() => router.push("/quiz/new?mode=today")}
      className="relative flex w-full flex-1 items-center justify-between overflow-clip rounded-[14px] bg-card px-[24px] py-[9px] shadow-[inset_0px_10px_13.6px_-14px_hsl(var(--primary)),inset_0px_-6px_32.2px_-14px_hsl(var(--primary))]"
    >
      <div className="size-[52px] shrink-0 overflow-clip rounded-[8px] bg-muted">
        <img
          alt=""
          src="/assets/today/quiz.png"
          className="size-full object-cover"
        />
      </div>
      <div className="flex items-center gap-[21px]">
        <div className="text-right">
          <p className="text-[18px] font-medium text-foreground">
            Take a Quiz
          </p>
          {dueCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {dueCount} topic{dueCount > 1 ? "s" : ""} due
            </p>
          )}
        </div>
        <ChevronRight className="size-[18px] shrink-0 text-foreground" />
      </div>
    </button>
  );
}
