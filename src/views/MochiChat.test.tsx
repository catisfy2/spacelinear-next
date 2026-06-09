import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivitySummary, FeedbackActions, type ChatMessage } from "./MochiChat";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Mochi conversation components", () => {
  it("renders a safe completed activity summary", () => {
    render(
      <ActivitySummary
        activity={[{ label: "Checked today's topics", status: "complete" }]}
      />,
    );
    expect(screen.getByText("Thought for a second.")).toBeInTheDocument();
    expect(screen.getByText("Checked today's topics")).toBeInTheDocument();
  });

  it("exposes accessible feedback actions and selected state", () => {
    const message: ChatMessage = {
      id: "message-1",
      role: "assistant",
      content: "A useful answer",
      activity: [],
      feedback: "positive",
    };
    render(<FeedbackActions message={message} onFeedback={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Helpful response" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Not helpful response" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy response" })).toBeInTheDocument();
  });
});
