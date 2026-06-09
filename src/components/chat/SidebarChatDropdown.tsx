"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface SidebarChatDropdownProps {
  isActive: boolean;
}

export function SidebarChatDropdown({ isActive }: SidebarChatDropdownProps) {
  const router = useRouter();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const [expanded, setExpanded] = useState(false);

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip="Chat">
          <a
            href="/chat"
            onClick={(e) => {
              e.preventDefault();
              router.push("/chat");
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
          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              onClick={() => router.push("/chat")}
              className="cursor-pointer"
            >
              <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-sidebar-foreground/50">
                +
              </span>
              <span>New Chat</span>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>

          <SidebarMenuSubItem>
            <SidebarMenuSubButton
              onClick={() => router.push("/chat/history")}
              className="cursor-pointer text-xs text-sidebar-foreground/60"
            >
              Show more →
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
