"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import {
  ClipboardList,
  Loader2,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";

interface NewQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after setup, passes all context for AI quiz generation */
  onCreated: (context: {
    subjectName?: string;
    topicName?: string;
    noteNames: string[];
    instructions?: string;
  }) => void;
}

export function NewQuizDialog({
  open,
  onOpenChange,
  onCreated,
}: NewQuizDialogProps) {
  const { user } = useAuth();
  const { subjects, topics, notes, fetchNotes } = useStore();

  // ── Subject / Topic selection ──
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const [topicSearch, setTopicSearch] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  // ── Notes multi-select ──
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(
    new Set(),
  );
  const [showNoteList, setShowNoteList] = useState(false);

  // ── Instructions ──
  const [instructions, setInstructions] = useState("");

  // ── Loading ──
  const [loading, setLoading] = useState(false);

  const subjectRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLDivElement>(null);

  // Fetch notes when dialog opens
  useEffect(() => {
    if (!open || !user) return;
    fetchNotes(user.id);
  }, [open, user, fetchNotes]);

  // Reset when dialog closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSubjectSearch("");
        setSelectedSubjectId(null);
        setTopicSearch("");
        setSelectedTopicId(null);
        setSelectedNoteIds(new Set());
        setInstructions("");
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node))
        setShowSubjectDropdown(false);
      if (topicRef.current && !topicRef.current.contains(e.target as Node))
        setShowTopicDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered data ──
  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [subjects, subjectSearch]);

  const filteredTopics = useMemo(() => {
    let list = topics;
    if (selectedSubjectId) {
      list = list.filter((t) => t.subjectId === selectedSubjectId);
    }
    const q = topicSearch.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    return list;
  }, [topics, selectedSubjectId, topicSearch]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  // Toggle note selection
  const toggleNote = useCallback((id: string) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const noteNames = notes
      .filter((n) => selectedNoteIds.has(n.id))
      .map((n) => n.title);

    handleOpenChange(false);

    onCreated({
      subjectName: selectedSubject?.name,
      topicName: selectedTopic?.title,
      noteNames,
      instructions: instructions.trim() || undefined,
    });
  }, [
    notes,
    selectedNoteIds,
    selectedSubject,
    selectedTopic,
    instructions,
    handleOpenChange,
    onCreated,
  ]);

  const hasSelection =
    selectedSubjectId !== null ||
    selectedTopicId !== null ||
    selectedNoteIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            New Quiz Set
          </DialogTitle>
          <DialogDescription>
            Choose a subject, topic, and notes for the AI to base the quiz on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Subject Picker ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Subject{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <div ref={subjectRef} className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={subjectSearch}
                  onChange={(e) => {
                    setSubjectSearch(e.target.value);
                    if (!e.target.value.trim()) setSelectedSubjectId(null);
                    setShowSubjectDropdown(true);
                  }}
                  onFocus={() => setShowSubjectDropdown(true)}
                  placeholder="Search subjects..."
                  className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {showSubjectDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => {
                      const isSelected = subject.id === selectedSubjectId;
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubjectId(
                              isSelected ? null : subject.id,
                            );
                            setSubjectSearch(isSelected ? "" : subject.name);
                            setShowSubjectDropdown(false);
                            if (!isSelected) setSelectedTopicId(null);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                            isSelected && "bg-accent",
                          )}
                        >
                          <SubjectIcon name={subject.icon} size={14} />
                          <span className="flex-1 text-foreground">
                            {subject.name}
                          </span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      No subjects found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Topic Picker ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Topic{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <div ref={topicRef} className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={topicSearch}
                  onChange={(e) => {
                    setTopicSearch(e.target.value);
                    if (!e.target.value.trim()) setSelectedTopicId(null);
                    setShowTopicDropdown(true);
                  }}
                  onFocus={() => setShowTopicDropdown(true)}
                  placeholder={
                    selectedSubjectId
                      ? "Search topics in this subject..."
                      : "Select a subject first or search all topics..."
                  }
                  className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {showTopicDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
                  {filteredTopics.length > 0 ? (
                    filteredTopics.map((topic) => {
                      const isSelected = topic.id === selectedTopicId;
                      const topicSubject = subjects.find(
                        (s) => s.id === topic.subjectId,
                      );
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            setSelectedTopicId(isSelected ? null : topic.id);
                            setTopicSearch(isSelected ? "" : topic.title);
                            setShowTopicDropdown(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                            isSelected && "bg-accent",
                          )}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                            {topicSubject && (
                              <SubjectIcon name={topicSubject.icon} size={12} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-foreground">
                              {topic.title}
                            </p>
                            {topicSubject && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {topicSubject.name}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      {selectedSubjectId
                        ? "No topics in this subject"
                        : "No topics found"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowNoteList(!showNoteList)}
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              Notes{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional, {selectedNoteIds.size} selected)
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  showNoteList && "rotate-180",
                )}
              />
            </button>
            {showNoteList && (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-background p-1">
                {notes.filter((n) => !n.deletedAt).length > 0 ? (
                  notes
                    .filter((n) => !n.deletedAt)
                    .map((n) => {
                      const isSelected = selectedNoteIds.has(n.id);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => toggleNote(n.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                            isSelected && "bg-accent",
                          )}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-foreground">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {n.content?.slice(0, 80) || "No content"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No notes yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Instructions ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Instructions for the AI{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus on advanced topics, include real-world examples, 10 questions..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!hasSelection || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate Quiz"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
