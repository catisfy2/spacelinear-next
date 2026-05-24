"use client";

import { useMemo } from "react";
import type { Topic, Subject } from "@/lib/types";
import { Target, Lightbulb, ClipboardList } from "lucide-react";

interface SuggestionCardsProps {
  topics: Topic[];
  subjects: Subject[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionCards({
  topics,
  subjects,
  onSelect,
}: SuggestionCardsProps) {
  const dueTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics
      .filter((t) => {
        if (t.state === "backlog") return false;
        const d = new Date(t.nextReviewDate);
        d.setHours(0, 0, 0, 0);
        return d < tomorrow;
      })
      .sort((a, b) => {
        const stateOrder: Record<string, number> = {
          relearning: 0,
          learning: 1,
          new: 2,
          reviewing: 3,
        };
        return (stateOrder[a.state] ?? 3) - (stateOrder[b.state] ?? 3);
      });
  }, [topics]);

  const getSubjectName = (subjectId: string | undefined) => {
    if (!subjectId) return null;
    const sub = subjects.find((s) => s.id === subjectId);
    return sub ? `${sub.icon} ${sub.name}` : null;
  };

  const cards: {
    icon: typeof Target;
    title: string;
    description: string;
    prompt: string;
    color: string;
  }[] = [];

  // s-1: First due topic
  const firstDue = dueTopics[0];
  if (firstDue) {
    const subName = getSubjectName(firstDue.subjectId);
    cards.push({
      icon: Target,
      title: `Revise: ${firstDue.title}`,
      description: subName
        ? `Due for review — ${subName}`
        : "Due for review today",
      prompt: `Help me revise "${firstDue.title}"${subName ? ` (${subName})` : ""}. I need a quick refresher on the key concepts.`,
      color: "from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40",
    });
  }

  // s-2: Second due topic
  const secondDue = dueTopics[1];
  if (secondDue) {
    const subName = getSubjectName(secondDue.subjectId);
    cards.push({
      icon: Lightbulb,
      title: `Deep dive: ${secondDue.title}`,
      description: subName
        ? `Master this topic — ${subName}`
        : "Strengthen your understanding",
      prompt: `I want to do a deep study session on "${secondDue.title}"${subName ? ` (${subName})` : ""}. Quiz me and help me master this topic.`,
      color: "from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40",
    });
  }

  // s-3: Create study plan
  cards.push({
    icon: ClipboardList,
    title: "Create a study plan",
    description: "Organize your learning journey",
    prompt:
      "Help me create a study plan. What topics should I focus on and how should I structure my learning sessions?",
    color: "from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40",
  });

  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Logo */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
        <svg
          viewBox="0 0 34 34"
          className="h-8 w-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 2L20.09 11.26L30 11.46L22.27 17.94L24.71 27.54L17 21.8L9.29 27.54L11.73 17.94L4 11.46L13.91 11.26L17 2Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>

      <h2 className="mb-1 text-center text-xl font-semibold text-foreground">
        What do you want to study today?
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Pick a suggestion or type your own question
      </p>

      <div className="grid w-full max-w-lg gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(card.prompt)}
              className={`group relative flex items-start gap-4 rounded-xl border bg-gradient-to-br p-4 text-left transition-all ${card.color}`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80 ring-1 ring-border">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {card.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
