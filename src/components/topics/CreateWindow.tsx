"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from "@/lib/constants";

export function CreateWindow({ onClose }: { onClose: () => void }) {
  const { addTopic, addSubject, subjects } = useStore();
  const { user } = useAuth();

  // ── Mode ───────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"topics" | "agent">("topics");

  // ── Topics fields ──────────────────────────────────────────────────────────
  const [topicName, setTopicName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<{
    id: string;
    name: string;
    icon: string;
  } | null>(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagsInput, setShowTagsInput] = useState(false);

  // ── Agent fields ───────────────────────────────────────────────────────────
  const [agentPrompt, setAgentPrompt] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const subjectWrapperRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
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

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setHighlightedIdx(-1);
  }, [dropdownItems.length]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        subjectWrapperRef.current &&
        !subjectWrapperRef.current.contains(e.target as Node)
      ) {
        setShowSubjectDropdown(false);
      }
      if (
        resourcesRef.current &&
        !resourcesRef.current.contains(e.target as Node)
      ) {
        setShowResourcesDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (highlightedIdx < 0 || !dropdownRef.current) return;
    const items = dropdownRef.current.children;
    if (items[highlightedIdx]) {
      (items[highlightedIdx] as HTMLElement).scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIdx]);

  // ── Subject handlers ───────────────────────────────────────────────────────
  const handleSubjectSelect = (s: {
    id: string;
    name: string;
    icon: string;
  }) => {
    setSelectedSubject(s);
    setSubjectQuery(s.name);
    setShowSubjectDropdown(false);
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

  // ── Tags handlers ──────────────────────────────────────────────────────────
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

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleCreateTopic = async () => {
    if (!topicName.trim() || !user) return;
    setSubmitting(true);
    try {
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

      const backlogDate = new Date();
      backlogDate.setDate(backlogDate.getDate() + 31);
      await supabase
        .from("topics")
        .update({ next_review_date: backlogDate.toISOString() })
        .eq("id", topic.id);
      await useStore.getState().refreshTopicFromDb(topic.id);

      toast.success(
        willCreateSubject ? "Topic & subject created!" : "Topic created!",
      );

      if (keepOpen) {
        setTopicName("");
        setDescription("");
        setSubjectQuery("");
        setSelectedSubject(null);
        setTags([]);
        setTagInput("");
        setSubmitting(false);
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Create topic error:", error);
      toast.error("Failed to create topic");
      setSubmitting(false);
    }
  };

  const handleGenerate = () => {
    toast.info("Agent generation coming soon");
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
        className="bg-card flex flex-col gap-3 px-[22px] py-4 rounded-[22px] w-full max-w-xl shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between w-full shrink-0">
          <span className="font-sans font-medium text-[16px] text-card-foreground">
            {mode === "topics" ? "New Topic" : "Agent"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="relative shrink-0 size-[16px]"
          >
            <img
              alt=""
              className="block max-w-none size-full"
              src="/icons/close.svg"
            />
          </button>
        </div>

        {/* ── Topic Input (Topics mode) ── */}
        {mode === "topics" && (
          <div className="flex items-center py-[10px] shrink-0 w-full">
            <input
              autoFocus
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Write your topic here"
              className="w-full bg-transparent border-none outline-none text-[18px] text-card-foreground placeholder:text-card-foreground/50 font-sans font-medium p-0"
            />
          </div>
        )}

        {/* ── Agent Input (Agent mode) ── */}
        {mode === "agent" && (
          <div className="flex items-center py-[10px] shrink-0 w-full">
            <input
              autoFocus
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              placeholder="Write what you want to study"
              className="w-full bg-transparent border-none outline-none text-[18px] text-card-foreground placeholder:text-card-foreground/50 font-sans font-medium p-0"
            />
          </div>
        )}

        {/* ── Description ── */}
        <div className="flex flex-1 items-start min-h-px py-[5px] w-full">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              mode === "topics"
                ? "Write Description"
                : "Explain what goals you want to achieve throughout this journey"
            }
            rows={2}
            className="w-full bg-transparent border-none outline-none text-[16px] text-card-foreground placeholder:text-card-foreground/50 font-sans font-medium p-0 resize-none"
          />
        </div>

        {/* ── Category Row (Topics mode only) ── */}
        {mode === "topics" && (
          <div className="flex gap-[6px] items-center flex-wrap shrink-0">
            {/* Subject Pill */}
            <div ref={subjectWrapperRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                className={cn(
                  "bg-muted flex gap-1 items-center justify-center px-[14px] py-1 rounded-[31px] shrink-0 transition-colors",
                  selectedSubject && "bg-primary/10",
                )}
              >
                <img
                  alt=""
                  className="size-[13px] shrink-0"
                  src="/icons/subject.svg"
                />
                <span className="font-sans font-medium text-[12px] text-card-foreground/60 whitespace-nowrap">
                  {selectedSubject ? selectedSubject.name : "Subject"}
                </span>
                <ChevronDown className="size-[10px] text-card-foreground/60 shrink-0" />
              </button>

              {showSubjectDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-1 left-0 w-56 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <div className="p-2">
                    <input
                      ref={subjectInputRef}
                      value={subjectQuery}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      onKeyDown={handleSubjectKeyDown}
                      placeholder="Search subjects..."
                      className="w-full bg-muted border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
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
                        <span>
                          Create{" "}
                          <strong className="text-foreground">
                            {item.name}
                          </strong>
                        </span>
                      </button>
                    ),
                  )}
                  {dropdownItems.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {subjectQuery.trim()
                        ? "Press Enter to create"
                        : "Type to search or create"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chapter Pill */}
            <button
              type="button"
              onClick={() => toast.info("Chapter support coming soon")}
              className="bg-muted flex gap-1 items-center justify-center px-[14px] py-1 rounded-[31px] shrink-0 transition-colors hover:bg-muted/80"
            >
              <img
                alt=""
                className="h-[11px] w-[13px] shrink-0"
                src="/icons/chapter.svg"
              />
              <span className="font-sans font-medium text-[12px] text-card-foreground/60 whitespace-nowrap">
                Chapter
              </span>
            </button>

            {/* Tags Pill */}
            <div className="relative">
              {!showTagsInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowTagsInput(true);
                    setTimeout(() => tagInputRef.current?.focus(), 0);
                  }}
                  className="bg-muted flex gap-1 items-center justify-center px-[14px] py-1 rounded-[31px] shrink-0 transition-colors hover:bg-muted/80"
                >
                <img
                  alt=""
                  className="size-[13px] shrink-0"
                  src="/icons/tags.svg"
                />
                <span className="font-sans font-medium text-[12px] text-card-foreground/60 whitespace-nowrap">
                  Tags
                </span>
                </button>
              ) : (
                <div
                  className="bg-muted flex items-center gap-1 px-[10px] py-1 rounded-[31px] min-w-[130px]"
                  onClick={() => tagInputRef.current?.focus()}
                >
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-card/60 rounded-full px-2 py-0.5 text-[12px] font-medium text-card-foreground whitespace-nowrap"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(tag);
                        }}
                        className="hover:opacity-70"
                      >
                        <img
                          alt=""
                          className="size-[10px]"
                          src="/icons/close.svg"
                        />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      addTag(e);
                      if (e.key === "Escape") {
                        setShowTagsInput(false);
                      }
                    }}
                    onBlur={() => {
                      if (!tagInput && tags.length === 0) {
                        setShowTagsInput(false);
                      }
                    }}
                    placeholder={tags.length === 0 ? "Type & Enter..." : ""}
                    className="flex-1 min-w-[50px] bg-transparent border-none outline-none text-[12px] text-card-foreground placeholder:text-card-foreground/40 font-sans p-0"
                  />
                </div>
              )}
            </div>

            {/* Resources Pill */}
            <div ref={resourcesRef} className="relative">
              <button
                type="button"
                onClick={() => setShowResourcesDropdown(!showResourcesDropdown)}
                className="bg-muted flex gap-1 items-center justify-center px-[14px] py-1 rounded-[31px] shrink-0 transition-colors hover:bg-muted/80"
              >
                <img
                  alt=""
                  className="h-[13px] w-[12px] shrink-0"
                  src="/icons/resources.svg"
                />
                <span className="font-sans font-medium text-[12px] text-card-foreground/60 whitespace-nowrap">
                  Resources
                </span>
              </button>

              {showResourcesDropdown && (
                <div className="absolute z-10 mt-1 right-0 w-44 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResourcesDropdown(false);
                      toast.info("File upload coming soon");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground hover:bg-accent transition-colors"
                  >
                    Upload files
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResourcesDropdown(false);
                      toast.info("Materials browser coming soon");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground hover:bg-accent transition-colors border-t border-border"
                  >
                    Choose from materials
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Action Container ── */}
        <div className="flex items-center justify-between shrink-0 w-full">
          {/* Topics/Agent Toggle */}
          <div className="border border-primary/70 flex items-center rounded-full shrink-0">
            <button
              type="button"
              onClick={() => setMode("topics")}
              className={cn(
                "flex items-center justify-center px-[22px] py-[6px] rounded-full text-[16px] font-sans font-medium transition-colors",
                mode === "topics"
                  ? "bg-primary text-primary-foreground"
                  : "text-card-foreground/60 hover:text-card-foreground",
              )}
            >
              Topics
            </button>
            <button
              type="button"
              onClick={() => setMode("agent")}
              className={cn(
                "flex items-center justify-center px-[22px] py-[6px] rounded-full text-[16px] font-sans font-medium transition-colors",
                mode === "agent"
                  ? "bg-primary text-primary-foreground"
                  : "text-card-foreground/60 hover:text-card-foreground",
              )}
            >
              Agent
            </button>
          </div>

          {/* Right side */}
          {mode === "topics" ? (
            <div className="flex gap-2 items-center shrink-0">
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setKeepOpen(!keepOpen)}
                  className="relative shrink-0"
                >
                  <img
                    alt=""
                    className="block h-5 w-10"
                    src={
                      keepOpen
                        ? "/icons/toggle-on.svg"
                        : "/icons/toggle-off.svg"
                    }
                  />
                </button>
                <span className="text-muted-foreground text-[16px] font-sans font-medium whitespace-nowrap">
                  create more
                </span>
              </div>
              <button
                type="button"
                onClick={handleCreateTopic}
                disabled={!topicName.trim() || submitting}
                className="bg-primary flex items-center justify-center px-[22px] py-[6px] rounded-[31px] text-[18px] font-sans font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              >
                {submitting ? "Creating..." : "Create Topics"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              className="bg-primary flex items-center justify-center px-[22px] py-[6px] rounded-[31px] text-[18px] font-sans font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Generate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
