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
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { StickyNote, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  { value: "summary", label: "Summary", description: "Concise overview of the topic" },
  { value: "study_guide", label: "Study Guide", description: "Structured learning guide with key points" },
  { value: "cheat_sheet", label: "Cheat Sheet", description: "Quick reference with essential facts" },
  { value: "explanation", label: "Explanation", description: "Detailed explanation for deep understanding" },
  { value: "flashcards", label: "Flashcards", description: "Question-answer pairs for active recall" },
  { value: "custom", label: "Custom", description: "Describe what you want in the prompt below" },
] as const;

interface NewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after creation so the parent can send an AI note-generation message */
  onCreated: (noteTitle: string, contentType: string, customPrompt?: string) => void;
}

export function NewNoteDialog({
  open,
  onOpenChange,
  onCreated,
}: NewNoteDialogProps) {
  const { user } = useAuth();
  const { createNote } = useStore();

  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<string>("summary");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset when dialog opens/closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTitle("");
        setContentType("summary");
        setCustomPrompt("");
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(async () => {
    if (!user || !title.trim()) return;

    setLoading(true);

    try {
      // 1. Create note via store (with empty content — AI will fill it)
      const note = await createNote(user.id);

      // 2. Update the note title in the store and DB
      const { updateNote } = useStore.getState();
      await updateNote(note.id, { title: title.trim() });

      handleOpenChange(false);
      setLoading(false);

      // 3. Notify parent to trigger AI note generation
      onCreated(title.trim(), contentType, customPrompt.trim() || undefined);
    } catch (err) {
      console.error("Failed to create note:", err);
      setLoading(false);
    }
  }, [user, title, contentType, customPrompt, createNote, handleOpenChange, onCreated]);

  const canSubmit = title.trim().length > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            New Note
          </DialogTitle>
          <DialogDescription>
            Create a note with a title. AI will generate the content for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* ── Note Title ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Note Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Calculus Summary, WWII Timeline"
              autoFocus
            />
          </div>

          {/* ── Content Type ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Content Type <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setContentType(type.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    contentType === type.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent/50",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">
                    {type.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom Prompt (only shown when "Custom" is selected) ── */}
          {contentType === "custom" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Custom Instructions
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what kind of content you want the AI to generate..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}
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
              "Create Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
