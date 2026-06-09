"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRecent, IconMore } from "./SidebarIcons";

export function SidebarRecent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const fetchConversations = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Refresh when navigating to chat
  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      fetchConversations();
    }
  }, [pathname, fetchConversations]);

  const navigateToChat = useCallback(
    (convId?: string) => {
      if (convId) {
        router.push(`/chat?conversation=${convId}`);
      } else {
        router.push("/chat");
      }
    },
    [router],
  );

  const renameConversation = useCallback(
    async (id: string, currentTitle: string) => {
      const newTitle = window.prompt("Rename conversation", currentTitle);
      if (!newTitle || newTitle === currentTitle || !user) return;

      await supabase
        .from("conversations")
        .update({ title: newTitle })
        .eq("id", id)
        .eq("user_id", user.id);

      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
      );
    },
    [user],
  );

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const hasMore = conversations.length >= 8;
  const displayConversations = conversations.slice(0, 7);

  if (conversations.length === 0) return null;

  return (
    <div className="flex flex-col items-start justify-center w-full">
      {/* Recent header */}
      <div className="flex gap-[10px] items-center overflow-clip px-[12px] py-[10px] w-full">
        <IconRecent className="size-[16px] shrink-0 text-sidebar-accent-foreground opacity-85" />
        <span className="text-sm font-medium text-sidebar-accent-foreground">
          Recent
        </span>
      </div>

      {/* Container for recent items */}
      <div className="flex flex-col gap-[2px] items-start overflow-clip px-[4px] py-[6px] w-full">
        {displayConversations.map((conv) => (
          <div
            key={conv.id}
            className="group/recent-item flex items-center justify-between px-[10px] py-[4px] w-full rounded-[5px] hover:bg-sidebar-accent transition-colors cursor-pointer"
            onClick={() => navigateToChat(conv.id)}
          >
            <span className="text-xs font-medium text-sidebar-foreground/65 truncate">
              {conv.title}
            </span>

            <div
              className="opacity-0 group-hover/recent-item:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded p-0.5 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                    aria-label="More options"
                  >
                    <IconMore className="size-[14px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right">
                  <DropdownMenuItem
                    onSelect={() => renameConversation(conv.id, conv.title)}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => deleteConversation(conv.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={() => router.push("/chat/history")}
            className="w-full px-[10px] py-[6px] text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground text-left rounded-[5px] hover:bg-sidebar-accent transition-colors"
          >
            Show more →
          </button>
        )}
      </div>
    </div>
  );
}
