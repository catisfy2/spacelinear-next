"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Send, User, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentPanelProps {
  context: string;
  variant?: "popup" | "page";
  defaultOpen?: boolean;
}

export function AgentPanel({
  context,
  variant = "popup",
  defaultOpen = false,
}: AgentPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [generalMode, setGeneralMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || processing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const pageContext = generalMode ? "general" : context;
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          accessToken: token,
          conversationId,
          pageContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Agent request failed");
      }

      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text },
      ]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${message}` },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Shared chat UI (used by both popup and page variants) ────────────────

  const chatContent = (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Assistant</span>
          {variant === "popup" && (
            <button
              type="button"
              onClick={() => {
                setGeneralMode((m) => !m);
                setMessages([]);
                setConversationId(null);
              }}
              className={`ml-1 rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                generalMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title={
                generalMode ? "Switch to page agent" : "Switch to general agent"
              }
            >
              {generalMode ? "General" : context}
            </button>
          )}
        </div>
        {variant === "popup" && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-[3px] p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Ask me anything. I can manage all your study content.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-[3px] px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {processing && (
          <div className="flex gap-2">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="flex items-center gap-2 rounded-[3px] bg-muted px-3 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={processing}
          className="flex-1 rounded-[3px] border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!input.trim() || processing}
          className="h-7 w-7"
        >
          {processing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
        </Button>
      </div>
    </>
  );

  // ── Page variant: embedded full-page chat ───────────────────────────────

  if (variant === "page") {
    return (
      <div className="flex h-full min-h-[600px] flex-col rounded-[3px] border bg-background">
        {chatContent}
      </div>
    );
  }

  // ── Popup variant: floating button + overlay ────────────────────────────

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[480px] w-[360px] flex-col rounded-[3px] border bg-background shadow-xl">
          {chatContent}
        </div>
      )}

      {!defaultOpen && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          title="AI Assistant"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
