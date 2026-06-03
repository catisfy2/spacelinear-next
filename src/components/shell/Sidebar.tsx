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
  Settings,
  Palette,
  FileText,
  StickyNote,
  HelpCircle,
  Wand2,
} from "lucide-react";

import logoImg from "@/assets/icon-spacelinear.png";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { CreateTopicModal } from "@/components/topics/CreateTopicModal";
import { SidebarChatDropdown } from "@/components/chat/SidebarChatDropdown";
import {
  applyThemeMode,
  getStoredThemeMode,
  subscribeSystemTheme,
  type ThemeMode,
} from "@/lib/theme";

export function Sidebar() {
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

  const primaryNavItems = [
    { href: "/today", label: "Today", icon: CalendarCheck, exact: true },
    { href: "/topics", label: "Topics", icon: LayoutList },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/pulse", label: "Pulse", icon: BarChart3, exact: true },
  ];

  const secondaryNavItems = [
    { href: "/quiz", label: "Quiz", icon: HelpCircle },
    { href: "/materials", label: "Materials", icon: FileText },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/agent", label: "Agent", icon: Wand2 },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || (pathname?.startsWith(href + "/") ?? false);
  }

  return (
    <>
      <SidebarPrimitive collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center justify-between px-1">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={typeof logoImg === "string" ? logoImg : logoImg.src}
                alt="SpaceLinear"
                className="h-[34px] w-[34px] shrink-0 rounded-lg"
              />
              <span className="text-base font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                SpaceLinear
              </span>
            </Link>
            <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
              <button
                type="button"
                onClick={() => setShowCreateTopic(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="New topic"
              >
                <Plus className="h-4 w-4" />
              </button>
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href, item.exact)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarChatDropdown
                  isActive={
                    pathname === "/chat" ||
                    (pathname?.startsWith("/chat/") ?? false)
                  }
                />
                {secondaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={`Theme: ${themeLabel}`}
                onClick={cycleTheme}
              >
                <Palette />
                <span>
                  Theme:{" "}
                  <span className="text-sidebar-foreground/60">
                    {themeLabel}
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={displayName}>
                <Link href="/settings">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-sidebar-accent text-[8px] text-sidebar-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="truncate text-sm leading-tight">
                      {displayName}
                    </span>
                    <span className="text-[10px] leading-tight text-sidebar-foreground/60">
                      Free
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarPrimitive>
      {showCreateTopic && (
        <CreateTopicModal onClose={() => setShowCreateTopic(false)} />
      )}
    </>
  );
}
