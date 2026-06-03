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

export async function POST(req: NextRequest) {
  const {
    subjectId,
    topicId: rawTopicId,
    count: rawCount,
    timeLimitMinutes: rawTimeLimit,
    difficulty = "mixed",
    accessToken,
  } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const count = rawCount !== undefined ? Number(rawCount) : 10;
  const timeLimitMinutes = rawTimeLimit !== undefined ? Number(rawTimeLimit) : 30;
  const topicId = rawTopicId !== undefined ? String(rawTopicId) : undefined;

  if (!Number.isInteger(count) || count < 1) {
    return NextResponse.json({ error: "count must be a positive integer" }, { status: 400 });
  }
  if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes < 1) {
    return NextResponse.json({ error: "timeLimitMinutes must be a positive integer" }, { status: 400 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build query for questions
  let query = authClient
    .from("questions")
    .select("id");

  if (topicId) {
    // Topic-level filter (most specific)
    const { data: sets } = await authClient
      .from("question_sets")
      .select("id")
      .eq("topic_id", topicId)
      .eq("user_id", user.id);

    const setIds = (sets ?? []).map((s) => s.id);
    if (setIds.length === 0) {
      return NextResponse.json({ error: "No questions match the criteria" }, { status: 404 });
    }
    query = query.in("question_set_id", setIds);
  } else if (subjectId) {
    // Subject-level filter: topics → question_sets → questions
    const { data: subjectTopics } = await authClient
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("user_id", user.id);

    const topicIds = (subjectTopics ?? []).map((t) => t.id);
    if (topicIds.length === 0) {
      return NextResponse.json({ error: "No questions match the criteria" }, { status: 404 });
    }

    const { data: sets } = await authClient
      .from("question_sets")
      .select("id")
      .in("topic_id", topicIds)
      .eq("user_id", user.id);

    const setIds = (sets ?? []).map((s) => s.id);
    if (setIds.length === 0) {
      return NextResponse.json({ error: "No questions match the criteria" }, { status: 404 });
    }
    query = query.in("question_set_id", setIds);
  }

  if (difficulty !== "mixed") {
    query = query.eq("difficulty", difficulty);
  }

  const { data: allQuestions } = await query;

  if (!allQuestions || allQuestions.length === 0) {
    return NextResponse.json({ error: "No questions match the criteria" }, { status: 404 });
  }

  // Fisher-Yates shuffle
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  const questionIds = picked.map((q) => q.id);

  // Create session
  const { data: session, error: sessionError } = await authClient
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      mode: "mock_test",
      total_questions: questionIds.length,
      metadata: {
        question_ids: questionIds,
        time_limit_minutes: timeLimitMinutes,
        difficulty,
      },
    })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  // Fetch full question data preserving questionIds order
  const { data: fullQuestions } = await authClient
    .from("questions")
    .select("*")
    .in("id", questionIds);

  const questionMap = new Map((fullQuestions ?? []).map((q) => [q.id, q]));
  const sanitized = questionIds
    .map((id) => questionMap.get(id))
    .filter(Boolean)
    .map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      tags: q.tags,
    }));

  return NextResponse.json({
    session,
    questions: sanitized,
    timeLimitMinutes,
  });
}
