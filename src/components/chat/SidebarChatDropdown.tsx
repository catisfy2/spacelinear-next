"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/lib/types";

interface SidebarChatDropdownProps {
  collapsed: boolean;
  isActive: boolean;
}

export function SidebarChatDropdown({
  collapsed,
  isActive,
}: SidebarChatDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isOnChat =
    (pathname === "/chat" || pathname?.startsWith("/chat/")) ?? false;

  // Auto-expand when on chat page
  useEffect(() => {
    if (isOnChat && !collapsed) {
      setExpanded(true);
    }
  }, [isOnChat, collapsed]);

  // Fetch latest 8 conversations (7 shown + 1 to determine if "show more" needed)
  useEffect(() => {
    if (!expanded || !user || collapsed) return;
    fetchConversations();
  }, [expanded, user, collapsed]);

  // Close when clicking outside
  useEffect(() => {
    if (collapsed || !expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [collapsed, expanded]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(8);
    setConversations(
      (data ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    );
  };

  const navigateToChat = (convId?: string) => {
    if (convId) {
      router.push(`/chat?conversation=${convId}`);
    } else {
      router.push("/chat");
    }
    setExpanded(false);
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const hasMore = conversations.length >= 8;
  const displayConversations = conversations.slice(0, 7);

  if (collapsed) {
    // Collapsed sidebar — just an icon button that navigates to /chat
    return (
      <button
        type="button"
        onClick={() => navigateToChat()}
        className={cn(
          "flex items-center justify-center rounded-lg px-2 py-1.5 text-sm transition-colors",
          isOnChat
            ? "bg-accent font-medium text-foreground"
            : "text-sidebar-foreground hover:bg-accent hover:text-foreground",
        )}
        aria-label="Chat"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div ref={dropdownRef}>
      {/* ── Chat nav button ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center rounded-lg px-2 py-1.5 text-sm transition-colors",
          "gap-2.5",
          isOnChat || expanded
            ? "bg-accent font-medium text-foreground"
            : "text-sidebar-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Chat</span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>

      {/* ── Dropdown history ── */}
      {expanded && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2">
          {/* New Chat option */}
          <button
            type="button"
            onClick={() => navigateToChat()}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-muted-foreground">
              +
            </span>
            <span>New Chat</span>
          </button>

          {/* Loading state */}
          {conversations.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              No conversations yet
            </p>
          )}

          {/* Conversation list */}
          {displayConversations.map((conv) => (
            <div
              key={conv.id}
              role="button"
              tabIndex={0}
              onClick={() => navigateToChat(conv.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigateToChat(conv.id);
                }
              }}
              className="group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(e, conv.id);
                }}
                className="hidden shrink-0 text-muted-foreground hover:text-destructive group-hover:block"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Show more link */}
          {hasMore && (
            <button
              type="button"
              onClick={() => router.push("/chat/history")}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Show more →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
