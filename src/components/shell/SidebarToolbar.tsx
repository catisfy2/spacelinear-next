"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import {
  IconToolCreate,
  IconToolStudy,
  IconToolNote,
} from "./SidebarIcons";

interface SidebarToolbarProps {
  onOpenCreateTopic: () => void;
}

export function SidebarToolbar({ onOpenCreateTopic }: SidebarToolbarProps) {
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const createButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="bg-accent flex flex-1 h-[40px] items-center justify-center min-w-px overflow-clip rounded-[7px] hover:bg-sidebar-foreground/10 transition-colors"
          aria-label="Create"
        >
          <IconToolCreate className="size-[16px] group-data-[collapsible=icon]:size-[18px] text-sidebar-accent-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right">
        <DropdownMenuItem onSelect={() => router.push("/chat")}>
          <span>Chat</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenCreateTopic}>
          <span>Create Topic</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <span>Create Note</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isCollapsed) {
    return (
      <div className="flex justify-center py-[10px] w-full">
        {createButton}
      </div>
    );
  }

  return (
    <div className="flex gap-[10px] h-[56px] items-center py-[10px] w-full">
      {createButton}

      {/* Tool 2 — Study Mode (no-op) */}
      <button
        type="button"
        className="bg-accent flex flex-1 h-[40px] items-center justify-center min-w-px overflow-clip rounded-[7px] hover:bg-sidebar-foreground/10 transition-colors"
        aria-label="Study mode"
        onClick={() => {}}
      >
        <IconToolStudy className="size-[16px] group-data-[collapsible=icon]:size-[18px] text-sidebar-accent-foreground" />
      </button>

      {/* Tool 3 — Note Sidebar (no-op) */}
      <button
        type="button"
        className="bg-accent flex flex-1 h-[40px] items-center justify-center min-w-px overflow-clip rounded-[7px] hover:bg-sidebar-foreground/10 transition-colors"
        aria-label="Note sidebar"
        onClick={() => {}}
      >
        <IconToolNote className="size-[16px] group-data-[collapsible=icon]:size-[18px] text-sidebar-accent-foreground" />
      </button>
    </div>
  );
}
