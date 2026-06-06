"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function StudyModeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm your study buddy. Ask me anything if you get stuck! 📚",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    isProcessing,
    transcript,
    toggleListening,
    resetTranscript,
  } = useSpeechToText();

  // Sync speech transcript into the input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    // Add a temporary optimistic assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

    try {
      // Use a lightweight model via fetch to get a quick response
      const res = await fetch("/api/chat/study-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: messages
            .filter((m) => m.content !== "...")
            .slice(-4)
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n"),
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => {
        const updated = [...prev];
        // Replace the "..." message
        if (updated[updated.length - 1]?.content === "...") {
          updated[updated.length - 1] = {
            role: "assistant",
            content: data.response || "Sorry, I couldn't process that.",
          };
        }
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.content === "...") {
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Oops! I had trouble connecting. Please try again.",
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      {/* Floating chat bubble button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105",
          isOpen
            ? "bg-white/20 text-white rotate-45"
            : "bg-white/30 text-white hover:bg-white/40",
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-[22px] w-[22px]" />
        ) : (
          <MessageCircle className="h-[24px] w-[24px]" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="absolute bottom-[68px] right-0 flex h-[420px] w-[340px] flex-col overflow-hidden rounded-[20px] border border-white/20 bg-black/40 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-[8px] border-b border-white/10 px-[16px] py-[12px]">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white/20">
              <Bot className="h-[14px] w-[14px] text-white" />
            </div>
            <p className="text-[14px] font-semibold text-white">Study Buddy</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-[12px] py-[10px] space-y-[10px] scrollbar-thin scrollbar-thumb-white/20">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-[8px]",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "assistant" && msg.content !== "..." && (
                  <div className="mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Bot className="h-[11px] w-[11px] text-white/70" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-[14px] px-[12px] py-[8px] text-[13px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-white/25 text-white"
                      : msg.content === "..."
                        ? "bg-white/10"
                        : "bg-white/15 text-white/90",
                  )}
                >
                  {msg.content === "..." ? (
                    <span className="inline-flex gap-[3px]">
                      <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-white/40 [animation-delay:0ms]" />
                      <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-white/40 [animation-delay:150ms]" />
                      <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-white/40 [animation-delay:300ms]" />
                    </span>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/25">
                    <User className="h-[11px] w-[11px] text-white/70" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-[8px] border-t border-white/10 px-[12px] py-[10px]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something..."
              rows={1}
              className="min-h-[20px] flex-1 resize-none bg-transparent text-[13px] text-white outline-none placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  toggleListening();
                } else {
                  resetTranscript();
                  toggleListening();
                }
              }}
              className={cn(
                "flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full transition-colors",
                isListening
                  ? "bg-red-500/60 text-white shadow-[0_0_10px_rgba(255,80,80,0.4)]"
                  : "bg-white/20 text-white hover:bg-white/30",
                isProcessing && !isListening && "animate-pulse",
              )}
              aria-label={isListening ? "Stop recording" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-[13px] w-[13px]" />
              ) : (
                <Mic className="h-[13px] w-[13px]" />
              )}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="h-[13px] w-[13px]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
