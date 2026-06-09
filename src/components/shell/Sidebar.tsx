"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { SidebarToolbar } from "./SidebarToolbar";
import { SidebarRecent } from "./SidebarRecent";
import {
  IconLogo,
  IconChat,
  IconToday,
  IconTopics,
  IconSubjects,
  IconMaterials,
  IconSchedule,
  IconPerformance,
  IconQuiz,
  IconNotes,
} from "./SidebarIcons";

interface SidebarProps {
  onOpenCreateTopic?: () => void;
}

export function Sidebar({ onOpenCreateTopic }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Nahin";
  const initials = displayName.slice(0, 2).toUpperCase();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || (pathname?.startsWith(href + "/") ?? false);
  }

  function NavItem({
    href,
    label,
    icon: Icon,
    exact,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
  }) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive(href, exact)}
          tooltip={label}
          size="sm"
          className="group/menu-item px-[12px] py-[10px] h-[35px] rounded-[6px] data-[active=true]:bg-sidebar-accent data-[active=true]:rounded-[6px] group-data-[collapsible=icon]:mx-auto"
        >
          <Link href={href}>
            <Icon className="size-[16px] group-data-[collapsible=icon]:size-[18px]" />
            <span
              className={`text-sm font-medium transition-opacity group-data-[collapsible=icon]:hidden ${isActive(href, exact) ? "opacity-100" : "opacity-85 group-hover/menu-item:opacity-100"}`}
            >
              {label}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader className="flex flex-col gap-0 p-0 pt-[11px]">
        <div className="flex items-center justify-between group-data-[state=collapsed]:justify-center pl-[12px] pr-[12px] h-8">
          <div className="group-data-[collapsible=icon]:hidden size-8 shrink-0">
            <IconLogo className="size-8" />
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="size-[20px] flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-[20px]" />
            ) : (
              <PanelLeftClose className="size-[20px]" />
            )}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[state=expanded]:px-[10px] py-0 gap-[13px]">
        <SidebarToolbar onOpenCreateTopic={onOpenCreateTopic ?? (() => {})} />

        <div className="flex flex-col items-start group-data-[collapsible=icon]:items-center justify-center w-full">
          {/* Chat — unlabeled */}
          <SidebarMenu className="gap-0">
            <NavItem href="/chat" label="Chat" icon={IconChat} />
          </SidebarMenu>

          {/* TIMEFRAME */}
          <SidebarGroup className="w-full p-0">
            <SidebarGroupLabel className="px-[12px] text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Timeframe
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                <NavItem href="/today" label="Today" icon={IconToday} exact />
                <NavItem
                  href="/schedule"
                  label="Schedule"
                  icon={IconSchedule}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* STUDY */}
          <SidebarGroup className="w-full p-0">
            <SidebarGroupLabel className="px-[12px] text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Study
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                <NavItem
                  href="/subjects"
                  label="Subjects"
                  icon={IconSubjects}
                />
                <NavItem href="/topics" label="Topics" icon={IconTopics} />
                <NavItem href="/notes" label="Notes" icon={IconNotes} />
                <NavItem
                  href="/materials"
                  label="Materials"
                  icon={IconMaterials}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* EVALUATION */}
          <SidebarGroup className="w-full p-0">
            <SidebarGroupLabel className="px-[12px] text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Evaluation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                <NavItem href="/quiz" label="Quiz" icon={IconQuiz} exact />
                <NavItem
                  href="/pulse"
                  label="Performance"
                  icon={IconPerformance}
                  exact
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Recents — unlabeled */}
          <div className="group-data-[collapsible=icon]:hidden w-full">
            <div className="mx-[12px] my-2 border-t border-sidebar-border/40" />
            <SidebarRecent />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-0 pb-[12px] group-data-[state=expanded]:pl-[10px] group-data-[state=expanded]:pr-[10px]">
        <Link
          href="/settings"
          className="flex items-center gap-3 group-data-[state=collapsed]:justify-center h-[55px] w-full"
        >
          <Avatar className="size-[34px] rounded-full bg-sidebar-accent shrink-0">
            <AvatarFallback className="text-sm text-sidebar-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden flex flex-col">
            <span className="text-base font-medium text-sidebar-foreground leading-tight">
              {displayName}
            </span>
            <span className="text-sm text-sidebar-foreground leading-tight">
              Free
            </span>
          </div>
        </Link>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
