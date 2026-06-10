"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import { previewIntervals } from "@/lib/algorithm";
import { cn } from "@/lib/utils";
import type { Topic, Difficulty } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const colorMap: Record<string, string> = {
  "sl-relearn":
    "border-sl-relearn/40 text-sl-relearn hover:bg-sl-relearn/5",
  "sl-hard":
    "border-sl-hard/40 text-sl-hard hover:bg-sl-hard/5",
  "sl-medium":
    "border-sl-medium/40 text-sl-medium hover:bg-sl-medium/5",
  "sl-easy":
    "border-sl-easy/40 text-sl-easy hover:bg-sl-easy/5",
};

const selectedColorMap: Record<string, string> = {
  "sl-relearn": "border-sl-relearn bg-sl-relearn/15 text-sl-relearn",
  "sl-hard": "border-sl-hard bg-sl-hard/15 text-sl-hard",
  "sl-medium": "border-sl-medium bg-sl-medium/15 text-sl-medium",
  "sl-easy": "border-sl-easy bg-sl-easy/15 text-sl-easy",
};

export function ReviewTopicDialog({
  topic,
  open,
  onClose,
}: {
  topic: Topic;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { submitReview } = useStore();
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const intervals = previewIntervals(topic);

  const handleSubmit = async () => {
    if (!user || !selected) return;
    setSubmitting(true);
    try {
      await submitReview(
        topic.id,
        selected,
        user.id,
        commitMessage.trim() || undefined,
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Rate your recall</AlertDialogTitle>
          <AlertDialogDescription>
            How well did you know &ldquo;{topic.title}&rdquo;?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-stretch gap-2 my-1">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
            const config = DIFFICULTY_CONFIG[key];
            const interval = intervals[key];
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-xl border text-xs transition-colors",
                  active ? selectedColorMap[config.color] : colorMap[config.color],
                )}
              >
                <span className="font-medium text-sm">{config.label}</span>
                <span className="opacity-60 font-mono">{interval}d</span>
              </button>
            );
          })}
        </div>

        <textarea
          placeholder="Commit message (optional)"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <button
            type="button"
            disabled={!selected || submitting}
            onClick={handleSubmit}
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
              selected && !submitting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
