"use client";

import { useRef, useEffect, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { useMochi } from "./MochiProvider";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function stripActions(text: string) {
  return text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, "").trim();
}

export function MochiPanel() {
  const { isOpen, greeting } = useMochi();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [accessToken, setAccessToken] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
      }
    });
  }, []);

  const { completion, input, handleInputChange, handleSubmit, isLoading, error } =
    useCompletion({
      api: "/api/mochi/chat",
      body: { accessToken, history } as Record<string, unknown>,
      streamProtocol: "text",
      onFinish(_prompt, result) {
        setHistory((prev) => [
          ...prev,
          { role: "user", content: _prompt },
          { role: "assistant", content: stripActions(result) },
        ]);
      },
    });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, completion]);

  if (!isOpen) return null;

  const hasAssistantLast =
    history.length > 0 && history[history.length - 1]?.role === "assistant";
  const cleanCompletion = hasAssistantLast ? "" : stripActions(completion);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in">
      <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Mochi</span>
      </div>

      <div className="flex h-80 flex-col gap-2 overflow-y-auto p-3">
        {history.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Sparkles className="size-8 text-primary/50" />
            <p className="text-sm text-muted-foreground">{greeting}</p>
          </div>
        ) : (
          <>
            {history.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {msg.content}
              </div>
            ))}
            {cleanCompletion && (
              <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                {cleanCompletion}
                {isLoading && <Loader2 className="ml-1 inline size-3 animate-spin" />}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Something went wrong. Try again.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Mochi anything..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
