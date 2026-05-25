"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, ChevronRight, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/lib/types";
import { useSidebar } from "@/components/ui/sidebar";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarChatDropdownProps {
  isActive: boolean;
}

export function SidebarChatDropdown({ isActive }: SidebarChatDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const [expanded, setExpanded] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const isOnChat =
    (pathname === "/chat" || pathname?.startsWith("/chat/")) ?? false;

  // Auto-expand when on chat page
  useEffect(() => {
    if (isOnChat && !isCollapsed) {
      setExpanded(true);
    }
  }, [isOnChat, isCollapsed]);

  // Fetch conversations when expanded
  useEffect(() => {
    if (!expanded || !user || isCollapsed) return;
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, user, isCollapsed]);

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

  const renameConversation = async (id: string, currentTitle: string) => {
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
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const hasMore = conversations.length >= 8;
  const displayConversations = conversations.slice(0, 7);

  // --- Shared menu items rendered inside both ContextMenu and DropdownMenu ---
  function ConversationMenuItems({ conv }: { conv: Conversation }) {
    return (
      <>
        <ContextMenuItem
          inset
          onSelect={() => renameConversation(conv.id, conv.title)}
        >
          Rename
        </ContextMenuItem>
        <ContextMenuItem inset onSelect={() => {}}>
          Pin
        </ContextMenuItem>
        <ContextMenuItem inset onSelect={() => {}}>
          Archive
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          inset
          onSelect={() => deleteConversation(conv.id)}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </ContextMenuItem>
      </>
    );
  }

  function DropdownMenuItems({ conv }: { conv: Conversation }) {
    return (
      <>
        <DropdownMenuItem
          inset
          onSelect={() => renameConversation(conv.id, conv.title)}
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem inset onSelect={() => {}}>
          Pin
        </DropdownMenuItem>
        <DropdownMenuItem inset onSelect={() => {}}>
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          inset
          onSelect={() => deleteConversation(conv.id)}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </>
    );
  }

  // Collapsed sidebar: just an icon button linking to /chat
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip="Chat">
          <a
            href="/chat"
            onClick={(e) => {
              e.preventDefault();
              navigateToChat();
            }}
          >
            <MessageSquare />
            <span>Chat</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive || expanded}
        onClick={() => setExpanded(!expanded)}
        tooltip="Chat"
      >
        <MessageSquare />
        <span className="flex-1 text-left">Chat</span>
        <ChevronRight
          className={cn(
            "ml-auto h-3.5 w-3.5 text-sidebar-foreground/50 transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </SidebarMenuButton>

      {expanded && (
        <SidebarMenuSub>
          {/* New Chat */}
          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              onClick={() => navigateToChat()}
              className="cursor-pointer"
            >
              <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-sidebar-foreground/50">
                +
              </span>
              <span>New Chat</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>

          {/* Empty state */}
          {conversations.length === 0 && (
            <SidebarMenuSubItem>
              <span className="block px-2 py-1.5 text-xs text-sidebar-foreground/60">
                No conversations yet
              </span>
            </SidebarMenuSubItem>
          )}

          {/* Conversations */}
          {displayConversations.map((conv) => (
            <SidebarMenuSubItem key={conv.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <SidebarMenuSubButton
                    onClick={() => navigateToChat(conv.id)}
                    className="cursor-pointer group/menu-sub-button"
                  >
                    <span className="flex-1 truncate">{conv.title}</span>
                    <span
                      className="opacity-0 group-hover/menu-sub-button:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center justify-center rounded p-0.5 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                            aria-label="Conversation options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                          <DropdownMenuItems conv={conv} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </SidebarMenuSubButton>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ConversationMenuItems conv={conv} />
                </ContextMenuContent>
              </ContextMenu>
            </SidebarMenuSubItem>
          ))}

          {/* Show more */}
          {hasMore && (
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                onClick={() => router.push("/chat/history")}
                className="cursor-pointer text-xs text-sidebar-foreground/60"
              >
                Show more →
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          )}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
