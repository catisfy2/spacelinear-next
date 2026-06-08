"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "What should I study today?",
  "Show my weekly progress",
  "Find my weakest topics",
  "Give me today's digest",
];

export function MochiChat() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationParam = searchParams.get("conversation");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [activeChatId, setActiveChatId] = useState<string | null>(
    conversationParam,
  );
  const [accessToken, setAccessToken] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        setAccessToken(data.session.access_token);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  useEffect(() => {
    if (conversationParam && conversationParam !== activeChatId) {
      setActiveChatId(conversationParam);
      initialLoadDone.current = false;
    }
  }, [conversationParam]);

  useEffect(() => {
    if (!activeChatId || !user || initialLoadDone.current) return;
    fetchMessages(activeChatId);
  }, [activeChatId, user]);

  const fetchMessages = async (chatId: string) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mochi_conversations")
      .select("*")
      .eq("mochi_chat_id", chatId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(
        data
          .filter(
            (m) => m.role === "user" || m.role === "assistant",
          )
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content ?? "",
          })),
      );
    }
    initialLoadDone.current = true;
    setLoading(false);
  };

  const handleSend = useCallback(
    async (content: string) => {
      if (!user || !content.trim() || isStreaming || !accessToken) return;

      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setIsStreaming(true);
      setStreamContent("");
      setInput("");

      const historyMessages = [...messages, tempUserMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch("/api/mochi/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            accessToken,
            history: historyMessages,
            mochiChatId: activeChatId,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        const chatId = response.headers.get("X-Mochi-Chat-Id");
        if (chatId && chatId !== activeChatId) {
          setActiveChatId(chatId);
          router.replace(`/mochi?conversation=${chatId}`, { scroll: false });
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            setStreamContent(accumulated);
          }
        } else {
          accumulated = await response.text();
          setStreamContent(accumulated);
        }

        setMessages((prev) => {
          const next = [...prev, {
            id: `assistant-${Date.now()}`,
            role: "assistant" as const,
            content: accumulated,
          }];
          return next;
        });
      } catch (err) {
        console.error("Mochi chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setIsStreaming(false);
        setStreamContent("");
      }
    },
    [user, messages, isStreaming, accessToken, activeChatId, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        handleSend(input.trim());
      }
    }
  };

  const handleSuggestion = async (suggestion: string) => {
    setInput(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    await handleSend(suggestion);
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4">
          {loading && activeChatId && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          {!loading && hasMessages && (
            <div className="flex-1 space-y-4 pb-4 pt-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    {msg.role === "user" ? (
                      <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ) : msg.content ? (
                      <div className="max-w-[80%] text-sm leading-relaxed text-foreground prose prose-sm prose-neutral dark:prose-invert max-w-none break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                      </span>
                    )}

                    {msg.role === "user" && (
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent ring-1 ring-border">
                        <User className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isStreaming && streamContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="max-w-[80%] text-sm leading-relaxed text-foreground prose prose-sm prose-neutral dark:prose-invert max-w-none break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamContent}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}

          {!loading && !hasMessages && !activeChatId && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                How can I help you today?
              </h1>
              <div className="grid w-full max-w-lg grid-cols-2 gap-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestion(suggestion)}
                    disabled={isStreaming}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && !hasMessages && activeChatId && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Start a conversation below
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto w-full max-w-2xl px-4 py-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Mochi anything..."
              rows={1}
              className="min-h-[24px] max-h-[160px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              disabled={isStreaming}
            />
            <button
              type="button"
              onClick={() => {
                if (input.trim() && !isStreaming) {
                  handleSend(input.trim());
                }
              }}
              disabled={!input.trim() || isStreaming}
              className={cn(
                "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                input.trim() && !isStreaming
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground",
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
