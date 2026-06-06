"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/useSpeechToText";

export function AiPromptInput({
  placeholder = "What you wanna study today?",
}: {
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [value]);

  const handleSend = useCallback(() => {
    if (!value.trim()) return;
    router.push("/chat?q=" + encodeURIComponent(value.trim()));
  }, [value, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleAttachment = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx";
    input.click();
  }, []);

  const {
    isListening,
    isProcessing,
    transcript,
    toggleListening,
    resetTranscript,
  } = useSpeechToText();

  // Sync speech transcript into the textarea
  useEffect(() => {
    if (transcript) {
      setValue(transcript);
    }
  }, [transcript]);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      toggleListening();
    } else {
      resetTranscript();
      toggleListening();
    }
  }, [isListening, toggleListening, resetTranscript]);

  return (
    <div className="flex w-full items-center gap-[20px] overflow-clip rounded-[34px] bg-secondary px-[10px] py-[12px]">
      <button
        type="button"
        onClick={handleAttachment}
        className="size-[36px] shrink-0"
        aria-label="Attach file"
      >
        <img
          alt="Attach"
          src="/assets/today/add-button.svg"
          className="size-full"
        />
      </button>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="min-h-[24px] flex-1 resize-none bg-transparent text-[16px] font-medium text-foreground opacity-[0.73] outline-none placeholder:text-foreground/70"
      />
      <button
        type="button"
        onClick={handleVoiceToggle}
        className={cn(
          "size-[36px] shrink-0 rounded-full transition-colors",
          isListening
            ? "bg-destructive text-destructive-foreground shadow-[0_0_12px_hsl(var(--destructive)/0.5)]"
            : "text-muted-foreground hover:text-foreground",
          isProcessing && !isListening && "animate-pulse",
        )}
        aria-label={isListening ? "Stop recording" : "Start voice input"}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="mx-auto size-[18px]" />
        ) : (
          <Mic className="mx-auto size-[18px]" />
        )}
      </button>
      <button
        type="button"
        onClick={handleSend}
        disabled={!value.trim()}
        className="size-[36px] shrink-0 disabled:opacity-40"
        aria-label="Send prompt"
      >
        <img
          alt="Send"
          src="/assets/today/enter-icon.svg"
          className="size-full"
        />
      </button>
    </div>
  );
}
