"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutList,
  BookOpen,
  Plus,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Settings,
  Palette,
  FileText,
  StickyNote,
} from "lucide-react";

import logoImg from "@/assets/icon-spacelinear.png";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateTopicModal } from "@/components/topics/CreateTopicModal";
import { SidebarNavItem } from "@/components/shell/SidebarNavItem";
import { SidebarChatDropdown } from "@/components/chat/SidebarChatDropdown";
import {
  applyThemeMode,
  getStoredThemeMode,
  subscribeSystemTheme,
  type ThemeMode,
} from "@/lib/theme";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore();
  const { user } = useAuth();
  const pathname = usePathname();
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    setThemeMode(getStoredThemeMode());
  }, []);

  useEffect(() => {
    if (themeMode !== "system") return;
    return subscribeSystemTheme(() => applyThemeMode("system"));
  }, [themeMode]);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const cycleTheme = () => {
    const next: ThemeMode =
      themeMode === "light"
        ? "dark"
        : themeMode === "dark"
          ? "system"
          : "light";
    applyThemeMode(next);
    setThemeMode(next);
  };

  const themeLabel =
    themeMode === "light" ? "Light" : themeMode === "dark" ? "Dark" : "System";

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-shrink-0 flex-col border-r border-border bg-sidebar",
        sidebarCollapsed ? "w-12 items-center" : "w-[244px]",
      )}
    >
      <div
        className={cn(
          "flex items-center pt-4 pb-2",
          sidebarCollapsed ? "px-2 flex-col gap-2" : "px-4 justify-between",
        )}
      >
        <img
          src={typeof logoImg === "string" ? logoImg : logoImg.src}
          alt="SpaceLinear"
          className="h-[34px] w-[34px] rounded-lg"
        />
        {sidebarCollapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateTopic(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="New topic"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <ScrollArea className={cn("flex-1", sidebarCollapsed ? "px-2" : "px-4")}>
        <div className="flex flex-col gap-2 py-2">
          <nav className="flex flex-col gap-0.5">
            <SidebarNavItem
              href="/today"
              label="Today"
              icon={CalendarCheck}
              collapsed={sidebarCollapsed}
              isActive={pathname === "/today"}
            />
            <SidebarNavItem
              href="/topics"
              label="Topics"
              icon={LayoutList}
              collapsed={sidebarCollapsed}
              isActive={
                pathname === "/topics" ||
                (pathname?.startsWith("/topics/") ?? false)
              }
            />
            <SidebarNavItem
              href="/subjects"
              label="Subjects"
              icon={BookOpen}
              collapsed={sidebarCollapsed}
              isActive={
                pathname === "/subjects" ||
                (pathname?.startsWith("/subjects/") ?? false)
              }
            />
            <SidebarNavItem
              href="/pulse"
              label="Pulse"
              icon={BarChart3}
              collapsed={sidebarCollapsed}
              isActive={pathname === "/pulse"}
            />
          </nav>

          <nav className="flex flex-col gap-0.5 mt-2">
            <SidebarChatDropdown
              collapsed={sidebarCollapsed}
              isActive={
                pathname === "/chat" ||
                (pathname?.startsWith("/chat/") ?? false)
              }
            />
            <SidebarNavItem
              href="/materials"
              label="Materials"
              icon={FileText}
              collapsed={sidebarCollapsed}
              isActive={
                pathname === "/materials" ||
                (pathname?.startsWith("/materials/") ?? false)
              }
            />
            <SidebarNavItem
              href="/notes"
              label="Notes"
              icon={StickyNote}
              collapsed={sidebarCollapsed}
              isActive={
                pathname === "/notes" ||
                (pathname?.startsWith("/notes/") ?? false)
              }
            />
          </nav>
        </div>
      </ScrollArea>

      <div
        className={cn(
          "mt-auto border-t border-border py-3",
          sidebarCollapsed
            ? "flex flex-col items-center gap-1 px-2"
            : "space-y-1 px-4",
        )}
      >
        {!sidebarCollapsed ? (
          <>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-lg p-2 text-sm text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={cycleTheme}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-sm text-sidebar-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Palette className="h-4 w-4 shrink-0" />
              <span className="truncate">
                Theme:{" "}
                <span className="text-muted-foreground">{themeLabel}</span>
              </span>
            </button>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-accent"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-foreground">
                  {displayName}
                </span>
                <span className="text-[10px] text-muted-foreground">Free</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={cycleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Theme: ${themeLabel}`}
            >
              <Palette className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center rounded-lg p-1 transition-colors hover:bg-accent"
              aria-label="Expand sidebar"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </>
        )}
      </div>
      {showCreateTopic && (
        <CreateTopicModal onClose={() => setShowCreateTopic(false)} />
      )}
    </aside>
  );
}
