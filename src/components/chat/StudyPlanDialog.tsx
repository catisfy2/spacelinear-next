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
import { ClipboardList, Calendar, CalendarDays, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the user's choices */
  onCreate: (scope: "today" | "upcoming", saveToNotes: boolean) => void;
}

type PlanScope = "today" | "upcoming";

export function StudyPlanDialog({
  open,
  onOpenChange,
  onCreate,
}: StudyPlanDialogProps) {
  const [scope, setScope] = useState<PlanScope>("today");
  const [saveToNotes, setSaveToNotes] = useState(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setScope("today");
        setSaveToNotes(false);
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const handleSubmit = useCallback(() => {
    handleOpenChange(false);
    onCreate(scope, saveToNotes);
  }, [scope, saveToNotes, handleOpenChange, onCreate]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Study Plan
          </DialogTitle>
          <DialogDescription>
            Choose what your study plan should cover. The AI will generate a
            plan based on your subjects and topics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Scope selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Plan Scope
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setScope("today")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  scope === "today"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    scope === "today"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Today&rsquo;s Study Plan
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                    Plan focused on topics due for review today. Prioritize what
                    needs attention right now.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope("upcoming")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  scope === "upcoming"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    scope === "upcoming"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Today + Upcoming Days
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                    Extended plan covering today&rsquo;s reviews and topics
                    scheduled for the next several days. Plan ahead.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Save to notes toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  saveToNotes
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <BookMarked className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Save to Notes
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Save the generated study plan as a note for later reference.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={saveToNotes}
              onClick={() => setSaveToNotes((prev) => !prev)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                saveToNotes ? "bg-primary" : "bg-input",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                  saveToNotes ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Generate Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
