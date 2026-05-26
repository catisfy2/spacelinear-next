"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Code,
  TextQuote,
  Sigma,
  Minus,
  Table,
  Pilcrow,
} from "lucide-react";

interface SlashItem {
  icon: React.ReactNode;
  label: string;
  snippet: string;
  cursorOffset?: number;
}

const items: SlashItem[] = [
  { icon: <Heading1 className="h-4 w-4" />, label: "Heading 1", snippet: "# " },
  {
    icon: <Heading2 className="h-4 w-4" />,
    label: "Heading 2",
    snippet: "## ",
  },
  {
    icon: <Heading3 className="h-4 w-4" />,
    label: "Heading 3",
    snippet: "### ",
  },
  {
    icon: <Bold className="h-4 w-4" />,
    label: "Bold",
    snippet: "****",
    cursorOffset: -2,
  },
  {
    icon: <Italic className="h-4 w-4" />,
    label: "Italic",
    snippet: "**",
    cursorOffset: -1,
  },
  {
    icon: <Strikethrough className="h-4 w-4" />,
    label: "Strikethrough",
    snippet: "~~~~",
    cursorOffset: -2,
  },
  { icon: <List className="h-4 w-4" />, label: "Bullet List", snippet: "- " },
  {
    icon: <ListOrdered className="h-4 w-4" />,
    label: "Numbered List",
    snippet: "1. ",
  },
  {
    icon: <CheckSquare className="h-4 w-4" />,
    label: "Task List",
    snippet: "- [ ] ",
  },
  {
    icon: <Link className="h-4 w-4" />,
    label: "Link",
    snippet: "[](url)",
    cursorOffset: -7,
  },
  {
    icon: <Code className="h-4 w-4" />,
    label: "Code Block",
    snippet: "```\n\n```",
    cursorOffset: -5,
  },
  {
    icon: <TextQuote className="h-4 w-4" />,
    label: "Blockquote",
    snippet: "> ",
  },
  {
    icon: <Sigma className="h-4 w-4" />,
    label: "Inline LaTeX",
    snippet: "$$",
    cursorOffset: -1,
  },
  {
    icon: <Pilcrow className="h-4 w-4" />,
    label: "Block LaTeX",
    snippet: "$$\n\n$$",
    cursorOffset: -4,
  },
  { icon: <Minus className="h-4 w-4" />, label: "Divider", snippet: "---\n" },
  {
    icon: <Table className="h-4 w-4" />,
    label: "Table",
    snippet:
      "| Col1 | Col2 | Col3 |\n|------|------|------|\n| Cell | Cell | Cell |\n",
  },
];

interface NoteSlashMenuProps {
  open: boolean;
  onClose: () => void;
  onInsert: (snippet: string, cursorOffset?: number) => void;
  anchorEl: HTMLElement | null;
}

export function NoteSlashMenu({
  open,
  onClose,
  onInsert,
  anchorEl,
}: NoteSlashMenuProps) {
  return (
    <Popover open={open} onOpenChange={(v) => !v && onClose()}>
      <PopoverAnchor virtualRef={{ current: anchorEl }} />
      <PopoverContent
        className="w-64 p-0"
        align="start"
        sideOffset={5}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Search commands..." className="h-9" />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup heading="Insert">
              {items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => {
                    onInsert(item.snippet, item.cursorOffset);
                    onClose();
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
