"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

const SUGGESTIONS = [
  { label: "Create Study Plan", query: "Create a study plan for me" },
  { label: "Find me a course", query: "Find me a course" },
  { label: "Help me with homework", query: "Help me with my homework" },
];

export function SuggestionButtons() {
  const router = useRouter();

  const handleClick = useCallback(
    (query: string) => {
      router.push("/chat?q=" + encodeURIComponent(query));
    },
    [router],
  );

  return (
    <div className="flex w-[620px] items-center justify-center gap-[8px]">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion.label}
          type="button"
          onClick={() => handleClick(suggestion.query)}
          className="flex items-center justify-center rounded-[20px] border-[1.5px] border-black/20 bg-secondary/50 px-[26px] py-[10px] transition-colors hover:bg-secondary dark:border-border"
        >
          <p className="whitespace-nowrap text-[12px] font-normal text-foreground">
            {suggestion.label}
          </p>
        </button>
      ))}
    </div>
  );
}
