"use client";

import { Loader2, CheckCircle2, AlertCircle, Settings2 } from "lucide-react";
import { isToolUIPart, type UIMessage } from "ai";
import { cn } from "@/lib/utils";

type ToolPart = Extract<UIMessage["parts"][number], { type: string }>;

function getToolLabel(part: ToolPart): string {
  const toolName = part.type.startsWith("tool-")
    ? part.type.slice(5)
    : "tool";

  const input = "input" in part ? (part.input as Record<string, unknown> | undefined) : undefined;

  if (toolName === "createSubject" && input?.name) {
    return `Building Subject: ${input.name}`;
  }
  if (toolName === "createTopic" && input?.title) {
    return `Building Topic: ${input.title}`;
  }
  if (toolName === "listSubjects") return "Loading subjects…";
  if (toolName === "createSubject") return "Creating subject…";
  if (toolName === "createTopic") return "Creating topic…";
  return `Running ${toolName}…`;
}

function getToolStatus(state: string): "running" | "done" | "error" {
  if (state === "output-available") return "done";
  if (state === "output-error") return "error";
  return "running";
}

export function CoachToolCard({ part }: { part: ToolPart }) {
  if (!isToolUIPart(part)) return null;

  const status = getToolStatus(part.state);
  const label = getToolLabel(part);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        status === "running" && "border-primary/30 bg-primary/5 text-primary",
        status === "done" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
        status === "error" && "border-destructive/30 bg-destructive/5 text-destructive",
      )}
    >
      {status === "running" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
      {status === "done" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
      {status === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      <Settings2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
      <span className="font-medium">{label}</span>
      {status === "error" && "errorText" in part && part.errorText && (
        <span className="ml-1 truncate text-destructive/80">— {part.errorText}</span>
      )}
    </div>
  );
}
