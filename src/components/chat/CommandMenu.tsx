"use client";

import {
  Upload,
  Library,
  StickyNote,
  GraduationCap,
  Zap,
  Eye,
  ClipboardList,
  BookOpen,
  BrainCircuit,
  FileText,
} from "lucide-react";

export type CommandType = "agent" | "upload" | "navigate" | "study";

interface CommandItem {
  icon: typeof Upload;
  label: string;
  description: string;
  action: string;
  type: CommandType;
  href?: string;
}

const COMMANDS: CommandItem[] = [
  // ── Agent Actions ──
  {
    icon: BookOpen,
    label: "New Subject",
    description: "Create a new study subject",
    action: "Create a new subject for me to study.",
    type: "agent",
  },
  {
    icon: BrainCircuit,
    label: "New Topic",
    description: "Create a new topic to study",
    action: "Create a new topic for me to study.",
    type: "agent",
  },
  {
    icon: StickyNote,
    label: "New Note",
    description: "Save study notes",
    action: "Create a new note for me.",
    type: "agent",
  },
  {
    icon: FileText,
    label: "New Quiz",
    description: "Generate practice questions",
    action:
      "Create a new quiz for me to practice with. Generate 10 questions by default.",
    type: "agent",
  },

  // ── Separator ──

  {
    icon: Upload,
    label: "Upload",
    description: "Upload a file or document",
    action:
      "I want to upload a file to study from. After uploading, create a quiz set with 10 questions based on the material.",
    type: "upload",
  },
  {
    icon: Library,
    label: "Materials",
    description: "Browse your study materials",
    action: "Show me my study materials.",
    type: "navigate",
    href: "/materials",
  },
  {
    icon: GraduationCap,
    label: "Study mode",
    description: "Start a focused study session",
    action: "Let's start a study session. Quiz me and help me learn.",
    type: "navigate",
    href: "/today",
  },
  {
    icon: Zap,
    label: "Skills",
    description: "Review your skills",
    action: "What skills should I focus on?",
    type: "navigate",
    href: "/pulse",
  },
  {
    icon: Eye,
    label: "Visualize",
    description: "Visualize a concept",
    action: "Help me visualize and understand this concept better.",
    type: "agent",
  },
  {
    icon: ClipboardList,
    label: "Plan",
    description: "Create a study plan",
    action: "Help me create a study plan.",
    type: "agent",
  },
];

interface CommandMenuProps {
  onSelect: (action: string, type: CommandType, href?: string) => void;
}

export function CommandMenu({ onSelect }: CommandMenuProps) {
  return (
    <div className="w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Commands</p>
      </div>
      <div className="max-h-80 overflow-y-auto py-1">
        {COMMANDS.map((cmd, index) => {
          const isFirst = index === 0;
          const isGeneralStart = index === 4 && cmd.label === "Upload";

          if (isFirst || isGeneralStart) {
            return (
              <div key={cmd.label}>
                {isGeneralStart && (
                  <div className="my-1 border-t border-border" />
                )}
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {isFirst ? "✨ Agent Actions" : "General"}
                </p>
                <CommandRow cmd={cmd} onSelect={onSelect} />
              </div>
            );
          }
          return <CommandRow key={cmd.label} cmd={cmd} onSelect={onSelect} />;
        })}
      </div>
    </div>
  );
}

function CommandRow({
  cmd,
  onSelect,
}: {
  cmd: CommandItem;
  onSelect: (action: string, type: CommandType, href?: string) => void;
}) {
  const Icon = cmd.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(cmd.action, cmd.type, cmd.href)}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{cmd.label}</p>
        <p className="text-xs text-muted-foreground">{cmd.description}</p>
      </div>
    </button>
  );
}
