"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function QuizButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/quiz/new?mode=today")}
      className="flex flex-1 items-center justify-center gap-[10px] overflow-clip rounded-[14px] px-[24px] py-[9px] self-stretch"
      style={{ border: "1.5px solid rgba(206, 126, 79, 0.58)" }}
    >
      <div className="relative shrink-0 size-[45px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            alt=""
            src="/assets/today/quiz.png"
            className="absolute left-[-24.34%] top-[-20.13%] size-[148.66%] max-w-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-[21px] shrink-0">
        <p className="text-[16px] font-medium text-foreground whitespace-nowrap">
          Take a Quiz
        </p>
        <ChevronRight className="size-[13px] shrink-0 text-foreground" />
      </div>
    </button>
  );
}
