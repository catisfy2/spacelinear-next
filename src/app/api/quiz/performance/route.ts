import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAuthClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

interface QuestionWithAnswer {
  questionId: string;
  difficulty: string;
  tags: string[];
  isCorrect: boolean;
  sessionStartedAt: string;
  questionSetId: string | null;
}

export async function GET(req: NextRequest) {
  const accessToken = req.nextUrl.searchParams.get("accessToken");

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all completed sessions
  const { data: sessions } = await authClient
    .from("quiz_sessions")
    .select("id, started_at, metadata")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("started_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);

  if (sessionIds.length === 0) {
    return NextResponse.json({
      overallAccuracy: 0,
      totalSessions: 0,
      totalQuestions: 0,
      streakDays: 0,
      accuracyOverTime: [],
      bySubject: [],
      byTopic: [],
      difficultyDistribution: [],
      weakestTopics: [],
    });
  }

  // Fetch all answers for these sessions
  const { data: allAnswers } = await authClient
    .from("quiz_session_answers")
    .select("question_id, is_correct, session_id")
    .in("session_id", sessionIds);

  // Fetch questions with their difficulty and tags
  const questionIds = [...new Set((allAnswers ?? []).map((a) => a.question_id))];
  const { data: allQuestions } = questionIds.length > 0
    ? await authClient.from("questions").select("id, difficulty, tags, question_set_id").in("id", questionIds)
    : { data: [] };

  const questionMap = new Map(
    (allQuestions ?? []).map((q) => [q.id, q]),
  );

  const sessionDateMap = new Map(
    (sessions ?? []).map((s) => [s.id, s.started_at]),
  );

  // Build enriched data
  const enriched: QuestionWithAnswer[] = (allAnswers ?? []).map((a) => {
    const q = questionMap.get(a.question_id);
    return {
      questionId: a.question_id,
      difficulty: q?.difficulty ?? "medium",
      tags: q?.tags ?? [],
      isCorrect: a.is_correct,
      sessionStartedAt: sessionDateMap.get(a.session_id) ?? "",
      questionSetId: q?.question_set_id ?? null,
    };
  });

  // Overall stats
  const totalQuestions = enriched.length;
  const correctCount = enriched.filter((e) => e.isCorrect).length;
  const overallAccuracy = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  // Accuracy over time (by day)
  const dayMap = new Map<string, { correct: number; total: number }>();
  for (const e of enriched) {
    const day = e.sessionStartedAt.slice(0, 10);
    const entry = dayMap.get(day) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (e.isCorrect) entry.correct += 1;
    dayMap.set(day, entry);
  }
  const accuracyOverTime = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      totalQuestions: stats.total,
    }));

  // By subject (via question sets -> topics -> subjects)
  // Fetch question sets with topic info
  const questionSetIds = [...new Set(enriched.map((e) => e.questionSetId).filter(Boolean))];
  const { data: questionSets } = questionSetIds.length > 0
    ? await authClient.from("question_sets").select("id, topic_id").in("id", questionSetIds)
    : { data: [] };

  const setTopicMap = new Map(
    (questionSets ?? []).map((s) => [s.id, s.topic_id]),
  );

  const topicIds = [...new Set((questionSets ?? []).map((s) => s.topic_id).filter(Boolean))];
  const { data: topics } = topicIds.length > 0
    ? await authClient.from("topics").select("id, title, subject_id").in("id", topicIds)
    : { data: [] };

  const topicMap = new Map((topics ?? []).map((t) => [t.id, t]));

  const subjectIds = [...new Set((topics ?? []).map((t) => t.subject_id).filter(Boolean))];
  const { data: subjects } = subjectIds.length > 0
    ? await authClient.from("subjects").select("id, name").in("id", subjectIds)
    : { data: [] };

  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));

  // By topic
  const topicStats = new Map<string, { correct: number; total: number }>();
  for (const e of enriched) {
    if (!e.questionSetId) continue;
    const topicId = setTopicMap.get(e.questionSetId);
    if (!topicId) continue;
    const entry = topicStats.get(topicId) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (e.isCorrect) entry.correct += 1;
    topicStats.set(topicId, entry);
  }

  const byTopic = [...topicStats.entries()].map(([topicId, stats]) => {
    const topic = topicMap.get(topicId);
    return {
      topicId,
      topicName: topic?.title ?? "Unknown",
      subjectName: topic?.subject_id ? (subjectMap.get(topic.subject_id) ?? null) : null,
      totalAttempts: stats.total,
      correctCount: stats.correct,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    };
  });

  // By subject (aggregate from topics)
  const subjectStats = new Map<string, { correct: number; total: number }>();
  for (const t of byTopic) {
    if (!t.subjectName) continue;
    const entry = subjectStats.get(t.subjectName) ?? { correct: 0, total: 0 };
    entry.total += t.totalAttempts;
    entry.correct += t.correctCount;
    subjectStats.set(t.subjectName, entry);
  }

  const bySubject = [...subjectStats.entries()].map(([subjectName, stats]) => ({
    subjectId: "",
    subjectName,
    totalAttempts: stats.total,
    correctCount: stats.correct,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));

  // Difficulty distribution
  const difficultyStats = new Map<string, { correct: number; total: number }>();
  for (const e of enriched) {
    const entry = difficultyStats.get(e.difficulty) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (e.isCorrect) entry.correct += 1;
    difficultyStats.set(e.difficulty, entry);
  }

  const difficultyDistribution = [...difficultyStats.entries()].map(([difficulty, stats]) => ({
    difficulty: difficulty as "easy" | "medium" | "hard",
    total: stats.total,
    correct: stats.correct,
    accuracy: Math.round((stats.correct / stats.total) * 100),
  }));

  // Weakest topics (sorted by accuracy ascending)
  const weakestTopics = [...byTopic]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)
    .map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      accuracy: t.accuracy,
      totalAttempts: t.totalAttempts,
    }));

  // Streak: consecutive days with at least one question answered
  const activeDays = [...new Set(enriched.map((e) => e.sessionStartedAt.slice(0, 10)))].sort();
  let streakDays = 0;
  if (activeDays.length > 0) {
    let checkDate = activeDays[activeDays.length - 1];
    for (let i = activeDays.length - 1; i >= 0; i--) {
      if (activeDays[i] === checkDate) {
        streakDays++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
      } else if (activeDays[i] < checkDate) {
        break;
      }
    }
  }

  return NextResponse.json({
    overallAccuracy,
    totalSessions: sessions?.length ?? 0,
    totalQuestions,
    streakDays,
    accuracyOverTime,
    bySubject,
    byTopic,
    difficultyDistribution,
    weakestTopics,
  });
}
