"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { TeamMember } from "@/lib/docs-utils";

interface SearchableSection {
  slug: string;
  title: string;
  category: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SearchableSection[];
  team: TeamMember[];
}

export function SearchDialog({
  open,
  onOpenChange,
  sections,
  team,
}: SearchDialogProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const handleSelect = useCallback(
    (slug: string) => {
      onOpenChange(false);
      const el = document.getElementById(`section-${slug}`);
      el?.scrollIntoView({ behavior: "smooth" });
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search docs, sections, team members..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Sections">
          {sections.map((section) => (
            <CommandItem
              key={section.slug}
              value={section.title}
              onSelect={() => handleSelect(section.slug)}
            >
              <span className="mr-2 text-xs text-muted-foreground">
                {section.category === "pitch" ? "📋" : section.category === "technical" ? "⚙️" : "📄"}
              </span>
              {section.title}
            </CommandItem>
          ))}
        </CommandGroup>
        {team.length > 0 && (
          <CommandGroup heading="Team">
            {team.map((member) => (
              <CommandItem
                key={member.id}
                value={member.full_name}
                onSelect={() => handleSelect("team")}
              >
                <span className="mr-2 text-xs text-muted-foreground">👤</span>
                {member.full_name} — {member.role}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
