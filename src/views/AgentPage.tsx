"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/app/PageShell";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Send, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        setLoadingHistory(false);
        return;
      }
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, title")
        .eq("user_id", session.session.user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (convs && convs.length > 0) {
        const cid = convs[0].id;
        setConversationId(cid);
        const { data: msgs } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: true });
        if (msgs) {
          setMessages(msgs as Message[]);
        }
      }
      setLoadingHistory(false);
    })();
  }, []);

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

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, accessToken: token, conversationId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Agent request failed");
      }

      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
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

  return (
    <PageShell maxWidth="narrow">
      <div className="flex h-full flex-col py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Study Agent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask me to create subjects, topics, notes, materials, or anything else.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {loadingHistory && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bot className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Try saying something like:
              </p>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground/70">
                <p>"Create a Physics subject with topics on Mechanics and Thermodynamics"</p>
                <p>"Make a note about the key concepts of calculus"</p>
                <p>"What did I learn about Machine Learning? Search my notes."</p>
                <p>"Create a topic about ML under my Computer Science subject"</p>
                <p>"Schedule my Linear Algebra topic for review today"</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {processing && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Processing...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to create..."
            disabled={processing}
            className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
