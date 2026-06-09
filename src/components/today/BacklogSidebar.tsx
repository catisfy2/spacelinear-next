"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Topic, Subject } from "@/lib/types";
import { DraggableTopicItem } from "./DraggableTopicItem";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";

// ── Group topics by subject for display ────────────────────────────────

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

// ── Backlog sidebar ─────────────────────────────────────────────────────

interface BacklogSidebarProps {
  topics: Topic[];
  subjects: Subject[];
}

const COLLAPSE_DELAY_MS = 300;
const TRIGGER_HIT_ZONE_WIDTH = 6; // px

export function BacklogSidebar({ topics, subjects }: BacklogSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── droppable on the sidebar itself (for returning topics) ──
  const { isOver, setNodeRef } = useDroppable({
    id: "backlog-zone",
    data: { accepts: "new" },
  });

  // Clear any pending collapse timer
  const clearCollapseTimer = useCallback(() => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
  }, []);

  // Trigger open when mouse nears the right edge
  const handleTriggerEnter = useCallback(() => {
    clearCollapseTimer();
    setIsOpen(true);
  }, [clearCollapseTimer]);

  // Start collapse when mouse leaves the sidebar
  const handleSidebarLeave = useCallback(() => {
    clearCollapseTimer();
    collapseTimer.current = setTimeout(() => {
      setIsOpen(false);
    }, COLLAPSE_DELAY_MS);
  }, [clearCollapseTimer]);

  // Cancel collapse when mouse re-enters sidebar
  const handleSidebarEnter = useCallback(() => {
    clearCollapseTimer();
  }, [clearCollapseTimer]);

  // Filter to only backlog-state topics
  const backlogTopics = useMemo(
    () => topics.filter((t) => t.state === "backlog"),
    [topics],
  );

  const groups = useMemo(
    () => groupBySubject(backlogTopics, subjects),
    [backlogTopics, subjects],
  );

  return (
    <>
      {/* Invisible hit zone at the right edge of the viewport */}
      <div
        className="fixed right-0 top-0 z-50 h-full"
        style={{ width: TRIGGER_HIT_ZONE_WIDTH }}
        onMouseEnter={handleTriggerEnter}
        aria-hidden
      />

      {/* The sidebar panel — also a drop zone */}
      <aside
        ref={setNodeRef}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-sidebar shadow-xl transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          isOver && "ring-2 ring-dashed ring-primary/40",
        )}
        style={{ width: 280 }}
        aria-label="Backlog"
        role="complementary"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Backlog</h2>
            <p className="text-xs text-muted-foreground">
              {backlogTopics.length} topic
              {backlogTopics.length !== 1 ? "s" : ""}
            </p>
          </div>
          {/* Drag hint */}
          <span className="text-[11px] text-muted-foreground/50">
            Drag to schedule
          </span>
        </div>

        {/* Topic list */}
        {backlogTopics.length > 0 ? (
          <ScrollArea className="flex-1 px-2 py-2">
            {groups.map(({ subject, topics: groupTopics }) => (
              <div key={subject.id} className="mb-3 last:mb-0">
                <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                  <SubjectIcon name={subject.icon} size={12} /> {subject.name}
                </p>
                <div className="space-y-0.5">
                  {groupTopics.map((topic) => (
                    <DraggableTopicItem
                      key={topic.id}
                      topic={topic}
                      subject={subject}
                    />
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            <p>No topics in backlog. Create a new topic to get started.</p>
          </div>
        )}

        {/* Drop indicator when dragging a "new" topic over */}
        {isOver && (
          <div className="flex items-center justify-center border-t border-border py-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              Drop to move back to backlog
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
