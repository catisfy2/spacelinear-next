"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Topic, Subject } from "@/lib/types";

function groupBySubject(
  topics: Topic[],
  subjects: Subject[],
): { subject: Subject; topics: Topic[] }[] {
  const groups = new Map<string, Topic[]>();
  for (const t of topics) {
    const list = groups.get(t.subjectId) ?? [];
    list.push(t);
    groups.set(t.subjectId, list);
  }
  return Array.from(groups.entries())
    .map(([subjectId, ts]) => ({
      subject: subjects.find((s) => s.id === subjectId) ?? {
        id: subjectId,
        name: "Uncategorized",
        color: "#888",
        icon: "📦",
        createdAt: "",
      },
      topics: ts,
    }))
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name));
}

export function TopicSchedulerSidebar({
  open,
  onClose,
  onCreateTopic,
}: {
  open: boolean;
  onClose: () => void;
  onCreateTopic?: () => void;
}) {
  const { topics, subjects, scheduleTopicForToday } = useStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  const unscheduledTopics = useMemo(
    () =>
      topics.filter(
        (t) => t.state === "backlog" || t.state === "new",
      ),
    [topics],
  );

  const groups = useMemo(
    () => groupBySubject(unscheduledTopics, subjects),
    [unscheduledTopics, subjects],
  );

  const handleStudyToday = useCallback(
    async (topicId: string) => {
      await scheduleTopicForToday(topicId);
    },
    [scheduleTopicForToday],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/20"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full min-h-0 flex-col border-l border-border bg-sidebar shadow-xl"
            style={{ width: 320 }}
            role="complementary"
            aria-label="Schedule a topic for today"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Add Topic
                </h2>
                <p className="text-xs text-muted-foreground">
                  {unscheduledTopics.length} topic
                  {unscheduledTopics.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="size-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="size-4 text-foreground" />
              </button>
            </div>

            {unscheduledTopics.length > 0 ? (
              <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
                {groups.map(({ subject, topics: groupTopics }) => (
                  <div key={subject.id} className="mb-3 last:mb-0">
                    <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                      {subject.icon} {subject.name}
                    </p>
                    <div className="space-y-0.5">
                      {groupTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex items-start justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {topic.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                              {subject.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStudyToday(topic.id)}
                            className="shrink-0 mt-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Study Today
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 min-h-0">
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    No topics available
                  </p>
                  {onCreateTopic && (
                    <button
                      type="button"
                      onClick={onCreateTopic}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Create Topic
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
