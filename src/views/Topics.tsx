"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ListFilter,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import type { Difficulty, Topic } from "@/lib/types";
import { TopicRow } from "@/components/app/TopicRow";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/app/EmptyState";

// ── Constants ────────────────────────────────────────────────────────────────

type ChipFilter = "all" | "due" | "backlog";

type SortOption = "due" | "reviewed" | "created" | "alpha";

const CHIPS: { id: ChipFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "due", label: "Due" },
  { id: "backlog", label: "Backlog" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "due", label: "Due date" },
  { id: "reviewed", label: "Recently reviewed" },
  { id: "created", label: "Recently created" },
  { id: "alpha", label: "A–Z" },
];

const DIFFICULTIES: Difficulty[] = ["relearn", "hard", "medium", "easy"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isDueTopic(topic: Topic): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(topic.nextReviewDate);
  d.setHours(0, 0, 0, 0);
  return d < tomorrow;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TopicsPage() {
  const { topics, subjects } = useStore();

  const [chipFilter, setChipFilter] = useState<ChipFilter>("all");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Set<Difficulty>
  >(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("due");

  const [learningOpen, setLearningOpen] = useState(true);
  const [backlogOpen, setBacklogOpen] = useState(false);

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Filtering & Sorting ───────────────────────────────────────────────────

  const filteredTopics = useMemo(() => {
    let result = [...topics];

    if (chipFilter === "due") {
      result = result.filter(isDueTopic);
    } else if (chipFilter === "backlog") {
      result = result.filter((t) => t.state === "backlog" || t.state === "new");
    }

    if (selectedSubjectIds.size > 0) {
      result = result.filter((t) => selectedSubjectIds.has(t.subjectId));
    }

    if (selectedDifficulties.size > 0) {
      result = result.filter(
        (t) =>
          t.currentDifficulty && selectedDifficulties.has(t.currentDifficulty),
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "due":
          return (
            new Date(a.nextReviewDate).getTime() -
            new Date(b.nextReviewDate).getTime()
          );
        case "reviewed":
          return (
            new Date(b.lastReviewedAt ?? b.createdAt).getTime() -
            new Date(a.lastReviewedAt ?? a.createdAt).getTime()
          );
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "alpha":
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [topics, chipFilter, selectedSubjectIds, selectedDifficulties, sortBy]);

  // ── Grouping ──────────────────────────────────────────────────────────────

  const { learningTopics, backlogTopics } = useMemo(() => {
    const learning: Topic[] = [];
    const backlog: Topic[] = [];
    for (const t of filteredTopics) {
      if (t.state === "backlog" || t.state === "new") {
        backlog.push(t);
      } else {
        learning.push(t);
      }
    }
    return { learningTopics: learning, backlogTopics: backlog };
  }, [filteredTopics]);

  // ── Filter Toggles ────────────────────────────────────────────────────────

  const toggleSubject = useCallback((id: string) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDifficulty = useCallback((d: Difficulty) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }, []);

  const toggleTopicSelection = useCallback((id: string) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const activeFilterCount =
    (chipFilter !== "all" ? 1 : 0) +
    selectedSubjectIds.size +
    selectedDifficulties.size;

  // ── Render helpers ────────────────────────────────────────────────────────

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const renderTopics = (topicList: Topic[]) =>
    topicList.map((topic) => (
      <TopicRow
        key={topic.id}
        topic={topic}
        subject={subjectMap.get(topic.subjectId)}
        selected={selectedTopicIds.has(topic.id)}
        onToggle={toggleTopicSelection}
      />
    ));

  // ── Empty state ───────────────────────────────────────────────────────────

  if (topics.length === 0) {
    return (
      <div className="flex items-center justify-center size-full p-6">
        <EmptyState
          icon={"📚"}
          title="No topics yet"
          description="Create a subject and add topics to start your spaced repetition journey."
          className="min-h-[50vh]"
        />
      </div>
    );
  }

  if (filteredTopics.length === 0) {
    return (
      <div className="flex flex-col gap-[4px] items-center px-[22px] py-[16px] size-full bg-background">
        <div className="flex items-center p-[10px] w-full">
          <div className="flex items-center gap-[10px]">
            <h1 className="font-normal text-[22px] text-foreground">Topics</h1>
            <ChevronRight className="h-[12px] w-[6px] text-muted-foreground" />
          </div>
        </div>
        <EmptyState
          title="No matches"
          description="Try a different filter or check back later."
          className="min-h-[40vh]"
          primaryAction={
            <button
              type="button"
              onClick={() => {
                setChipFilter("all");
                setSelectedSubjectIds(new Set());
                setSelectedDifficulties(new Set());
              }}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear all filters
            </button>
          }
        />
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-[4px] items-center px-[22px] py-[16px] size-full bg-background">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="flex items-center p-[10px] w-full">
        <div className="flex items-center gap-[10px]">
          <h1 className="font-normal text-[22px] text-foreground">Topics</h1>
          <ChevronRight className="h-[12px] w-[6px] text-muted-foreground" />
        </div>
      </div>

      {/* ── Main Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-[32px] items-start w-full">
        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-[16px]">
            <div className="flex items-center gap-[12px]">
              {CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setChipFilter(chip.id)}
                  className={cn(
                    "flex items-center justify-center px-[18px] py-[6px] rounded-full text-[12px] font-medium transition-colors bg-muted",
                    chipFilter === chip.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted-foreground/10",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* More filter options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center size-[18px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SlidersHorizontal className="size-full" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                {DIFFICULTIES.map((d) => (
                  <DropdownMenuCheckboxItem
                    key={d}
                    checked={selectedDifficulties.has(d)}
                    onCheckedChange={() => toggleDifficulty(d)}
                  >
                    {DIFFICULTY_CONFIG[d].label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.id}
                    checked={sortBy === opt.id}
                    onCheckedChange={() => setSortBy(opt.id)}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-[16px]">
            {/* Subject multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-[10px] bg-muted px-[18px] py-[6px] rounded-full text-[12px] font-medium transition-colors hover:bg-muted-foreground/10",
                    selectedSubjectIds.size > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {selectedSubjectIds.size > 0
                    ? `${selectedSubjectIds.size} subject${selectedSubjectIds.size > 1 ? "s" : ""}`
                    : "Select Subject"}
                  <ChevronDown className="h-[6px] w-[12px]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <Command>
                  <CommandGroup>
                    {subjects.map((subject) => (
                      <CommandItem
                        key={subject.id}
                        onSelect={() => toggleSubject(subject.id)}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={selectedSubjectIds.has(subject.id)}
                          className="size-4"
                        />
                        <span>
                          {subject.icon} {subject.name}
                        </span>
                      </CommandItem>
                    ))}
                    {subjects.length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No subjects yet
                      </div>
                    )}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Filter button */}
            <button
              type="button"
              className={cn(
                "relative flex items-center justify-center size-[26px] transition-colors",
                activeFilterCount > 0
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={
                activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active`
                  : "No active filters"
              }
            >
              <ListFilter className="size-full" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-primary text-[10px] text-primary-foreground font-medium leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Learning Section */}
        <Collapsible
          open={learningOpen}
          onOpenChange={setLearningOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-[20px] py-[8px] bg-muted rounded-[22px] transition-colors hover:bg-muted/80"
            >
              <span className="font-medium text-[14px] text-foreground">
                Learning
              </span>
              <ChevronDown
                className={cn(
                  "h-[14px] w-[14px] text-muted-foreground transition-transform",
                  learningOpen ? "" : "-rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full">
            <div className="flex flex-col gap-[6px] items-start w-full pt-1">
              {learningTopics.length > 0 ? (
                renderTopics(learningTopics)
              ) : (
                <div className="w-full px-[14px] py-[24px] text-center text-sm text-muted-foreground">
                  No topics currently learning
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Backlog Section */}
        <Collapsible
          open={backlogOpen}
          onOpenChange={setBacklogOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-[20px] py-[8px] bg-muted rounded-[22px] transition-colors hover:bg-muted/80"
            >
              <span className="font-medium text-[14px] text-foreground">
                Backlog
              </span>
              <ChevronDown
                className={cn(
                  "h-[14px] w-[14px] text-muted-foreground transition-transform",
                  backlogOpen ? "" : "-rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="w-full">
            <div className="flex flex-col gap-[6px] items-start w-full pt-1">
              {backlogTopics.length > 0 ? (
                renderTopics(backlogTopics)
              ) : (
                <div className="w-full px-[14px] py-[24px] text-center text-sm text-muted-foreground">
                  No topics in backlog
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ── Scroll to top ────────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label="Scroll to top"
        title="Scroll to top"
        className="fixed bottom-6 right-6 flex items-center justify-center size-[24px] rounded-full bg-muted text-muted-foreground shadow-md hover:bg-accent hover:text-foreground transition-colors z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ChevronUp className="size-full" />
      </button>
    </div>
  );
}
