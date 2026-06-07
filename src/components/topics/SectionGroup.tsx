"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionGroup({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-[6px] items-start w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-[20px] py-[8px] rounded-[22px] transition-colors hover:bg-sl-surface-hover"
      >
        <span className="font-medium text-[18px] text-black">
          {label}
        </span>
        <ChevronDown
          className={cn(
            "size-[14px] text-muted-foreground transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col items-start w-full">
          {children}
        </div>
      )}
    </div>
  );
}
