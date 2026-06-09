"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ModeSelectorCard,
  DueTopicPicker,
  TopicPicker,
  MaterialPicker,
  CustomTopicInput,
  QuizConfigForm,
  GenerationProgress,
} from "@/components/quiz";
import { useQuizGenerator } from "@/hooks/useQuizGenerator";
import { useStartQuizSession } from "@/hooks/useQuizSession";
import type { GenerationMode, QuestionDifficulty } from "@/types/quiz";

export function QuizNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") as GenerationMode | null;

  const [mode, setMode] = useState<GenerationMode | null>(initialMode);
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const [supplementWithWeb, setSupplementWithWeb] = useState(false);
  const [config, setConfig] = useState({
    questionCount: 10,
    difficulty: "mixed" as QuestionDifficulty | "mixed",
  });
  const [generating, setGenerating] = useState(false);

  const { status, progress, error, generate } = useQuizGenerator();
  const { mutateAsync: startSession } = useStartQuizSession();

  const handleGenerate = useCallback(async () => {
    if (!mode) return;
    setGenerating(true);

    try {
      const questionSetId = await generate({
        mode,
        topicIds: topicIds.length > 0 ? topicIds : undefined,
        customTopic: customTopic || undefined,
        materialIds: materialIds.length > 0 ? materialIds : undefined,
        questionCount: config.questionCount,
        difficulty: config.difficulty,
        supplementWithWeb,
      });

      const result = await startSession(questionSetId);
      router.push(`/quiz/sessions/${result.session.id}`);
    } catch {
      // error is handled by the hook
    }
  }, [
    mode,
    topicIds,
    customTopic,
    materialIds,
    config,
    supplementWithWeb,
    generate,
    startSession,
    router,
  ]);

  const handleModeSelect = useCallback((newMode: GenerationMode) => {
    setMode(newMode);
    setTopicIds([]);
    setCustomTopic("");
    setMaterialIds([]);
  }, []);

  const toggleTopicId = useCallback((id: string) => {
    setTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }, []);

  const toggleMaterialId = useCallback((id: string) => {
    setMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }, []);

  const canGenerate =
    mode &&
    ((mode === "today" || mode === "topic") && topicIds.length > 0) ||
    (mode === "custom" && customTopic.trim().length > 0) ||
    (mode === "materials" && materialIds.length > 0);

  if (generating && status === "generating") {
    return (
      <PageShell maxWidth="narrow">
        <GenerationProgress status={progress >= 60 ? "generating" : "searching"} progress={progress} />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell maxWidth="narrow">
        <GenerationProgress status="error" progress={0} error={error} />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => setGenerating(false)} variant="outline">
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="narrow">
      <PageHeader
        title="Generate a Quiz"
        description="Choose a mode and configure your quiz"
      />

      <div className="space-y-6">
        <ModeSelectorCard selected={mode} onSelect={handleModeSelect} />

        {mode === "today" && (
          <DueTopicPicker selectedIds={topicIds} onToggle={toggleTopicId} />
        )}

        {mode === "topic" && (
          <TopicPicker selectedIds={topicIds} onToggle={toggleTopicId} />
        )}

        {mode === "custom" && (
          <CustomTopicInput value={customTopic} onChange={setCustomTopic} />
        )}

        {mode === "materials" && (
          <MaterialPicker
            selectedIds={materialIds}
            onToggle={toggleMaterialId}
            supplementWithWeb={supplementWithWeb}
            onSupplementToggle={() => setSupplementWithWeb((prev) => !prev)}
          />
        )}

        {mode && (
          <>
            <QuizConfigForm config={config} onChange={setConfig} />
            <Button
              className="w-full"
              size="lg"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              Generate Quiz
            </Button>
          </>
        )}
      </div>
    </PageShell>
  );
}
