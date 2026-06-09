"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { Search, Loader2, BrainCircuit, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";

interface NewTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after creation so the parent can send an AI quiz-generation message */
  onCreated: (topicTitle: string, subjectName: string) => void;
}

export function NewTopicDialog({
  open,
  onOpenChange,
  onCreated,
}: NewTopicDialogProps) {
  const { user } = useAuth();
  const { subjects, addTopic } = useStore();

  const [title, setTitle] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Reset when dialog opens/closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTitle("");
        setSubjectSearch("");
        setSelectedSubjectId(null);
        setShowDropdown(false);
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  // Filter subjects by search query
  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.name.toLowerCase().startsWith(q),
    );
  }, [subjects, subjectSearch]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectSubject = useCallback(
    (id: string, name: string) => {
      setSelectedSubjectId(id);
      setSubjectSearch(name);
      setShowDropdown(false);
    },
    [],
  );

  const handleSubjectInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSubjectSearch(val);
      // If the user clears the input, deselect the subject
      if (!val.trim()) {
        setSelectedSubjectId(null);
      }
      setShowDropdown(true);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!user || !title.trim() || !selectedSubjectId) return;

    setLoading(true);

    try {
      const topic = await addTopic(
        { title: title.trim(), subjectId: selectedSubjectId, tags: [] },
        user.id,
      );

      const subjectName = selectedSubject?.name ?? "Unknown";
      handleOpenChange(false);
      setLoading(false);

      // Notify parent to trigger AI quiz generation
      onCreated(topic.title, subjectName);
    } catch (err) {
      console.error("Failed to create topic:", err);
      setLoading(false);
    }
  }, [
    user,
    title,
    selectedSubjectId,
    selectedSubject,
    addTopic,
    handleOpenChange,
    onCreated,
  ]);

  const canSubmit = title.trim().length > 0 && selectedSubjectId !== null && !loading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            New Topic
          </DialogTitle>
          <DialogDescription>
            Add a topic under a specific subject. Quiz questions will be
            auto-generated after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Topic Title ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Topic Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neural Networks, Quantum Mechanics"
              autoFocus
            />
          </div>

          {/* ── Subject Picker ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Subject
            </label>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={subjectSearch}
                  onChange={handleSubjectInputChange}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search or select a subject..."
                  className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {showDropdown && filteredSubjects.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                  {filteredSubjects.map((subject) => {
                    const isSelected = subject.id === selectedSubjectId;
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() =>
                          handleSelectSubject(subject.id, subject.name)
                        }
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                          isSelected && "bg-accent",
                        )}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <SubjectIcon name={subject.icon} size={14} />
                        </div>
                        <span className="flex-1 text-foreground">
                          {subject.name}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {showDropdown && filteredSubjects.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-4 text-center text-sm text-muted-foreground">
                  No subjects found. Create a subject first.
                </div>
              )}
            </div>
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
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Topic"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
