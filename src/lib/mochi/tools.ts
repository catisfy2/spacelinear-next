import { createClient } from "@supabase/supabase-js";
import { embedText } from "./embeddings";
import type {
  StudyCommit,
  AgentMemory,
  AgentEvent,
  MochiSettings,
  MochiCron,
  WeeklyProgress,
  DailyDigest,
} from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function logStudyCommit(
  accessToken: string,
  userId: string,
  params: {
    topicId?: string;
    subjectName?: string;
    topicName?: string;
    durationMinutes: number;
    difficulty: "easy" | "medium" | "hard" | "review";
    notes?: string;
  },
): Promise<StudyCommit> {
  const client = getClient(accessToken);
  const { data, error } = await client
    .from("study_commits")
    .insert({
      user_id: userId,
      topic_id: params.topicId ?? null,
      subject_name: params.subjectName ?? null,
      topic_name: params.topicName ?? null,
      duration_minutes: params.durationMinutes,
      difficulty: params.difficulty,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await client.from("agent_events").insert({
    user_id: userId,
    event_type: "study_committed",
    event_data: { commitId: data.id, durationMinutes: params.durationMinutes },
  });

  return {
    id: data.id,
    userId: data.user_id,
    topicId: data.topic_id,
    subjectName: data.subject_name,
    topicName: data.topic_name,
    durationMinutes: data.duration_minutes,
    difficulty: data.difficulty,
    notes: data.notes,
    committedAt: data.committed_at,
  };
}

export async function getStudyHistory(
  accessToken: string,
  userId: string,
  params?: { days: number },
): Promise<{ date: string; commits: StudyCommit[] }[]> {
  const days = params?.days ?? 7;
  const client = getClient(accessToken);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await client
    .from("study_commits")
    .select("*")
    .eq("user_id", userId)
    .gte("committed_at", since)
    .order("committed_at", { ascending: false });

  const commits: StudyCommit[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    userId: r.user_id as string,
    topicId: r.topic_id as string | null,
    subjectName: r.subject_name as string | null,
    topicName: r.topic_name as string | null,
    durationMinutes: r.duration_minutes as number,
    difficulty: r.difficulty as StudyCommit["difficulty"],
    notes: r.notes as string | null,
    committedAt: r.committed_at as string,
  }));

  const grouped: Record<string, StudyCommit[]> = {};
  for (const c of commits) {
    const date = c.committedAt.slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(c);
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, commits: items }));
}

export async function getWeeklyProgress(
  accessToken: string,
  userId: string,
): Promise<WeeklyProgress> {
  const client = getClient(accessToken);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: sessions } = await client
    .from("quiz_sessions")
    .select("score, total_questions, time_taken_seconds, completed_at")
    .eq("user_id", userId)
    .gte("completed_at", weekAgo)
    .not("completed_at", "is", null);

  const weekDays: { date: string; scores: number[]; totals: number[] }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    weekDays.push({
      date: d.toISOString().slice(0, 10),
      scores: [],
      totals: [],
    });
  }

  for (const s of sessions ?? []) {
    const d = (s.completed_at as string).slice(0, 10);
    const day = weekDays.find((wd) => wd.date === d);
    if (day) {
      day.scores.push(s.score as number);
      day.totals.push(s.total_questions as number);
    }
  }

  const totalQuestions = weekDays.reduce(
    (sum, d) => sum + d.totals.reduce((a, b) => a + b, 0),
    0,
  );
  const totalCorrect = weekDays.reduce(
    (sum, d) => sum + d.scores.reduce((a, b) => a + b, 0),
    0,
  );

  const dailyBreakdown = weekDays.map((d) => {
    const dayTotal = d.totals.reduce((a, b) => a + b, 0);
    const dayCorrect = d.scores.reduce((a, b) => a + b, 0);
    return {
      date: d.date,
      accuracy: dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : 0,
    };
  });

  return {
    quizzesTaken: (sessions ?? []).length,
    questionsAnswered: totalQuestions,
    totalTimeSeconds: (sessions ?? []).reduce(
      (sum, s) => sum + ((s.time_taken_seconds as number) ?? 0),
      0,
    ),
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    dailyBreakdown,
  };
}

export async function getQuizGaps(accessToken: string, userId: string) {
  const client = getClient(accessToken);
  const { data } = await client
    .from("user_topic_quiz_gaps")
    .select("*")
    .eq("user_id", userId)
    .order("accuracy", { ascending: true });

  return data ?? [];
}

export async function recommendNextStudy(
  accessToken: string,
  userId: string,
): Promise<{ topicName: string; subjectName: string | null; reason: string }[]> {
  const client = getClient(accessToken);

  const { data: gaps } = await client
    .from("user_topic_quiz_gaps")
    .select("*")
    .eq("user_id", userId)
    .order("accuracy", { ascending: true });

  const { data: commits } = await client
    .from("study_commits")
    .select("topic_name, committed_at")
    .eq("user_id", userId)
    .order("committed_at", { ascending: false })
    .limit(50);

  const recentTopics = new Map<string, string>();
  for (const c of commits ?? []) {
    if (c.topic_name && !recentTopics.has(c.topic_name)) {
      recentTopics.set(c.topic_name, c.committed_at as string);
    }
  }

  const recs: { topicName: string; subjectName: string | null; reason: string }[] = [];

  for (const gap of gaps ?? []) {
    const topicName = (gap as Record<string, unknown>).topic_name as string;
    const subjectName = (gap as Record<string, unknown>).subject_name as string | null;
    const accuracy = (gap as Record<string, unknown>).accuracy as number;
    const lastReview = recentTopics.get(topicName);

    if (accuracy < 60) {
      recs.push({
        topicName,
        subjectName,
        reason: `Accuracy is only ${accuracy}% — needs review`,
      });
    } else if (!lastReview) {
      recs.push({
        topicName,
        subjectName,
        reason: "Never reviewed — quiz data exists but no study session logged",
      });
    } else {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastReview).getTime()) / 86400000,
      );
      if (daysSince > 7) {
        recs.push({
          topicName,
          subjectName,
          reason: `Not reviewed in ${daysSince} days`,
        });
      }
    }
  }

  return recs.slice(0, 5);
}

export async function getTodaysTopics(
  accessToken: string,
  userId: string,
): Promise<{
  date: string;
  topics: {
    id: string;
    title: string;
    subjectName: string | null;
    state: string;
    difficulty: string | null;
  }[];
  count: number;
}> {
  const client = getClient(accessToken);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const { data } = await client
    .from("topics")
    .select("id, title, subject_id, state, current_difficulty, next_review_date")
    .eq("user_id", userId)
    .lt("next_review_date", tomorrow.toISOString())
    .not("state", "in", '("backlog","archived")')
    .order("next_review_date", { ascending: true });

  const rows = (data ?? []) as {
    id: string;
    title: string;
    subject_id: string | null;
    state: string;
    current_difficulty: string | null;
  }[];

  // Fetch subject names
  const subjectIds = [...new Set(rows.map((r) => r.subject_id).filter(Boolean))] as string[];
  const subjectMap = new Map<string, string>();
  if (subjectIds.length > 0) {
    const { data: subjects } = await client
      .from("subjects")
      .select("id, name")
      .in("id", subjectIds);
    for (const s of subjects ?? []) {
      subjectMap.set(s.id, s.name);
    }
  }

  // Sort by state priority
  const stateOrder: Record<string, number> = {
    relearning: 0,
    learning: 1,
    new: 2,
    reviewing: 3,
  };

  const topics = rows
    .map((r) => ({
      id: r.id,
      title: r.title,
      subjectName: r.subject_id ? (subjectMap.get(r.subject_id) ?? null) : null,
      state: r.state,
      difficulty: r.current_difficulty,
    }))
    .sort((a, b) => (stateOrder[a.state] ?? 99) - (stateOrder[b.state] ?? 99));

  return {
    date: new Date().toISOString().slice(0, 10),
    topics,
    count: topics.length,
  };
}

export async function getGapBasedStudyList(
  accessToken: string,
  userId: string,
): Promise<{
  date: string;
  items: {
    topicName: string;
    subjectName: string | null;
    priority: "high" | "medium";
    reason: string;
    type: "review" | "new";
  }[];
  totalEstimatedMinutes: number;
}> {
  const client = getClient(accessToken);

  const { data: gaps } = await client
    .from("user_topic_quiz_gaps")
    .select("*")
    .eq("user_id", userId)
    .order("accuracy", { ascending: true });

  const { data: commits } = await client
    .from("study_commits")
    .select("topic_name, committed_at")
    .eq("user_id", userId)
    .order("committed_at", { ascending: false })
    .limit(50);

  const recentTopics = new Map<string, string>();
  for (const c of commits ?? []) {
    if (c.topic_name && !recentTopics.has(c.topic_name)) {
      recentTopics.set(c.topic_name, c.committed_at as string);
    }
  }

  const items: {
    topicName: string;
    subjectName: string | null;
    priority: "high" | "medium";
    reason: string;
    type: "review" | "new";
  }[] = [];

  for (const gap of gaps ?? []) {
    const topicName = (gap as Record<string, unknown>).topic_name as string;
    const subjectName = (gap as Record<string, unknown>).subject_name as string | null;
    const accuracy = (gap as Record<string, unknown>).accuracy as number;
    const lastReview = recentTopics.get(topicName);

    if (accuracy < 60) {
      items.push({
        topicName,
        subjectName,
        priority: "high",
        reason: `Accuracy is only ${accuracy}% — needs review`,
        type: "review",
      });
    } else if (!lastReview) {
      items.push({
        topicName,
        subjectName,
        priority: "medium",
        reason: "Quiz data exists but no study session logged",
        type: "new",
      });
    } else {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastReview).getTime()) / 86400000,
      );
      if (daysSince > 7) {
        items.push({
          topicName,
          subjectName,
          priority: "medium",
          reason: `Not reviewed in ${daysSince} days`,
          type: "review",
        });
      }
    }
  }

  const sorted = items.slice(0, 5);
  const totalEstimatedMinutes = sorted.reduce((sum, item) => {
    return sum + (item.priority === "high" ? 25 : 15);
  }, 0);

  return {
    date: new Date().toISOString().slice(0, 10),
    items: sorted,
    totalEstimatedMinutes,
  };
}

export async function searchMemory(
  accessToken: string,
  userId: string,
  params?: { query: string; limit?: number },
): Promise<AgentMemory[]> {
  const query = params?.query ?? "";
  const limit = params?.limit ?? 5;
  const client = getClient(accessToken);
  const embedding = await embedText(query);
  const { data } = await client.rpc("match_agent_memories", {
    p_user_id: userId,
    p_embedding: embedding,
    p_match_threshold: 0.5,
    p_match_count: limit,
  });

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    userId: r.user_id as string,
    content: r.content as string,
    embedding: (r.embedding as number[]) ?? [],
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  }));
}

export async function storeMemory(
  accessToken: string,
  userId: string,
  params?: { content: string; metadata?: Record<string, unknown> },
): Promise<AgentMemory> {
  const content = params?.content ?? "";
  const metadata = params?.metadata ?? {};
  const client = getClient(accessToken);
  const embedding = await embedText(content);
  const { data, error } = await client
    .from("agent_memories")
    .insert({
      user_id: userId,
      content,
      embedding,
      metadata,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    content: data.content,
    embedding: data.embedding ?? [],
    metadata: data.metadata ?? {},
    createdAt: data.created_at,
  };
}

export async function getDailyDigest(
  accessToken: string,
  userId: string,
): Promise<DailyDigest> {
  const client = getClient(accessToken);
  const today = new Date().toISOString().slice(0, 10);

  const { data: commits } = await client
    .from("study_commits")
    .select("*")
    .eq("user_id", userId)
    .gte("committed_at", today);

  const { data: sessions } = await client
    .from("quiz_sessions")
    .select("score, total_questions, completed_at")
    .eq("user_id", userId)
    .gte("completed_at", today)
    .not("completed_at", "is", null);

  const totalMinutes = (commits ?? []).reduce(
    (sum, c) => sum + (c.duration_minutes as number),
    0,
  );

  const totalQ = (sessions ?? []).reduce(
    (sum, s) => sum + (s.total_questions as number),
    0,
  );
  const totalC = (sessions ?? []).reduce(
    (sum, s) => sum + (s.score as number),
    0,
  );

  const subjects = new Set<string>();
  for (const c of commits ?? []) {
    if (c.subject_name) subjects.add(c.subject_name as string);
  }
  for (const s of sessions ?? []) {
    const subject = (s as Record<string, unknown>).subject_name as string | undefined;
    if (subject) subjects.add(subject);
  }

  const streak = await computeStreak(supabaseUrl, supabaseAnonKey, userId);

  return {
    studyCommits: (commits ?? []).length,
    totalMinutes,
    quizzesCompleted: (sessions ?? []).length,
    averageAccuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null,
    streak,
    subjectsStudied: Array.from(subjects),
  };
}

async function computeStreak(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
): Promise<number> {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: commits } = await client
    .from("study_commits")
    .select("committed_at")
    .eq("user_id", userId)
    .order("committed_at", { ascending: false })
    .limit(365);

  const dates = new Set<string>();
  for (const c of (commits ?? []) as { committed_at: string }[]) {
    dates.add(c.committed_at.slice(0, 10));
  }

  const { data: sessions } = await client
    .from("quiz_sessions")
    .select("completed_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(365);

  for (const s of (sessions ?? []) as { completed_at: string }[]) {
    dates.add(s.completed_at.slice(0, 10));
  }

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak++;
    } else if (key !== today) {
      break;
    }
  }

  return streak;
}

export async function getMochiSettings(
  accessToken: string,
  userId: string,
): Promise<MochiSettings> {
  const client = getClient(accessToken);
  const { data } = await client
    .from("mochi_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    const { data: inserted } = await client
      .from("mochi_settings")
      .insert({ user_id: userId })
      .select()
      .single();
    return {
      enabled: inserted?.enabled ?? true,
      tone: inserted?.tone ?? "friendly",
      maxCrons: inserted?.max_crons ?? 3,
    };
  }

  return {
    enabled: data.enabled,
    tone: data.tone,
    maxCrons: data.max_crons,
  };
}

export async function updateMochiSettings(
  accessToken: string,
  userId: string,
  settings: Partial<MochiSettings>,
): Promise<MochiSettings> {
  const client = getClient(accessToken);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (settings.enabled !== undefined) update.enabled = settings.enabled;
  if (settings.tone !== undefined) update.tone = settings.tone;
  if (settings.maxCrons !== undefined) update.max_crons = settings.maxCrons;

  const { data } = await client
    .from("mochi_settings")
    .upsert({ user_id: userId, ...update })
    .select()
    .single();

  return {
    enabled: data.enabled,
    tone: data.tone,
    maxCrons: data.max_crons,
  };
}

export async function getCrons(
  accessToken: string,
  userId: string,
): Promise<MochiCron[]> {
  const client = getClient(accessToken);
  const { data } = await client
    .from("mochi_crons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    userId: r.user_id as string,
    label: r.label as string,
    cronExpr: r.cron_expr as string,
    prompt: r.prompt as string | null,
    enabled: r.enabled as boolean,
    lastRunAt: r.last_run_at as string | null,
  }));
}

export async function createCron(
  accessToken: string,
  userId: string,
  params: {
    label: string;
    cronExpr: string;
    prompt?: string;
  },
): Promise<MochiCron> {
  const client = getClient(accessToken);
  const { data, error } = await client
    .from("mochi_crons")
    .insert({
      user_id: userId,
      label: params.label,
      cron_expr: params.cronExpr,
      prompt: params.prompt ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    userId: data.user_id,
    label: data.label,
    cronExpr: data.cron_expr,
    prompt: data.prompt,
    enabled: data.enabled,
    lastRunAt: data.last_run_at,
  };
}

export async function deleteCron(
  accessToken: string,
  userId: string,
  cronId: string,
): Promise<void> {
  const client = getClient(accessToken);
  await client
    .from("mochi_crons")
    .delete()
    .eq("id", cronId)
    .eq("user_id", userId);
}

export async function getUnnotifiedEvents(
  accessToken: string,
  userId: string,
): Promise<AgentEvent[]> {
  const client = getClient(accessToken);
  const { data } = await client
    .from("agent_events")
    .select("*")
    .eq("user_id", userId)
    .is("notified_at", null)
    .order("created_at", { ascending: true });

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    userId: r.user_id as string,
    eventType: r.event_type as string,
    eventData: r.event_data as Record<string, unknown>,
    createdAt: r.created_at as string,
    notifiedAt: r.notified_at as string | null,
  }));
}

export async function markEventsNotified(
  accessToken: string,
  userId: string,
  eventIds: string[],
): Promise<void> {
  const client = getClient(accessToken);
  await client
    .from("agent_events")
    .update({ notified_at: new Date().toISOString() })
    .in("id", eventIds)
    .eq("user_id", userId);
}

export async function importPastQuizData(
  accessToken: string,
  userId: string,
) {
  const client = getClient(accessToken);
  const { data: sessions } = await client
    .from("quiz_sessions")
    .select("id, score, total_questions, completed_at, question_set_id")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(50);

  const memories: { content: string; metadata: Record<string, unknown> }[] = [];

  for (const session of sessions ?? []) {
    const accuracy = (session.total_questions as number) > 0
      ? Math.round(((session.score as number) / (session.total_questions as number)) * 100)
      : 0;

    const { data: questions } = await client
      .from("questions")
      .select("subject_name, topic_name")
      .eq("question_set_id", session.question_set_id as string)
      .limit(5);

    const topics = [...new Set((questions ?? []).map((q) => q.topic_name).filter(Boolean))];

    memories.push({
      content: `Completed a quiz with ${accuracy}% accuracy (${session.score}/${session.total_questions}) on ${new Date(session.completed_at as string).toLocaleDateString()}${topics.length ? ` covering ${topics.join(", ")}` : ""}`,
      metadata: {
        type: "quiz",
        sessionId: session.id,
        accuracy,
        score: session.score,
        totalQuestions: session.total_questions,
        topics,
      },
    });
  }

  for (const m of memories) {
    try {
      await storeMemory(accessToken, userId, {
        content: m.content,
        metadata: m.metadata,
      });
    } catch {
      // continue
    }
  }

  return { imported: memories.length };
}
