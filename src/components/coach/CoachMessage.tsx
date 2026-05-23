"use client";

import { isTextUIPart, type UIMessage } from "ai";
import { CoachToolCard } from "./CoachToolCard";
import { cn } from "@/lib/utils";

export function CoachMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  const textContent = message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");

  const toolParts = message.parts.filter(
    (part) => part.type.startsWith("tool-") || part.type === "dynamic-tool",
  );

  if (!textContent && toolParts.length === 0) return null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        {textContent && (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
            )}
          >
            {textContent}
          </div>
        )}
        {!isUser &&
          toolParts.map((part, index) => (
            <CoachToolCard key={`${message.id}-tool-${index}`} part={part} />
          ))}
      </div>
    </div>
  );
}
