"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Check, Plus, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from "@/lib/constants";

export function CreateTopicModal({ onClose }: { onClose: () => void }) {
  const { addTopic, addSubject, subjects } = useStore();
  const { user } = useAuth();

  // Form state
  const [topicName, setTopicName] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  // Refs
  const subjectWrapperRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derived
  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.name.toLowerCase().startsWith(q),
    );
  }, [subjects, subjectQuery]);

  const exactMatch = subjectQuery.trim()
    ? subjects.some(
        (s) => s.name.toLowerCase() === subjectQuery.trim().toLowerCase(),
      )
    : false;

  const willCreateSubject =
    subjectQuery.trim().length > 0 && !selectedSubject && !exactMatch;

  type DropdownItem =
    | { type: "subject"; subject: (typeof subjects)[number] }
    | { type: "create"; name: string };

  // All dropdown items (subjects + optional "create" action)
  const dropdownItems: DropdownItem[] = useMemo(() => {
    const items: DropdownItem[] = filteredSubjects.map((s) => ({
      type: "subject",
      subject: s,
    }));
    if (willCreateSubject) {
      items.push({ type: "create", name: subjectQuery.trim() });
    }
    return items;
  }, [filteredSubjects, willCreateSubject, subjectQuery]);

  // Reset highlight when items change
  useEffect(() => {
    setHighlightedIdx(-1);
  }, [dropdownItems.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        subjectWrapperRef.current &&
        !subjectWrapperRef.current.contains(e.target as Node)
      ) {
        setShowSubjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIdx < 0 || !dropdownRef.current) return;
    const items = dropdownRef.current.children;
    if (items[highlightedIdx]) {
      (items[highlightedIdx] as HTMLElement).scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIdx]);

  const handleSubjectSelect = (s: {
    id: string;
    name: string;
    icon: string;
  }) => {
    setSelectedSubject(s);
    setSubjectQuery(s.name);
    setShowSubjectDropdown(false);
  };

  const handleClearSubject = () => {
    setSelectedSubject(null);
    setSubjectQuery("");
    setShowSubjectDropdown(true);
    subjectInputRef.current?.focus();
  };

  const handleSubjectChange = (value: string) => {
    setSubjectQuery(value);
    setSelectedSubject(null);
    setShowSubjectDropdown(true);
    setHighlightedIdx(-1);
  };

  const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSubjectDropdown || dropdownItems.length === 0) {
      if (e.key === "ArrowDown") {
        setShowSubjectDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIdx((prev) =>
          prev < dropdownItems.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIdx((prev) =>
          prev > 0 ? prev - 1 : dropdownItems.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIdx >= 0 && highlightedIdx < dropdownItems.length) {
          const item = dropdownItems[highlightedIdx];
          if (item.type === "subject") {
            handleSubjectSelect(item.subject);
          } else {
            // "Create" item — just close dropdown, subject will be created on submit
            setSelectedSubject(null);
            setSubjectQuery(item.name);
            setShowSubjectDropdown(false);
          }
        }
        break;
      case "Escape":
        setShowSubjectDropdown(false);
        break;
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !user) return;
    setSubmitting(true);

    try {
      // 1. Resolve subject — create automatically if it doesn't exist
      let finalSubjectId: string | null = selectedSubject?.id ?? null;

      if (!selectedSubject && subjectQuery.trim() && !exactMatch) {
        const newSubject = await addSubject(
          {
            name: subjectQuery.trim(),
            description: undefined,
            color:
              DEFAULT_SUBJECT_COLORS[
                Math.floor(Math.random() * DEFAULT_SUBJECT_COLORS.length)
              ],
            icon: DEFAULT_SUBJECT_ICONS[
              Math.floor(Math.random() * DEFAULT_SUBJECT_ICONS.length)
            ],
          },
          user.id,
        );
        finalSubjectId = newSubject.id;
      }

      // 2. Create the topic
      const topic = await addTopic(
        {
          title: topicName.trim(),
          description: description.trim() || undefined,
          notes: undefined,
          subjectId: finalSubjectId,
          tags: tags.length > 0 ? tags : [],
        },
        user.id,
      );

      // 3. Set as backlog (next review 31+ days in the future)
      const backlogDate = new Date();
      backlogDate.setDate(backlogDate.getDate() + 31);

      await supabase
        .from("topics")
        .update({ next_review_date: backlogDate.toISOString() })
        .eq("id", topic.id);

      // 4. Sync the store with the updated topic
      await useStore.getState().refreshTopicFromDb(topic.id);

      // 5. Trigger AI generation
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        const subjectName = finalSubjectId
          ? (subjects.find((s) => s.id === finalSubjectId)?.name ?? null)
          : subjectQuery.trim() || null;

        fetch("/api/topics/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: topic.id,
            title: topic.title,
            subjectName,
            accessToken,
          }),
        });
        useStore.getState().startPollingAiContent(topic.id);
      }

      toast.success(
        willCreateSubject ? "Topic & subject created!" : "Topic created!",
      );
      onClose();
    } catch (error) {
      console.error("Create topic error:", error);
      toast.error("Failed to create topic");
      setSubmitting(false);
    }
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !submitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">New Topic</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Topic Name ── */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Topic name
            </label>
            <input
              autoFocus
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g. Attention Mechanism"
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* ── Subject (autocomplete) ── */}
          <div ref={subjectWrapperRef} className="relative">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Subject
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={subjectInputRef}
                value={subjectQuery}
                onChange={(e) => handleSubjectChange(e.target.value)}
                onFocus={() => setShowSubjectDropdown(true)}
                onKeyDown={handleSubjectKeyDown}
                placeholder="Search or type a new subject…"
                className="w-full bg-muted border border-border rounded-md pl-8 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {selectedSubject && (
                <button
                  type="button"
                  onClick={handleClearSubject}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showSubjectDropdown && dropdownItems.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {dropdownItems.map((item, idx) =>
                  item.type === "subject" ? (
                    <button
                      key={item.subject.id}
                      type="button"
                      onClick={() => handleSubjectSelect(item.subject)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                        highlightedIdx === idx
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent",
                      )}
                    >
                      <span className="shrink-0">{item.subject.icon}</span>
                      <span className="flex-1 truncate">
                        {item.subject.name}
                      </span>
                      {selectedSubject?.id === item.subject.id && (
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ) : (
                    <button
                      key="create-subject"
                      type="button"
                      onClick={() => {
                        setSelectedSubject(null);
                        setSubjectQuery(item.name);
                        setShowSubjectDropdown(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left border-t border-border transition-colors",
                        highlightedIdx === idx
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Create{" "}
                        <strong className="text-foreground">{item.name}</strong>
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* ── Tags ── */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Tags
            </label>
            <div
              className="flex flex-wrap items-center gap-1.5 w-full bg-muted border border-border rounded-md px-3 py-2 min-h-[38px] focus-within:ring-1 focus-within:ring-ring cursor-text"
              onClick={() => tagInputRef.current?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    className="hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={
                  tags.length === 0 ? "Type and press Enter to add tags…" : ""
                }
                className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 p-0"
              />
            </div>
          </div>

          {/* ── Description ── */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of the topic…"
              rows={3}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {/* ── Backlog indicator ── */}
          <div className="bg-muted/50 rounded-lg border border-border px-3 py-2.5 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Saved as <strong className="text-foreground">backlog</strong> — it
              will become available for review in the future
            </span>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!topicName.trim() || submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating…" : "Create"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
