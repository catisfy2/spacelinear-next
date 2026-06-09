import { describe, expect, it } from "vitest";
import {
  createCompletedActivity,
  createInitialActivity,
  encodeSseEvent,
  getActivityFromMetadata,
  parseSseChunk,
} from "./stream";

describe("Mochi stream helpers", () => {
  it("encodes and parses typed SSE events across partial chunks", () => {
    const first = encodeSseEvent({
      type: "meta",
      chatId: "chat-1",
      activity: createInitialActivity(false),
    });
    const second = encodeSseEvent({ type: "text", delta: "Hello" });
    const partial = parseSseChunk(first + second.slice(0, 12));

    expect(partial.events).toHaveLength(1);
    expect(partial.events[0].type).toBe("meta");

    const completed = parseSseChunk(partial.remainder + second.slice(12));
    expect(completed.events).toEqual([{ type: "text", delta: "Hello" }]);
  });

  it("creates safe deterministic activity labels", () => {
    expect(createCompletedActivity(true, ["getTodaysTopics", "unknown"])).toEqual([
      { label: "Read the attached file", status: "complete" },
      { label: "Analyzed your question", status: "complete" },
      { label: "Checked today's topics", status: "complete" },
    ]);
  });

  it("loads only valid persisted activity metadata", () => {
    expect(
      getActivityFromMetadata({
        activity: [
          { label: "Analyzed your question", status: "complete" },
          { label: 2, status: "complete" },
        ],
      }),
    ).toEqual([{ label: "Analyzed your question", status: "complete" }]);
  });
});
