"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from "@/lib/constants";
import { DEFAULT_SUBJECT_ICON } from "@/lib/subject-icons";
import { SubjectIcon } from "./SubjectIcon";
import { IconPicker } from "./IconPicker";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateSubjectModal({ onClose }: { onClose: () => void }) {
  const { addSubject } = useStore();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(DEFAULT_SUBJECT_ICON);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setSubmitting(true);
    try {
      await addSubject(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          icon,
        },
        user.id,
      );
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">New Subject</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Icon
              <span className="ml-1.5 inline-flex items-center gap-1 align-middle">
                <SubjectIcon name={icon} size={14} />
              </span>
            </label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full",
                    color === c
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                      : "",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
