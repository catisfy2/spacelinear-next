"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function QuizOptionCard() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/quiz")}
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
        <p className="text-[18px] font-medium text-foreground">
          Take a Quiz
        </p>
        <ChevronRight className="size-[18px] shrink-0 text-foreground" />
      </div>
    </button>
  );
}
