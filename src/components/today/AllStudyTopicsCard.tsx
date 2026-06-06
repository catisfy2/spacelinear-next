"use client";

import { useMemo, useCallback, forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ClipboardList, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyModeOverlay } from "@/components/study-mode";
import type { Topic, Subject } from "@/lib/types";

function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

export const AllStudyTopicsCard = forwardRef<
  HTMLDivElement,
  { topics: Topic[]; subjects: Subject[] }
>(function AllStudyTopicsCard({ topics, subjects }, ref) {
  const router = useRouter();

  const dueTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics.filter((t) => {
      if (t.state === "backlog") return false;
      const d = new Date(t.nextReviewDate);
      d.setHours(0, 0, 0, 0);
      return d < tomorrow;
    });
  }, [topics]);

  const [showStudyOverlay, setShowStudyOverlay] = useState(false);

  const handleStartStudy = useCallback(() => {
    setShowStudyOverlay(true);
  }, []);

  const handleQuizTest = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  return (
    <>
      {showStudyOverlay && (
        <StudyModeOverlay
          minutes={30}
          onClose={() => setShowStudyOverlay(false)}
        />
      )}
      <div
        ref={ref}
        className="flex w-full flex-col items-center justify-center px-[31px] py-[59px]"
      >
        <div className="flex w-full max-w-[816px] flex-col items-center gap-[19px]">
          <div className="flex w-full flex-col gap-[17px] overflow-clip rounded-[24px] bg-gradient-to-b from-[#f6f3ea] to-[#f5e7b9] px-[22px] py-[12px] dark:from-[#1c1a16] dark:to-[#221e12]">
            <div className="flex items-end justify-between">
              <p className="text-[14px] font-medium text-[#383838] dark:text-foreground">
                Today&rsquo;s study
              </p>
            </div>

            <div className="flex flex-col gap-[8px]">
              {dueTopics.length === 0 ? (
                <p className="text-[16px] font-medium text-[#535146] dark:text-secondary-foreground">
                  No topics added for today
                </p>
              ) : (
                dueTopics.map((topic) => {
                  const subject = subjects.find(
                    (s) => s.id === topic.subjectId,
                  );
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
                        <p className="text-[19px] font-medium text-[color:var(--color-foreground,#3d3929)] dark:text-foreground">
                          {topic.title}
                        </p>
                      </div>
                      {subject && (
                        <p className="shrink-0 text-[14px] font-medium text-[color:var(--color-secondary-foreground,#535146)] dark:text-secondary-foreground">
                          {subject.name}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <Link
              href="/topics"
              className="flex w-[310px] items-center justify-center gap-[8px] self-center opacity-80"
            >
              <p className="text-[12px] font-normal text-[color:var(--color-foreground,#3d3929)] dark:text-foreground">
                Go to topic page
              </p>
              <ChevronDown className="size-[9px] -rotate-90 text-foreground" />
            </Link>
          </div>

          <div className="flex w-full gap-[11px]">
            <button
              type="button"
              onClick={handleStartStudy}
              className="flex flex-1 items-center justify-center gap-[10px] rounded-[22px] bg-[#f6eed4] px-[48px] py-[10px] transition-colors hover:bg-[#e9ddb4]"
            >
              <Sparkles className="size-[14px] shrink-0 text-[color:var(--color-foreground,#3d3929)]" />
              <p className="whitespace-nowrap text-[18px] font-medium text-[color:var(--color-foreground,#3d3929)] dark:text-foreground">
                Start Study Mode
              </p>
            </button>
            <button
              type="button"
              onClick={handleQuizTest}
              className="flex flex-1 items-center justify-center gap-[10px] rounded-[22px] bg-[#e9ddb4] px-[48px] py-[10px] transition-colors hover:bg-[#d4c69a]"
            >
              <ClipboardList className="size-[12px] shrink-0 text-[color:var(--color-card-foreground,#141413)]" />
              <p className="whitespace-nowrap text-[18px] font-medium text-[color:var(--color-card-foreground,#141413)] dark:text-foreground">
                Take a Quiz Test
              </p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
