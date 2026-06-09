"use client";

import { useState } from "react";
import type { Difficulty, Topic, Subject } from "@/lib/types";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  relearn: "🔴",
  hard: "🟠",
  medium: "🟡",
  easy: "🟢",
};

const BORDER_COLORS: Record<Difficulty, string> = {
  relearn: "border-sl-relearn/40",
  hard: "border-sl-hard/40",
  medium: "border-sl-medium/40",
  easy: "border-sl-easy/40",
};

const BG_COLORS: Record<Difficulty, string> = {
  relearn: "bg-sl-relearn/10",
  hard: "bg-sl-hard/10",
  medium: "bg-sl-medium/10",
  easy: "bg-sl-easy/10",
};

const SELECTED_BG: Record<Difficulty, string> = {
  relearn: "bg-sl-relearn/20 ring-2 ring-sl-relearn/50",
  hard: "bg-sl-hard/20 ring-2 ring-sl-hard/50",
  medium: "bg-sl-medium/20 ring-2 ring-sl-medium/50",
  easy: "bg-sl-easy/20 ring-2 ring-sl-easy/50",
};

export function ReviewDialog({
  topic,
  subject,
  open,
  onClose,
  onCommit,
}: {
  topic: Topic;
  subject?: Subject;
  open: boolean;
  onClose: () => void;
  onCommit: (difficulty: Difficulty, commitMessage?: string) => void;
}) {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [commitMessage, setCommitMessage] = useState("");

  const handleCommit = () => {
    if (!selectedDifficulty) return;
    onCommit(selectedDifficulty, commitMessage.trim() || undefined);
    setSelectedDifficulty(null);
    setCommitMessage("");
  };

  const difficulties = Object.keys(DIFFICULTY_CONFIG) as Difficulty[];

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            Rate your recall
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {subject && (
              <span className="text-muted-foreground">
                <SubjectIcon name={subject.icon} size={12} /> {subject.name}{" "}
                &mdash;
              </span>
            )}
            <span className="font-medium text-foreground">{topic.title}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Difficulty icons row */}
        <div className="flex justify-center gap-3 py-2">
          {difficulties.map((d) => {
            const config = DIFFICULTY_CONFIG[d];
            const isSelected = selectedDifficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDifficulty(d)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all",
                  isSelected
                    ? SELECTED_BG[d]
                    : `${BORDER_COLORS[d]} ${BG_COLORS[d]} opacity-70 hover:opacity-100`,
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {DIFFICULTY_EMOJI[d]}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Commit message input */}
        <textarea
          placeholder="What did you learn? (optional commit message)"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <AlertDialogFooter className="sm:justify-center">
          <Button
            size="lg"
            className="w-full rounded-lg"
            disabled={!selectedDifficulty}
            onClick={handleCommit}
          >
            Commit review
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
