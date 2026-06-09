"use client";

import { useState, useCallback } from "react";
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
import { IconPicker } from "@/components/subjects/IconPicker";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { DEFAULT_SUBJECT_ICON } from "@/lib/subject-icons";

interface NewSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after creation so the parent can send an AI quiz-generation message */
  onCreated: (subjectName: string, topicTitles: string[]) => void;
}

export function NewSubjectDialog({
  open,
  onOpenChange,
  onCreated,
}: NewSubjectDialogProps) {
  const { user } = useAuth();
  const { addSubject, addTopic } = useStore();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_SUBJECT_ICON);
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "creating" | "done">("form");

  // Reset state when dialog opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Reset after close
        setName("");
        setIcon(DEFAULT_SUBJECT_ICON);
        setTopics([]);
        setNewTopic("");
        setStep("form");
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const addTopicItem = useCallback(() => {
    const trimmed = newTopic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics((prev) => [...prev, trimmed]);
    }
    setNewTopic("");
  }, [newTopic, topics]);

  const removeTopic = useCallback((title: string) => {
    setTopics((prev) => prev.filter((t) => t !== title));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTopicItem();
      }
    },
    [addTopicItem],
  );

  const handleSubmit = useCallback(async () => {
    if (!user || !name.trim()) return;

    setLoading(true);
    setStep("creating");

    try {
      // 1. Create subject
      const subject = await addSubject(
        { name: name.trim(), icon, color: undefined },
        user.id,
      );

      // 2. Create each topic (sequentially to avoid race conditions)
      const topicTitles: string[] = [];
      for (const title of topics) {
        try {
          await addTopic({ title, subjectId: subject.id, tags: [] }, user.id);
          topicTitles.push(title);
        } catch (err) {
          console.error("Failed to create topic:", title, err);
        }
      }

      setStep("done");
      setLoading(false);
      handleOpenChange(false);

      // 3. Notify parent to trigger AI quiz generation
      onCreated(name.trim(), topicTitles);
    } catch (err) {
      console.error("Failed to create subject:", err);
      setLoading(false);
      setStep("form");
    }
  }, [
    user,
    name,
    icon,
    topics,
    addSubject,
    addTopic,
    handleOpenChange,
    onCreated,
  ]);

  const canSubmit = name.trim().length > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            New Subject
          </DialogTitle>
          <DialogDescription>
            Create a new subject and optionally add topics to it. Quiz questions
            will be auto-generated after creation.
          </DialogDescription>
        </DialogHeader>

        {step === "creating" ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Creating subject &amp; generating quizzes…
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── Subject Name ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Subject Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Machine Learning, Physics, Spanish"
                autoFocus
              />
            </div>

            {/* ── Icon Picker ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Icon
              </label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <SubjectIcon name={icon} size={20} />
                </div>
                <div className="flex-1">
                  <IconPicker value={icon} onChange={setIcon} />
                </div>
              </div>
            </div>

            {/* ── Topics ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Topics{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>

              {/* Add topic input */}
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a topic, e.g. Neural Networks"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addTopicItem}
                  disabled={!newTopic.trim()}
                  aria-label="Add topic"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Topic tags */}
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {topics.map((title) => (
                    <span
                      key={title}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {title}
                      <button
                        type="button"
                        onClick={() => removeTopic(title)}
                        className="ml-0.5 inline-flex text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Remove ${title}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
              "Create Subject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
