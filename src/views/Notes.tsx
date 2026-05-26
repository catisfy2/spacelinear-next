"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { NoteCard } from "@/components/notes/NoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";

type SortField = "updated_at" | "created_at" | "title";

export function NotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notes, fetchNotes, createNote, toggleNoteStar, deleteNote } =
    useStore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [starredOnly, setStarredOnly] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotes(user.id);
  }, [user, fetchNotes]);

  const handleNewNote = useCallback(async () => {
    if (!user) return;
    try {
      const note = await createNote(user.id);
      router.push(`/notes/${note.id}`);
    } catch {
      toast.error("Failed to create note");
    }
  }, [user, createNote, router]);

  const handleStar = useCallback(
    (id: string) => {
      toggleNoteStar(id);
    },
    [toggleNoteStar],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteNote(id);
      toast.success("Note deleted");
    },
    [deleteNote],
  );

  const displayedNotes = useMemo(() => {
    let list = [...notes];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    // Filter starred
    if (starredOnly) {
      list = list.filter((n) => n.starred);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortField) {
        case "updated_at":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "created_at":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return list;
  }, [notes, searchQuery, starredOnly, sortField]);

  return (
    <PageShell>
      <PageHeader
        title="Notes"
        description="Write and organize your markdown notes."
        actions={
          <Button onClick={handleNewNote}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Note
          </Button>
        }
      />

      {/* Search & filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, content, or tags..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select
          value={sortField}
          onValueChange={(v) => setSortField(v as SortField)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at">Last Updated</SelectItem>
            <SelectItem value="created_at">Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>

        <Toggle
          pressed={starredOnly}
          onPressedChange={setStarredOnly}
          aria-label="Starred only"
          className="gap-1.5"
        >
          <Star className="h-4 w-4" />
          Starred
        </Toggle>
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <div className="text-3xl">📝</div>
          <h3 className="text-lg font-semibold text-foreground">
            No notes yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create your first note to start writing and organizing your ideas.
          </p>
          <Button onClick={handleNewNote} variant="default" className="mt-2">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Note
          </Button>
        </div>
      )}

      {/* No results */}
      {notes.length > 0 && displayedNotes.length === 0 && (
        <div className="flex min-h-[20vh] items-center justify-center text-sm text-muted-foreground">
          No notes match your search.
        </div>
      )}

      {/* Grid */}
      {displayedNotes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onStar={handleStar}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
