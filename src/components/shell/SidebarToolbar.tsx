"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { StudyModeOverlay } from "@/components/study-mode";
import { IconToolCreate, IconToolStudy, IconToolNote } from "./SidebarIcons";

interface SidebarToolbarProps {
  onOpenCreateTopic: () => void;
}

export function SidebarToolbar({ onOpenCreateTopic }: SidebarToolbarProps) {
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [showStudy, setShowStudy] = useState(false);

  const createButton = (
    <button
      type="button"
      className="bg-accent flex flex-1 h-[40px] items-center justify-center min-w-px overflow-clip rounded-[7px] hover:bg-sidebar-foreground/10 transition-colors"
      aria-label="Create"
      onClick={onOpenCreateTopic}
    >
      <IconToolCreate className="size-[16px] group-data-[collapsible=icon]:size-[18px] text-sidebar-accent-foreground" />
    </button>
  );

  if (isCollapsed) {
    return (
      <div className="flex justify-center py-[10px] w-full">{createButton}</div>
    );
  }

  return (
    <>
      <div className="flex gap-[10px] h-[56px] items-center py-[10px] w-full">
        {createButton}

        {/* Tool 2 — Study Mode */}
        <button
          type="button"
          className="bg-accent flex flex-1 h-[40px] items-center justify-center min-w-px overflow-clip rounded-[7px] hover:bg-sidebar-foreground/10 transition-colors"
          aria-label="Study mode"
          onClick={() => setShowStudy(true)}
        >
          <IconToolStudy className="size-[16px] group-data-[collapsible=icon]:size-[18px] text-sidebar-accent-foreground" />
        </button>

        {/* Tool 3 — Note Sidebar */}
        <button
          type="button"
          className="bg-accent flex flex-1 h-[40px] items-center justify-center min-w-px overflow-clip rounded-[7px] hover:bg-sidebar-foreground/10 transition-colors"
          aria-label="Note sidebar"
          onClick={() => router.push("/notes")}
        >
          <IconToolNote className="size-[16px] group-data-[collapsible=icon]:size-[18px] text-sidebar-accent-foreground" />
        </button>
      </div>
      {showStudy && (
        <StudyModeOverlay minutes={30} onClose={() => setShowStudy(false)} />
      )}
    </>
  );
}
