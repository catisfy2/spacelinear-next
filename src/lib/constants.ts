import { formatDistanceToNow, differenceInDays, format } from "date-fns";

export function formatNextReview(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = differenceInDays(d, now);

  if (diffDays <= 0) return "Due now";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `in ${diffDays}d`;
  if (diffDays < 30) return `in ${Math.round(diffDays / 7)}w`;
  return format(d, "MMM d");
}

export function formatInterval(days: number): string {
  if (days === 0) return "now";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export const DIFFICULTY_CONFIG = {
  relearn: { label: "Again", color: "sl-relearn", key: "1" },
  hard: { label: "Hard", color: "sl-hard", key: "2" },
  medium: { label: "Good", color: "sl-medium", key: "3" },
  easy: { label: "Easy", color: "sl-easy", key: "4" },
} as const;

export const STATE_CONFIG = {
  backlog: { label: "Backlog", color: "sl-new", icon: "📋" },
  relearning: { label: "Relearn", color: "sl-relearn", icon: "🔴" },
  learning: { label: "Learning", color: "sl-hard", icon: "🟠" },
  new: { label: "New", color: "sl-new", icon: "⚪" },
  reviewing: { label: "Reviewing", color: "sl-easy", icon: "🟢" },
} as const;

export const DEFAULT_SUBJECT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
];

// Re-export icon names from the new subject-icons module
// This preserves backward compatibility for any code importing from constants
export { SUBJECT_ICON_NAMES as DEFAULT_SUBJECT_ICONS } from "./subject-icons";
