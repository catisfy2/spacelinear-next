"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconRecent, IconMore } from "./SidebarIcons";

const PLACEHOLDER_ITEMS = [
  { id: "1", label: "It was a note" },
  { id: "2", label: "Is Physics good for" },
];

export function SidebarRecent() {
  return (
    <div className="flex flex-col items-start justify-center w-full">
      {/* Recent header */}
      <div className="flex gap-[10px] items-center overflow-clip px-[12px] py-[10px] w-full">
        <IconRecent className="size-[16px] shrink-0 text-sidebar-accent-foreground opacity-85" />
        <span className="text-sm font-medium text-sidebar-accent-foreground">
          Recent
        </span>
      </div>

      {/* Container for recent items */}
      <div className="flex flex-col gap-[2px] items-start overflow-clip px-[4px] py-[6px] w-full">
        {PLACEHOLDER_ITEMS.map((item) => (
          <div
            key={item.id}
            className="group/recent-item flex items-center justify-between px-[10px] py-[4px] w-full rounded-[5px] hover:bg-sidebar-accent transition-colors"
          >
            <span className="text-xs font-medium text-sidebar-foreground/65 truncate">
              {item.label}
            </span>

            <div className="opacity-0 group-hover/recent-item:opacity-100 transition-opacity shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded p-0.5 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                    aria-label="More options"
                  >
                    <IconMore className="size-[14px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right">
                  <DropdownMenuItem onSelect={() => {}}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {}}
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
