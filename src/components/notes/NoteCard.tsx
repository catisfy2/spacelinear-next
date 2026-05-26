"use client";

import React from "react";
import Link from "next/link";
import { Star, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/constants";
import { getPreview } from "@/lib/note-parser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Note } from "@/lib/types";

interface NoteCardProps {
  note: Note;
  onStar: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onStar, onDelete }: NoteCardProps) {
  const preview = getPreview(note.content, 100);
  const displayTags = note.tags.slice(0, 3);
  const overflowCount = note.tags.length - 3;

  return (
    <Link
      href={`/notes/${note.id}`}
      className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50 cursor-pointer"
    >
      {/* Star button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStar(note.id);
        }}
        className={cn(
          "absolute right-2 top-2 z-10 h-7 w-7 rounded-md flex items-center justify-center transition-colors",
          note.starred
            ? "text-yellow-500 hover:text-yellow-600"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground",
        )}
      >
        <Star className={cn("h-4 w-4", note.starred && "fill-current")} />
      </button>

      {/* Title */}
      <h3 className="line-clamp-1 pr-6 text-sm font-semibold text-foreground">
        {note.title || "Untitled"}
      </h3>

      {/* Preview */}
      {preview && (
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {preview}
        </p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              #{tag}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              +{overflowCount}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">
          {formatRelativeTime(note.updatedAt)}
        </span>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(note.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
