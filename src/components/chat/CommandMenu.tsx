"use client";

import {
  Upload,
  Library,
  StickyNote,
  GraduationCap,
  Zap,
  Eye,
  ClipboardList,
} from "lucide-react";

interface CommandItem {
  icon: typeof Upload;
  label: string;
  description: string;
  action: string;
}

const COMMANDS: CommandItem[] = [
  {
    icon: Upload,
    label: "Upload",
    description: "Upload a file or document",
    action: "I want to upload a file or document to study from.",
  },
  {
    icon: Library,
    label: "Materials",
    description: "Browse your study materials",
    action: "Show me my study materials.",
  },
  {
    icon: StickyNote,
    label: "Notes",
    description: "Browse your notes",
    action: "Show me my notes.",
  },
  {
    icon: GraduationCap,
    label: "Study mode",
    description: "Start a focused study session",
    action: "Let's start a study session. Quiz me and help me learn.",
  },
  {
    icon: Zap,
    label: "Skills",
    description: "Review your skills",
    action: "What skills should I focus on?",
  },
  {
    icon: Eye,
    label: "Visualize",
    description: "Visualize a concept",
    action: "Help me visualize and understand this concept better.",
  },
  {
    icon: ClipboardList,
    label: "Plan",
    description: "Create a study plan",
    action: "Help me create a study plan.",
  },
];

interface CommandMenuProps {
  onSelect: (action: string) => void;
}

export function CommandMenu({ onSelect }: CommandMenuProps) {
  return (
    <div className="w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Commands</p>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {COMMANDS.map((cmd) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.label}
              type="button"
              onClick={() => onSelect(cmd.action)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {cmd.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cmd.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
