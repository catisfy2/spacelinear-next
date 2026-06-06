"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateWindow } from "@/components/topics/CreateWindow";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Mobile hamburger trigger that uses the shadcn SidebarProvider context.
 */
function MobileTrigger() {
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="absolute left-3 top-3 z-40 md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 border-border bg-background/95 shadow-sm backdrop-blur"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Auto-closes the mobile sidebar on navigation.
 */
function AutoCloseMobileSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [showCreateTopic, setShowCreateTopic] = useState(false);

  // Global shortcut: Ctrl+Shift+O to open the Create Topic dialog
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyO") {
      const tag = e.target instanceof HTMLElement ? e.target.tagName : null;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      setShowCreateTopic(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <SidebarProvider>
      <AutoCloseMobileSidebar />
      <div className="flex h-screen w-full">
        <Sidebar onOpenCreateTopic={() => setShowCreateTopic(true)} />
        <SidebarInset className="overflow-hidden">
          <MobileTrigger />
          <div className={cn("flex-1 overflow-y-auto", isMobile && "pt-14")}>
            {children}
          </div>
        </SidebarInset>
      </div>
      {showCreateTopic && (
        <CreateWindow onClose={() => setShowCreateTopic(false)} />
      )}
    </SidebarProvider>
  );
}
