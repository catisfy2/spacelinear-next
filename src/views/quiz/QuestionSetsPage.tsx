"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuestionSets, useStartTopicSet, useSubmitAnswer, useCompleteSession, useSessionDetail, useUpdateQuestionSet } from "@/hooks/useQuiz";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/app/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuizPersistence } from "@/hooks/useQuizPersistence";
import { Loader2, CheckCircle2, XCircle, Play, Pencil, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/types/quiz";
import type { Question } from "@/types/quiz";
import type { QuestionSetListItem } from "@/types/quiz";

type Phase = "list" | "active" | "results";

interface MaterialOption {
  id: string;
  name: string;
}

export function QuestionSetsPage() {
  const { user } = useAuth();
  const { data: sets, isLoading } = useQuestionSets();
  const startSet = useStartTopicSet();
  const submitAnswer = useSubmitAnswer();
  const completeSession = useCompleteSession();
  const updateSet = useUpdateQuestionSet();
  const { topics } = useStore();

  const [phase, setPhase] = useState<Phase>("list");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Pick<Question, "id" | "question" | "options" | "difficulty" | "tags">[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<QuestionSetListItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTopicId, setEditTopicId] = useState<string>("");
  const [editMaterialId, setEditMaterialId] = useState<string>("none");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);

  // Start-config dialog state
  const [startingSetId, setStartingSetId] = useState<string | null>(null);
  const [startTimeLimit, setStartTimeLimit] = useState(0);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeLimitMinutesRef = useRef(0);

  // Results
  const { data: sessionDetail } = useSessionDetail(phase === "results" ? sessionId : null);

  const currentQuestion = questions[currentIndex];

  const persistedState = phase === "active" && sessionId
    ? { sessionId, questions, currentIndex, answeredCount, timeLimitMinutes: timeLimitMinutesRef.current, timeRemaining }
    : null;

  const { loadSaved, clearSaved } = useQuizPersistence(
    "qs-quiz",
    "question-sets",
    phase,
    sessionId,
    persistedState,
    useCallback(() => {
      setPhase("list");
      setSessionId(null);
    }, []),
  );

  // Restore saved session on mount (survives page reload)
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setSessionId(saved.sessionId);
      setQuestions(saved.questions as any);
      setCurrentIndex(saved.currentIndex);
      setAnsweredCount(saved.answeredCount);
      timeLimitMinutesRef.current = saved.timeLimitMinutes;
      setTimeRemaining(saved.timeRemaining);
      setPhase("active");
    }
  }, [loadSaved]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "active" || timeLimitMinutesRef.current <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-end when timer hits 0
  useEffect(() => {
    if (phase !== "active" || timeLimitMinutesRef.current <= 0 || timeRemaining > 0) return;
    finishSession();
  }, [timeRemaining]);

  const finishSession = useCallback(async () => {
    if (!sessionId) return;
    await completeSession.mutateAsync({
      sessionId,
      timeTakenSeconds: timeLimitMinutesRef.current > 0 ? timeLimitMinutesRef.current * 60 - timeRemaining : undefined,
    });
    setPhase("results");
  }, [sessionId, timeRemaining, completeSession]);

  const handleStartSet = useCallback(async () => {
    if (!startingSetId) return;
    const result = await startSet.mutateAsync(startingSetId);
    setSessionId(result.session.id);
    setQuestions(result.questions);
    setCurrentIndex(0);
    setAnsweredCount(0);
    setSelectedAnswer(null);
    setStartingSetId(null);
    setPhase("active");
    timeLimitMinutesRef.current = startTimeLimit;
    if (startTimeLimit > 0) {
      setTimeRemaining(startTimeLimit * 60);
    }
  }, [startingSetId, startTimeLimit, startSet]);

  const handleSelectOption = useCallback((answer: string) => {
    if (phase !== "active" || submitAnswer.isPending) return;
    setSelectedAnswer(answer);
  }, [phase, submitAnswer.isPending]);

  const handleConfirm = useCallback(async () => {
    if (!sessionId || !currentQuestion || !selectedAnswer || phase !== "active") return;
    await submitAnswer.mutateAsync({
      sessionId,
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      timeTakenSeconds: 0,
    });

    setAnsweredCount((prev) => prev + 1);

    if (currentIndex + 1 >= questions.length) {
      await finishSession();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  }, [sessionId, currentQuestion, selectedAnswer, phase, currentIndex, questions.length, submitAnswer, finishSession]);

  const handleReset = useCallback(() => {
    clearSaved();
    setPhase("list");
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
  }, [clearSaved]);

  // ─── Edit handlers ──────────────────────────────────────────────────

  useEffect(() => {
    if (editTarget) {
      setEditTitle(editTarget.title);
      setEditTopicId(editTarget.topicId);
      setEditMaterialId(editTarget.materialId ?? "");
    }
  }, [editTarget]);

  const openEdit = useCallback(async (set: QuestionSetListItem) => {
    setEditTarget(set);
    setEditTitle(set.title);
    setEditTopicId(set.topicId);
    setEditMaterialId(set.materialId ?? "none");
    if (user) {
      const { data } = await supabase
        .from("materials")
        .select("id, name")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .neq("type", "folder")
        .order("name");
      setMaterials((data ?? []).map((m: any) => ({ id: m.id, name: m.name })));
    }
  }, [user]);

  const handleSaveEdit = useCallback(async () => {
    if (!editTarget) return;
    await updateSet.mutateAsync({
      setId: editTarget.id,
      title: editTitle.trim() || undefined,
      topicId: editTopicId || undefined,
      materialId: editMaterialId === "none" ? null : editMaterialId,
    });
    setEditTarget(null);
  }, [editTarget, editTitle, editTopicId, editMaterialId, updateSet]);

  // ─── Render ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  // ─── Results ────────────────────────────────────────────────────────

  if (phase === "results") {
    clearSaved();
    const answers = sessionDetail?.answers ?? [];
    const total = answers.length;
    const correct = answers.filter((a) => a.isCorrect).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <PageShell maxWidth="narrow">
        <div className="py-8">
          <Card className="mb-6 p-6 text-center">
            <h2 className="text-2xl font-semibold">Set Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You answered {correct} of {total} correctly ({pct}%)
            </p>
            <Progress value={pct} className="mt-4 h-3" />
            {sessionDetail?.session?.timeTakenSeconds && (
              <p className="mt-2 text-xs text-muted-foreground">
                Time: {formatTime(sessionDetail.session.timeTakenSeconds)}
              </p>
            )}
            <Button className="mt-6" onClick={handleReset}>
              Back to Sets
            </Button>
          </Card>

          <div className="space-y-3">
            {answers.map((answer, idx) => (
              <Card key={answer.id} className="p-4">
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {idx + 1}. {answer.question?.question ?? "Question"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your answer: {answer.selectedAnswer}
                    </p>
                    {!answer.isCorrect && (
                      <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        Correct: {answer.question?.answer}
                      </p>
                    )}
                    {answer.question?.explanation && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {answer.question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  // ─── List ───────────────────────────────────────────────────────────

  if (phase === "list") {
    if (!sets || sets.length === 0) {
      return (
        <PageShell>
          <EmptyState
            icon="📚"
            title="No question sets yet"
            description="Upload study materials to generate AI question sets."
          />
        </PageShell>
      );
    }

    return (
      <PageShell>
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Topic Question Sets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-generated question sets tied to your study topics.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {sets.map((set) => (
              <Card key={set.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{set.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mt-1 -mr-2 h-7 w-7 shrink-0"
                      onClick={() => openEdit(set)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <CardDescription>
                    {set.topicName && `${set.topicName} · `}
                    {set.questionCount} questions
                    {set.attempted && " · Previously attempted"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => { setStartingSetId(set.id); setStartTimeLimit(0); }}
                    disabled={startSet.isPending}
                    size="sm"
                  >
                    {startSet.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-3 w-3" />
                    )}
                    {set.attempted ? "Retry" : "Start"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Start-config dialog */}
        <Dialog open={!!startingSetId} onOpenChange={(o) => !o && setStartingSetId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Question Set</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {questions.length} questions
              </p>
              <div className="space-y-2">
                <Label htmlFor="qs-time">Time limit (minutes, 0 = no limit)</Label>
                <Input
                  id="qs-time"
                  type="number"
                  min={0}
                  max={120}
                  value={startTimeLimit}
                  onChange={(e) => setStartTimeLimit(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStartingSetId(null)}>
                Cancel
              </Button>
              <Button onClick={handleStartSet} disabled={startSet.isPending}>
                {startSet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Begin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Question Set</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Question set title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Select value={editTopicId} onValueChange={setEditTopicId}>
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select value={editMaterialId} onValueChange={setEditMaterialId}>
                  <SelectTrigger id="material">
                    <SelectValue placeholder="No material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No material</SelectItem>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateSet.isPending}>
                {updateSet.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
    );
  }

  // ─── Active Quiz ────────────────────────────────────────────────────

  if (!currentQuestion) return null;

  return (
    <PageShell maxWidth="narrow">
      <div className="py-8">
        <p className="mb-4 text-xs text-muted-foreground">
          If you leave this page, the quiz will be dismissed.
        </p>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-3">
            {timeLimitMinutesRef.current > 0 && (
              <span className={cn(
                "flex items-center gap-1 text-sm font-mono",
                timeRemaining <= 60 && "text-red-500",
              )}>
                <Timer className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="mb-6 h-2" />

        <div className="mb-2 flex gap-2">
          <Badge variant="outline">{currentQuestion.difficulty}</Badge>
          {currentQuestion.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <h2 className="mb-6 text-lg font-medium">{currentQuestion.question}</h2>

        <div className="grid gap-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={phase !== "active" || submitAnswer.isPending}
              onClick={() => handleSelectOption(option)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                "hover:border-primary hover:bg-primary/5",
                selectedAnswer === option && "border-primary bg-primary/5",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {selectedAnswer && phase === "active" && (
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={submitAnswer.isPending}
          >
            {submitAnswer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm &amp; Continue
          </Button>
        )}
      </div>
    </PageShell>
  );
}
