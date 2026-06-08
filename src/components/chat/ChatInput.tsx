"use client";

import { forwardRef, useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Mic, MicOff, Plus, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandMenu } from "@/components/chat/CommandMenu";
import { MentionMenu } from "@/components/chat/MentionMenu";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Resource } from "@/lib/types";

interface ChatInputProps {
  onSend: (content: string) => void;
  onAttach?: (file: File) => void;
  isStreaming: boolean;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ onSend, onAttach, isStreaming }, ref) {
    const { user } = useAuth();
    const [value, setValue] = useState("");
    const {
      isSupported: sttSupported,
      isListening: sttListening,
      isProcessing: sttProcessing,
      error: sttError,
      transcript: sttTranscript,
      startListening: sttStart,
      stopListening: sttStop,
      toggleListening: sttToggle,
      resetTranscript: sttReset,
    } = useSpeechToText();
    const [showCommands, setShowCommands] = useState(false);
    const [attaching, setAttaching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionItems, setMentionItems] = useState<
      { type: "material" | "note" | "agent"; label: string; action: string }[]
    >([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const commandsRef = useRef<HTMLDivElement>(null);
    const mentionsRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef(value);

    // Keep valueRef in sync
    useEffect(() => {
      valueRef.current = value;
    }, [value]);

    // Combine forwarded ref with local ref
    const setRefs = useCallback(
      (el: HTMLTextAreaElement | null) => {
        (
          textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = el;
        if (typeof ref === "function") ref(el);
        else if (ref)
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            el;
      },
      [ref],
    );

    // Auto-resize textarea
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }, [value]);

    // Close popups on click outside
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (
          commandsRef.current &&
          !commandsRef.current.contains(e.target as Node)
        ) {
          setShowCommands(false);
        }
        if (
          mentionsRef.current &&
          !mentionsRef.current.contains(e.target as Node)
        ) {
          setShowMentions(false);
        }
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Handle slash commands
    const handleSlashCommand = useCallback(
      (command: string) => {
        setShowCommands(false);
        // Replace the slash with the command text
        const currentVal = value.replace(/\/\w*$/, "");
        setValue(currentVal);
        onSend(command);
      },
      [value, onSend],
    );

    // Fetch mention items when query changes
    const fetchMentionItems = useCallback(
      async (query: string) => {
        if (!user) return;
        const items: {
          type: "material" | "note" | "agent";
          label: string;
          action: string;
        }[] = [];

        // Fetch materials and notes from resources table
        const { data: resources } = await supabase
          .from("resources")
          .select("*")
          .eq("user_id", user.id)
          .ilike("title", `%${query}%`)
          .limit(10);

        if (resources) {
          for (const r of resources) {
            items.push({
              type: r.type === "note_doc" ? "note" : "material",
              label: r.title,
              action: `Looking at ${r.title} — ${r.content || r.url || "no content available"}`,
            });
          }
        }

        // Add agent actions for creating study items
        items.push({
          type: "agent",
          label: "✨ New Subject",
          action:
            "Create a new subject for me to study. I'll tell you the name.",
        });
        items.push({
          type: "agent",
          label: "✨ New Topic",
          action: "Create a new topic for me to study under a subject.",
        });
        items.push({
          type: "agent",
          label: "✨ New Note",
          action: "Create a new note with study content for me.",
        });
        items.push({
          type: "agent",
          label: "✨ New Quiz",
          action:
            "Create a practice quiz with multiple-choice questions for me.",
        });
        items.push({
          type: "agent",
          label: "✨ Study Material",
          action: "Create a study material or reference document for me.",
        });

        // Add role agents
        items.push({
          type: "agent",
          label: "Physics Teacher",
          action:
            "Act as a physics teacher and help me understand physics concepts.",
        });

        setMentionItems(items);
      },
      [user],
    );

    // Sync speech-to-text transcript into textarea
    useEffect(() => {
      if (!sttTranscript) return;

      const currentValue = valueRef.current;
      const baseValue = currentValue.replace(/\s*$/, "");

      if (sttTranscript.startsWith(baseValue) && baseValue.length > 0) {
        // Transcript continues from the existing text — update in place
        setValue(sttTranscript);
      } else if (baseValue.length === 0) {
        // Empty textarea — set directly
        setValue(sttTranscript);
      } else if (!sttTranscript.startsWith(baseValue)) {
        // New utterance — append after existing text
        setValue(baseValue + " " + sttTranscript);
      }
      // If transcript starts with baseValue and baseValue is already set, do nothing
    }, [sttTranscript]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      // Check for slash command
      const lastWord = newValue.split(/[\s\n]/).pop() || "";
      if (lastWord.startsWith("/") && !lastWord.includes("@")) {
        setShowCommands(true);
        setShowMentions(false);
      } else if (lastWord.startsWith("@")) {
        const query = lastWord.slice(1);
        setMentionQuery(query);
        setShowMentions(true);
        setShowCommands(false);
        fetchMentionItems(query);
      } else {
        setShowCommands(false);
        setShowMentions(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isStreaming) {
          onSend(value.trim());
          setValue("");
        }
      }
    };

    const handleMentionSelect = (action: string) => {
      setShowMentions(false);
      // Replace the @mention text with the action context
      const currentVal = value.replace(/@\w*$/, "");
      setValue(currentVal);
      // Send the action as a message
      onSend(action);
    };

    return (
      <div className="relative">
        {/* ── Command Menu ── */}
        {showCommands && (
          <div ref={commandsRef} className="absolute bottom-full left-0 mb-2">
            <CommandMenu onSelect={handleSlashCommand} />
          </div>
        )}

        {/* ── Hidden file input ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !onAttach) return;
            setAttaching(true);
            try {
              await onAttach(file);
            } finally {
              setAttaching(false);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }
          }}
        />

        {/* ── Mention Menu ── */}
        {showMentions && (
          <div ref={mentionsRef} className="absolute bottom-full left-0 mb-2">
            <MentionMenu
              items={mentionItems}
              query={mentionQuery}
              onSelect={handleMentionSelect}
            />
          </div>
        )}

        {/* ── Input bar ── */}
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
          <button
            type="button"
            onClick={() => setShowCommands(!showCommands)}
            className={cn(
              "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              showCommands
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            aria-label="Commands"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* ── Attachment button ── */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || attaching}
            className={cn(
              "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              (isStreaming || attaching) && "opacity-40 cursor-not-allowed",
            )}
            aria-label="Attach file"
            title="Upload a study material"
          >
            {attaching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>

          {/* ── Speech-to-Text button ── */}
          {sttSupported && (
            <button
              type="button"
              onClick={() => {
                if (sttListening) {
                  sttStop();
                } else {
                  sttReset();
                  sttStart();
                }
              }}
              disabled={isStreaming}
              className={cn(
                "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                sttListening
                  ? "bg-destructive text-destructive-foreground shadow-[0_0_12px_hsl(var(--destructive)/0.5)]"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                sttProcessing && !sttListening && "animate-pulse",
              )}
              aria-label={sttListening ? "Stop recording" : "Start voice input"}
              title={sttListening ? "Stop recording" : "Start voice input"}
            >
              {sttListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          )}

          <textarea
            ref={setRefs}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or use '/' for commands..."
            rows={1}
            className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            disabled={isStreaming}
          />

          <button
            type="button"
            onClick={() => {
              if (value.trim() && !isStreaming) {
                onSend(value.trim());
                setValue("");
              }
            }}
            disabled={!value.trim() || isStreaming}
            className={cn(
              "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
              value.trim() && !isStreaming
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground",
            )}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        {sttError && !sttListening && (
          <p className="mt-1.5 text-center text-xs text-destructive">
            {sttError}
          </p>
        )}

        {sttListening && (
          <p className="mt-1.5 animate-pulse text-center text-xs text-destructive">
            <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-1.5 align-middle" />
            Listening...
          </p>
        )}

        {isStreaming && (
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            AI is thinking...
          </p>
        )}
      </div>
    );
  },
);
