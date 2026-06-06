"use client";

import {
  CheckCircle2,
  BookOpen,
  BrainCircuit,
  FileText,
  StickyNote,
  Library,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActionType =
  | "subject_created"
  | "topic_created"
  | "note_created"
  | "material_created"
  | "quiz_created"
  | "quiz_set_created";

interface ActionInfo {
  type: ActionType;
  label: string;
  details?: string;
}

const ACTION_CONFIG: Record<
  ActionType,
  { icon: typeof CheckCircle2; color: string; bg: string; label: string }
> = {
  subject_created: {
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Subject Created",
  },
  topic_created: {
    icon: BrainCircuit,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    label: "Topic Created",
  },
  note_created: {
    icon: StickyNote,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Note Created",
  },
  material_created: {
    icon: Library,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "Study Material Created",
  },
  quiz_created: {
    icon: FileText,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    label: "Quiz Questions Created",
  },
  quiz_set_created: {
    icon: GraduationCap,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    label: "Quiz Set Created",
  },
};

interface AgentActionCardProps {
  actions: ActionInfo[];
  className?: string;
}

export function AgentActionCard({ actions, className }: AgentActionCardProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {actions.map((action, i) => {
        const config = ACTION_CONFIG[action.type];
        const Icon = config.icon;

        return (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3",
              config.bg,
              "border-border/60",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                config.bg,
              )}
            >
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={cn("h-3.5 w-3.5 shrink-0", config.color)}
                />
                <span className="text-sm font-medium text-foreground">
                  {config.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-foreground">{action.label}</p>
              {action.details && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {action.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type { ActionType, ActionInfo };
