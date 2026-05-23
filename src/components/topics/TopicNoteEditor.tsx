"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";

function toPlainText(notes?: string): string {
  if (!notes) return "";
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === "object" && parsed !== null) return "";
  } catch {
    return notes;
  }
  return notes;
}

type SaveStatus = "idle" | "saving" | "saved";

interface TopicNoteEditorProps {
  topicId: string;
}

export function TopicNoteEditor({ topicId }: TopicNoteEditorProps) {
  const { topics, updateTopic } = useStore();
  const topic = topics.find((t) => t.id === topicId);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValue = useMemo(() => toPlainText(topic?.notes), [topic?.notes]);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, topicId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      setSaveStatus("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateTopic(topicId, { notes: nextValue });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("idle");
        }
      }, 800);
    },
    [topicId, updateTopic],
  );

  if (!topic) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
      {/* Save indicator */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 text-xs text-muted-foreground pointer-events-none">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-green-500">Saved</span>
          </>
        )}
      </div>

      <Textarea
        key={topicId}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Start writing..."
        className="min-h-[60vh] resize-y border-0 bg-transparent px-4 py-4 pr-24 text-base leading-7 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
