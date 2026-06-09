"use client";

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { StudyPlanData, StudyPlanSubject, StudyPlanTopic } from "@/lib/types";

interface PlanReviewProps {
  planId: string;
  planData: StudyPlanData;
  onApplied: () => void;
  onClose: () => void;
}

export function PlanReview({ planId, planData, onApplied, onClose }: PlanReviewProps) {
  const [applying, setApplying] = useState(false);

  const totalTopics = planData.subjects.reduce(
    (sum, s) => sum + s.topics.length,
    0
  );

  const handleApply = async () => {
    setApplying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        toast.error("You must be logged in");
        setApplying(false);
        return;
      }

      const response = await fetch(`/api/agent/plan/${planId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to apply plan");
      }

      toast.success(
        `Plan applied! ${result.subjectsCreated} subjects and ${result.topicsCreated} topics created.`
      );
      onApplied();
      onClose();
    } catch (error) {
      console.error("Apply plan error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to apply plan"
      );
    } finally {
      setApplying(false);
    }
  };

  const resourceTypeColor: Record<string, string> = {
    video: "text-blue-500",
    article: "text-green-500",
    course: "text-purple-500",
    book: "text-orange-500",
    other: "text-gray-500",
  };

  return (
    <div className="flex flex-col gap-4 w-full max-h-[70vh] min-h-0 overflow-y-auto">
      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-card-foreground/60">
        <span>{planData.subjects.length} subjects</span>
        <span>{totalTopics} topics</span>
      </div>

      {/* Subject tree */}
      {planData.subjects.map((subject, si) => (
        <SubjectSection key={si} subject={subject} resourceTypeColor={resourceTypeColor} />
      ))}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleApply}
          disabled={applying}
          className="bg-primary flex items-center justify-center px-6 py-2 rounded-[31px] text-[16px] font-sans font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
        >
          {applying ? "Applying..." : "Apply Plan"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={applying}
          className="bg-muted flex items-center justify-center px-6 py-2 rounded-[31px] text-[16px] font-sans font-medium text-card-foreground/60 transition-opacity hover:opacity-90"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SubjectSection({
  subject,
  resourceTypeColor,
}: {
  subject: StudyPlanSubject;
  resourceTypeColor: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="text-base">{expanded ? "▾" : "▸"}</span>
        <span className="font-semibold text-[15px] text-card-foreground">
          {subject.name}
        </span>
        <span className="text-xs text-card-foreground/40 ml-auto">
          {subject.topics.length} topics
        </span>
      </button>

      {expanded && (
        <div className="divide-y divide-border">
          {subject.topics.map((topic, ti) => (
            <TopicRow
              key={ti}
              topic={topic}
              resourceTypeColor={resourceTypeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicRow({
  topic,
  resourceTypeColor,
}: {
  topic: StudyPlanTopic;
  resourceTypeColor: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4 py-2.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        <span className="text-xs text-card-foreground/30 w-5 shrink-0">
          {topic.order}
        </span>
        <span className="flex-1 text-[14px] text-card-foreground font-medium">
          {topic.title}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-card-foreground/50">
          {topic.difficulty}
        </span>
        <span className="text-[11px] text-card-foreground/40 shrink-0">
          ~{topic.estimated_minutes}m
        </span>
      </button>

      {expanded && (
        <div className="ml-7 mt-2 space-y-2">
          <p className="text-[13px] text-card-foreground/60">
            {topic.description}
          </p>

          {topic.prerequisites.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[11px] text-card-foreground/40">
                Prerequisites:
              </span>
              {topic.prerequisites.map((pr, i) => (
                <span
                  key={i}
                  className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600"
                >
                  {pr}
                </span>
              ))}
            </div>
          )}

          {topic.resources.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] text-card-foreground/40">
                Resources:
              </span>
              {topic.resources.map((r, ri) => (
                <a
                  key={ri}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[13px] text-card-foreground/70 hover:text-primary transition-colors"
                >
                  <span className={`text-xs ${resourceTypeColor[r.type] ?? resourceTypeColor.other}`}>
                    {r.type === "video" ? "▶" : r.type === "article" ? "📄" : r.type === "course" ? "🎓" : r.type === "book" ? "📕" : "🔗"}
                  </span>
                  <span className="truncate">{r.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
