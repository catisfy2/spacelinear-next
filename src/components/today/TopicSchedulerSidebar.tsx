"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}: {
  open: boolean;
  onClose: () => void;
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
            className="fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-sidebar shadow-xl"
            style={{ width: 300 }}
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
              <ScrollArea className="flex-1 px-2 py-2">
                {groups.map(({ subject, topics: groupTopics }) => (
                  <div key={subject.id} className="mb-3 last:mb-0">
                    <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                      {subject.icon} {subject.name}
                    </p>
                    <div className="space-y-0.5">
                      {groupTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground truncate mr-2">
                            {topic.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleStudyToday(topic.id)}
                            className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            Study Today
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                <p>
                  No topics available. Create a new topic to get started.
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
