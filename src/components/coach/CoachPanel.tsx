"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import {
  buildCoachGreeting,
  detectTriggerType,
  getConsecutiveRelearnCount,
  type CoachContextPayload,
} from "@/lib/coach/context";
import { CoachMessage } from "./CoachMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function buildInitialMessages(
  subjectCount: number,
  frictionActive: boolean,
): UIMessage[] {
  return [
    {
      id: "coach-welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: buildCoachGreeting(subjectCount, frictionActive),
        },
      ],
    },
  ];
}

interface CoachPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachPanel({ open, onOpenChange }: CoachPanelProps) {
  const { session, user } = useAuth();
  const fetchAll = useStore((s) => s.fetchAll);
  const subjects = useStore((s) => s.subjects);
  const reviewHistory = useStore((s) => s.reviewHistory);
  const selectedSidebarTopicId = useStore((s) => s.selectedSidebarTopicId);
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isFrictionMode, setIsFrictionMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CoachContextPayload>({ triggerType: "STANDARD" });

  const consecutiveRelearnCount = useMemo(
    () => getConsecutiveRelearnCount(reviewHistory, selectedSidebarTopicId),
    [reviewHistory, selectedSidebarTopicId],
  );

  const initialMessages = useMemo(
    () =>
      buildInitialMessages(
        subjects.length,
        consecutiveRelearnCount >= 2,
      ),
    [subjects.length, consecutiveRelearnCount],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/coach/agent",
        body: () => ({
          accessToken: session?.access_token ?? "",
          ...contextRef.current,
        }),
      }),
    [session?.access_token],
  );

  const syncAppData = useCallback(async () => {
    if (!user?.id) return;
    await fetchAll(user.id, { silent: true });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subjects"] }),
      queryClient.invalidateQueries({ queryKey: ["topics"] }),
    ]);
  }, [fetchAll, queryClient, user?.id]);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: "spacelinear-coach",
    transport,
    messages: initialMessages,
    onFinish: () => {
      void syncAppData();
    },
  });

  useEffect(() => {
    if (!open) {
      setIsFrictionMode(false);
      contextRef.current = { triggerType: "STANDARD" };
      return;
    }

    if (consecutiveRelearnCount >= 2) {
      setIsFrictionMode(true);
      contextRef.current = {
        triggerType: "FRICTION",
        activeTopicId: selectedSidebarTopicId ?? undefined,
        consecutiveRelearnCount,
      };
      return;
    }

    if (subjects.length === 0) {
      contextRef.current = { triggerType: "ONBOARDING" };
    }
  }, [open, consecutiveRelearnCount, selectedSidebarTopicId, subjects.length]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isBusy || !session?.access_token) return;

    const relearnCount = getConsecutiveRelearnCount(
      reviewHistory,
      selectedSidebarTopicId,
    );
    const triggerType = detectTriggerType(
      text,
      subjects.length,
      relearnCount,
    );

    contextRef.current = {
      triggerType,
      activeTopicId: selectedSidebarTopicId ?? undefined,
      consecutiveRelearnCount: relearnCount > 0 ? relearnCount : undefined,
    };

    if (triggerType === "FRICTION") {
      setIsFrictionMode(true);
    }

    setInput("");
    await sendMessage({ text });

    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-4 py-4 text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Study Coach</SheetTitle>
              <SheetDescription className="text-xs">
                {isFrictionMode
                  ? "Unblock Mode — 5-minute focus milestone"
                  : "Feel-Good Productivity + agentic scaffolding"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <CoachMessage key={message.id} message={message} />
            ))}
            {isBusy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3.5 py-2.5">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-destructive">
                {error.message || "Something went wrong. Please try again."}
              </p>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className={cn(
            "border-t bg-background p-4 transition-shadow",
            isFrictionMode && "ring-2 ring-inset ring-destructive/80",
          )}
        >
          {isFrictionMode && (
            <p className="mb-2 text-xs font-medium text-destructive">
              Unblock Mode active — focus on Clarity, Courage, and Inertia
            </p>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isFrictionMode
                  ? "What's blocking you right now?"
                  : "Tell me what you're studying…"
              }
              rows={2}
              disabled={isBusy || !session?.access_token}
              className={cn(
                "min-h-[72px] resize-none text-sm",
                isFrictionMode && "border-destructive/50 focus-visible:ring-destructive/50",
              )}
            />
            {isBusy ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => void stop()}
                aria-label="Stop"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || !session?.access_token}
                aria-label="Send"
                className={cn(!input.trim() && "opacity-50")}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
