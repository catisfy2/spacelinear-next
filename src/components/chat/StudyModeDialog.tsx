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
import { Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [15, 30, 45, 60];

interface StudyModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the selected number of minutes */
  onStart: (minutes: number) => void;
}

export function StudyModeDialog({
  open,
  onOpenChange,
  onStart,
}: StudyModeDialogProps) {
  const [minutes, setMinutes] = useState(30);
  const [customMinutes, setCustomMinutes] = useState("");

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setMinutes(30);
        setCustomMinutes("");
      }
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const handlePreset = useCallback((m: number) => {
    setMinutes(m);
    setCustomMinutes("");
  }, []);

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomMinutes(val);
      const num = parseInt(val, 10);
      if (num > 0 && num <= 300) {
        setMinutes(num);
      }
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    handleOpenChange(false);
    onStart(minutes);
  }, [minutes, handleOpenChange, onStart]);

  const isValid = minutes > 0 && minutes <= 300;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Study Mode
          </DialogTitle>
          <DialogDescription>
            How long do you want to study for? Set a timer and focus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Preset buttons */}
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handlePreset(m)}
                className={cn(
                  "rounded-lg border py-3 text-center transition-colors",
                  minutes === m && !customMinutes
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent/50",
                )}
              >
                <span className="text-lg font-semibold text-foreground">
                  {m}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  min
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-xs text-muted-foreground">
                or custom
              </span>
            </div>
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={300}
              value={customMinutes}
              onChange={handleCustomChange}
              placeholder="Enter minutes..."
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>

          {customMinutes && (parseInt(customMinutes, 10) < 1 || parseInt(customMinutes, 10) > 300) && (
            <p className="text-xs text-destructive">
              Please enter a value between 1 and 300.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid}>
            Start Study Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
