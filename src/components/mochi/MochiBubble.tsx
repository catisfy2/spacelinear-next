"use client";

import { useMochi } from "./MochiProvider";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MochiBubble() {
  const { isOpen, toggle, unreadCount, proactiveMessage, clearProactive } =
    useMochi();

  return (
    <>
      {proactiveMessage && !isOpen && (
        <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-2 fade-in">
          <div className="relative rounded-lg border border-border bg-card px-4 py-2 shadow-lg">
            <button
              type="button"
              onClick={clearProactive}
              className="absolute -right-1 -top-1 rounded-full bg-muted p-0.5"
            >
              <X className="size-3" />
            </button>
            <p className="max-w-48 text-xs text-foreground">
              {proactiveMessage}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full shadow-lg transition-all",
          isOpen
            ? "bg-muted-foreground text-background"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        {isOpen ? (
          <X className="size-5" />
        ) : (
          <MessageCircle className="size-5" />
        )}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
