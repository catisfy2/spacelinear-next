"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PageShell } from "@/components/app/PageShell";
import { cn } from "@/lib/utils";
import {
  TodayTab,
  HistoryTab,
  InsightsTab,
} from "@/components/today";

type Tab = "today" | "history" | "insights";

const TABS: { key: Tab; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "history", label: "History" },
  { key: "insights", label: "Insights" },
];

function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex items-center rounded-[16px] bg-white dark:bg-card">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={cn(
            "rounded-[16px] px-[16px] py-[6px] text-[12px] font-normal transition-colors",
            activeTab === tab.key
              ? "bg-accent text-foreground"
              : "text-muted-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TodayPage() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  const tabIndex = TABS.findIndex((t) => t.key === activeTab);

  const handleTabChange = useCallback(
    (direction: "prev" | "next") => {
      const idx = direction === "next" ? tabIndex + 1 : tabIndex - 1;
      if (idx >= 0 && idx < TABS.length) {
        setActiveTab(TABS[idx].key);
      }
    },
    [tabIndex],
  );

  // Keyboard: Ctrl+Shift+Left/Right
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          handleTabChange("next");
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          handleTabChange("prev");
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleTabChange]);

  // Two-finger swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartX.current = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchStartTime.current = Date.now();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length === 2) {
        const endX =
          (e.changedTouches[0].clientX + e.changedTouches[1].clientX) / 2;
        const deltaX = endX - touchStartX.current;
        const elapsed = Date.now() - touchStartTime.current;
        if (elapsed < 300 && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            handleTabChange("prev");
          } else {
            handleTabChange("next");
          }
        }
      }
    },
    [handleTabChange],
  );

  return (
    <PageShell
      maxWidth="narrow"
      className="relative flex min-h-full flex-col pb-12"
    >
      <div className="absolute inset-x-0 top-3 flex justify-center">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div
          ref={contentRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex w-full flex-col items-center gap-[20px] pt-[40px]"
        >
          {activeTab === "today" && <TodayTab />}
          {activeTab === "history" && <HistoryTab />}
          {activeTab === "insights" && <InsightsTab />}
        </div>
      </div>
    </PageShell>
  );
}
