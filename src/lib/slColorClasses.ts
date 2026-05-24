import type { TopicState } from "@/lib/types";

/** Tailwind class names for rating colors (avoid dynamic `text-sl-*` strings). */
export const DIFFICULTY_TEXT_CLASS: Record<string, string> = {
  "sl-relearn": "text-sl-relearn",
  "sl-hard": "text-sl-hard",
  "sl-medium": "text-sl-medium",
  "sl-easy": "text-sl-easy",
};

/** Dot / accent backgrounds per topic state. */
export const STATE_DOT_CLASS: Record<TopicState, string> = {
  backlog: "bg-muted-foreground/40",
  relearning: "bg-sl-relearn",
  learning: "bg-sl-hard",
  new: "bg-sl-new",
  reviewing: "bg-sl-easy",
};
