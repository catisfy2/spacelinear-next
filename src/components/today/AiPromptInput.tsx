"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="flex w-full items-center gap-[20px] overflow-clip rounded-[34px] bg-secondary px-[10px] py-[12px]">
      <button
        type="button"
        onClick={handleAttachment}
        className="size-[36px] shrink-0"
        aria-label="Attach file"
      >
        <img alt="Attach" src="/assets/today/add-button.svg" className="size-full" />
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
        onClick={handleSend}
        disabled={!value.trim()}
        className="size-[36px] shrink-0 disabled:opacity-40"
        aria-label="Send prompt"
      >
        <img alt="Send" src="/assets/today/enter-icon.svg" className="size-full" />
      </button>
    </div>
  );
}
