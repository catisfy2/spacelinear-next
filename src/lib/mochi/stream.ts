export type MochiFeedback = "positive" | "negative";

export interface MochiActivity {
  label: string;
  status: "pending" | "complete";
}

export type MochiStreamEvent =
  | {
      type: "meta";
      chatId: string;
      activity: MochiActivity[];
      filePageCount?: number;
    }
  | { type: "text"; delta: string }
  | { type: "title"; title: string }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string };

const TOOL_ACTIVITY_LABELS: Record<string, string> = {
  logStudyCommit: "Logged your study session",
  getStudyHistory: "Checked your study history",
  getWeeklyProgress: "Checked your weekly progress",
  getQuizGaps: "Reviewed your quiz gaps",
  recommendNextStudy: "Prepared a study recommendation",
  getTodaysTopics: "Checked today's topics",
  getGapBasedStudyList: "Prioritized topics to review",
  searchMemory: "Checked relevant past context",
  storeMemory: "Saved useful context",
  getDailyDigest: "Checked today's study summary",
  importPastQuizData: "Imported past quiz data",
};

export function createInitialActivity(hasFile: boolean): MochiActivity[] {
  return [
    ...(hasFile
      ? [{ label: "Read the attached file", status: "complete" as const }]
      : []),
    { label: "Analyzing your question", status: "pending" },
  ];
}

export function createCompletedActivity(
  hasFile: boolean,
  actionNames: string[] = [],
): MochiActivity[] {
  const labels = actionNames
    .map((action) => TOOL_ACTIVITY_LABELS[action])
    .filter((label): label is string => Boolean(label));

  return [
    ...(hasFile
      ? [{ label: "Read the attached file", status: "complete" as const }]
      : []),
    { label: "Analyzed your question", status: "complete" },
    ...Array.from(new Set(labels)).map((label) => ({
      label,
      status: "complete" as const,
    })),
  ];
}

export function encodeSseEvent(event: MochiStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export function parseSseChunk(
  buffer: string,
): { events: MochiStreamEvent[]; remainder: string } {
  const blocks = buffer.split("\n\n");
  const remainder = blocks.pop() ?? "";
  const events: MochiStreamEvent[] = [];

  for (const block of blocks) {
    const data = block
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice(6);
    if (!data) continue;

    try {
      events.push(JSON.parse(data) as MochiStreamEvent);
    } catch {
      // Ignore malformed events and continue reading the stream.
    }
  }

  return { events, remainder };
}

export function getActivityFromMetadata(value: unknown): MochiActivity[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const activity = (value as { activity?: unknown }).activity;
  if (!Array.isArray(activity)) return [];

  return activity.filter(
    (item): item is MochiActivity =>
      Boolean(
        item &&
          typeof item === "object" &&
          "label" in item &&
          typeof item.label === "string" &&
          "status" in item &&
          (item.status === "pending" || item.status === "complete"),
      ),
  );
}
