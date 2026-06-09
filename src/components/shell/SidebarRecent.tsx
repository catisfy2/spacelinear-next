"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRecent, IconMore } from "./SidebarIcons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecentConversation {
  id: string;
  title: string;
  updated_at: string;
}

export function SidebarRecent() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<RecentConversation[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mochi_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(8);
    setConversations((data ?? []) as RecentConversation[]);
  };

  const renameConversation = async (id: string, currentTitle: string) => {
    const newTitle = window.prompt("Rename conversation", currentTitle);
    if (!newTitle || newTitle === currentTitle || !user) return;
    await supabase
      .from("mochi_chats")
      .update({ title: newTitle })
      .eq("id", id)
      .eq("user_id", user.id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );
  };

  const pendingDeletions = useRef<Map<string, { timer: ReturnType<typeof setTimeout>; conv: RecentConversation }>>(new Map());

  useEffect(() => {
    return () => {
      pendingDeletions.current.forEach((p) => clearTimeout(p.timer));
      pendingDeletions.current.clear();
    };
  }, []);

  const deleteConversation = useCallback((id: string, title: string, conv: RecentConversation) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));

    const toastId = toast(`Deleting "${title}"`, {
      description: "Undo in 5s",
      action: {
        label: "Undo",
        onClick: () => {
          const pending = pendingDeletions.current.get(id);
          if (pending) {
            clearTimeout(pending.timer);
            pendingDeletions.current.delete(id);
            setConversations((prev) => {
              if (prev.some((c) => c.id === id)) return prev;
              return [conv, ...prev];
            });
            toast.dismiss(toastId);
          }
        },
      },
      duration: 6000,
    });

    const timer = setTimeout(async () => {
      pendingDeletions.current.delete(id);
      toast.dismiss(toastId);
      if (user) {
        await supabase.from("mochi_chats").delete().eq("id", id);
      }
    }, 5000);

    pendingDeletions.current.set(id, { timer, conv });
  }, [user]);

  if (conversations.length === 0) return null;

  return (
    <div className="flex flex-col items-start justify-center w-full">
      <div className="flex gap-[10px] items-center overflow-clip px-[12px] py-[10px] w-full">
        <IconRecent className="size-[16px] shrink-0 text-sidebar-accent-foreground opacity-85" />
        <span className="text-sm font-medium text-sidebar-accent-foreground">
          Recent
        </span>
      </div>

      <div className="flex flex-col gap-[2px] items-start overflow-clip px-[4px] py-[6px] w-full">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/mochi?conversation=${conv.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/mochi?conversation=${conv.id}`);
              }
            }}
            className="group/recent-item flex items-center justify-between px-[10px] py-[4px] w-full rounded-[5px] hover:bg-sidebar-accent transition-colors cursor-pointer text-left"
          >
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-sidebar-foreground/65 group-hover/recent-item:text-sidebar-foreground truncate block">
                {conv.title}
              </span>
            </div>

            <div className="opacity-0 group-hover/recent-item:opacity-100 transition-opacity shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
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
                    onSelect={() => deleteConversation(conv.id, conv.title, conv)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
