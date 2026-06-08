"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MessageSquare, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface MochiChat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function SidebarMochi() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [chats, setChats] = useState<MochiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const activeChatId = searchParams.get("conversation");

  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user, searchParams]);

  const fetchChats = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("mochi_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    setChats((data ?? []) as MochiChat[]);
    setLoading(false);
  };

  const createNewChat = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("mochi_chats")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();
    if (error || !data) return;
    router.push(`/mochi?conversation=${data.id}`);
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between px-[12px] h-8 mt-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium text-sidebar-foreground">
            Mochi
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="flex items-center justify-center size-5 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Back to sidebar"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="px-[10px]">
        <button
          type="button"
          onClick={createNewChat}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-[6px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Plus className="size-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-2">
            <div className="h-4 w-32 animate-pulse rounded bg-sidebar-foreground/10" />
          </div>
        ) : chats.length === 0 ? (
          <p className="px-4 py-2 text-xs text-sidebar-foreground/60">
            No conversations yet
          </p>
        ) : (
          <SidebarMenu className="gap-0 px-[10px]">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    size="sm"
                    className={cn(
                      "px-3 py-2 h-auto rounded-[6px]",
                      "data-[active=true]:bg-sidebar-accent",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/mochi?conversation=${chat.id}`)}
                      className="flex items-start gap-2 w-full text-left"
                    >
                      <MessageSquare className="size-4 mt-0.5 shrink-0 text-sidebar-foreground/60" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-sidebar-foreground">
                          {chat.title}
                        </p>
                        <p className="text-xs text-sidebar-foreground/50">
                          {timeAgo(chat.updated_at)}
                        </p>
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        )}
      </div>
    </div>
  );
}
