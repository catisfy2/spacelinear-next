"use client";

import { cn } from "@/lib/utils";

export type PillMode = "date" | "subject" | "state";

const PILLS: { value: PillMode; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "subject", label: "Subject" },
  { value: "state", label: "State" },
];

export function FilterPills({
  value,
  onChange,
}: {
  value: PillMode;
  onChange: (value: PillMode) => void;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      {PILLS.map((pill) => (
        <button
          key={pill.value}
          type="button"
          onClick={() => onChange(pill.value)}
          className={cn(
            "flex items-center justify-center px-[18px] py-[6px] rounded-[30px] text-[14px] font-medium whitespace-nowrap transition-colors",
            value === pill.value
              ? "bg-[rgba(206,126,79,0.4)] text-[#784121]"
              : "bg-[#e0e0e0] text-[rgba(0,0,0,0.52)] hover:bg-[#d0d0d0]",
          )}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}
