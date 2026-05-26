"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  MoreHorizontal,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { NoteRenderer } from "@/components/notes/NoteRenderer";
import { NoteSlashMenu } from "@/components/notes/NoteSlashMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NoteEditor() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const noteId = params?.id;

  const { notes, fetchNotes, createNote, updateNote, toggleNoteStar, deleteNote } =
    useStore();

  const existingNote = noteId ? notes.find((n) => n.id === noteId) : null;

  const [title, setTitle] = useState(existingNote?.title ?? "Untitled");
  const [content, setContent] = useState(existingNote?.content ?? "");
  const [tags, setTags] = useState<string[]>(existingNote?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showPreview, setShowPreview] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashAnchor, setSlashAnchor] = useState<HTMLElement | null>(null);
  const [slashCursorPos, setSlashCursorPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes if not loaded
  useEffect(() => {
    if (!user || notes.length > 0 || initialized) return;
    fetchNotes(user.id).then(() => setInitialized(true));
  }, [user, notes.length, fetchNotes, initialized]);

  // Load existing note or create new one
  useEffect(() => {
    if (!noteId || !existingNote) return;
    setTitle(existingNote.title);
    setContent(existingNote.content);
    setTags(existingNote.tags);
  }, [noteId, existingNote]);

  // Auto-save debounce
  useEffect(() => {
    if (!noteId) return;
    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updateNote(noteId, { title, content, tags });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
        toast.error("Failed to save");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [noteId, title, content, tags, updateNote]);

  // Create new note on mount if no noteId
  useEffect(() => {
    if (noteId || !user || !initialized) return;
    createNote(user.id)
      .then((note) => router.replace(`/notes/${note.id}`))
      .catch(() => toast.error("Failed to create note"));
  }, [noteId, user, initialized, createNote, router]);

  const handleStar = useCallback(async () => {
    if (!noteId) return;
    await toggleNoteStar(noteId);
  }, [noteId, toggleNoteStar]);

  const handleDelete = useCallback(async () => {
    if (!noteId) return;
    await deleteNote(noteId);
    toast.success("Note deleted");
    router.push("/notes");
  }, [noteId, deleteNote, router]);

  // Tag input handlers
  const addTag = useCallback(
    (raw: string) => {
      const t = raw.replace(/^#/, "").trim().toLowerCase();
      if (!t || tags.includes(t)) return;
      setTags((prev) => [...prev, t]);
      setTagInput("");
    },
    [tags],
  );

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput);
      }
      if (e.key === "Backspace" && !tagInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, tags, addTag],
  );

  // Keyboard shortcuts
  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = content.slice(start, end);

      // Slash menu
      if (e.key === "/" && start === end) {
        // Check if the character before cursor is whitespace or start of line
        const charBefore = content[start - 1];
        if (!charBefore || charBefore === " " || charBefore === "\n") {
          setSlashCursorPos(start);
          setSlashAnchor(ta);
          // Open after a small delay to let the "/" be typed
          setTimeout(() => setSlashOpen(true), 10);
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b": {
            e.preventDefault();
            const wrapped = `**${sel || "bold"}**`;
            const newContent =
              content.slice(0, start) + wrapped + content.slice(end);
            setContent(newContent);
            break;
          }
          case "i": {
            e.preventDefault();
            const wrappedI = `*${sel || "italic"}*`;
            const newContentI =
              content.slice(0, start) + wrappedI + content.slice(end);
            setContent(newContentI);
            break;
          }
          case "k": {
            e.preventDefault();
            const linkText = sel || "text";
            const linkMarkdown = `[${linkText}](url)`;
            const newContentL =
              content.slice(0, start) + linkMarkdown + content.slice(end);
            setContent(newContentL);
            break;
          }
          case "m": {
            if (e.shiftKey) {
              e.preventDefault();
              const eq = `$${sel || "equation"}$`;
              const newContentE =
                content.slice(0, start) + eq + content.slice(end);
              setContent(newContentE);
            }
            break;
          }
        }
      }
    },
    [content],
  );

  // Slash menu insert
  const handleSlashInsert = useCallback(
    (snippet: string, cursorOffset?: number) => {
      if (slashCursorPos === null) return;
      // Remove the "/" that triggered the menu
      const beforeSlash = content.slice(0, slashCursorPos - 1);
      const afterSlash = content.slice(slashCursorPos);
      const newContent = beforeSlash + snippet + afterSlash;
      setContent(newContent);
      setSlashOpen(false);
      setSlashCursorPos(null);

      // Restore focus to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos =
            slashCursorPos - 1 + snippet.length + (cursorOffset ?? 0);
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [content, slashCursorPos],
  );

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
        ? "Saved"
        : "Unsaved";

  if (!noteId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Creating…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col min-h-screen px-6 py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/notes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">{saveLabel}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStar}
            className={cn(existingNote?.starred && "text-yellow-500")}
          >
            <Star
              className={cn(
                "h-4 w-4",
                existingNote?.starred && "fill-current",
              )}
            />
          </Button>

          {/* Toggle preview */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((p) => !p)}
            className="text-xs"
          >
            {showPreview ? "Edit" : "Preview"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        className="mb-4 border-0 bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/40"
      />

      {/* Tags */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={() => tagInput && addTag(tagInput)}
          placeholder={tags.length === 0 ? "Add tags (press Enter or comma)…" : "Add tag…"}
          className="h-7 w-32 border-0 bg-muted px-2 text-xs"
        />
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-card p-6">
          {content ? (
            <NoteRenderer content={content} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nothing to preview yet.
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          placeholder="Start writing in markdown…"
          className="flex-1 resize-none rounded-lg border border-border bg-card p-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-primary/50"
        />
      )}

      {/* Slash menu */}
      <NoteSlashMenu
        open={slashOpen}
        onClose={() => setSlashOpen(false)}
        onInsert={handleSlashInsert}
        anchorEl={slashAnchor}
      />
    </div>
  );
}
