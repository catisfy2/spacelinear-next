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
    topicId,
    count = 10,
    timeLimitMinutes = 30,
    difficulty = "mixed",
    accessToken,
  } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
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
    // Find question sets for this topic, then questions in those sets
    const { data: sets } = await authClient
      .from("question_sets")
      .select("id")
      .eq("topic_id", topicId)
      .eq("user_id", user.id);

    const setIds = (sets ?? []).map((s) => s.id);
    if (setIds.length > 0) {
      query = query.in("question_set_id", setIds);
    }
  }

  if (difficulty !== "mixed") {
    query = query.eq("difficulty", difficulty);
  }

  const { data: allQuestions } = await query;

  if (!allQuestions || allQuestions.length === 0) {
    return NextResponse.json({ error: "No questions match the criteria" }, { status: 404 });
  }

  // Pick questions
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
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

  // Fetch full question data
  const { data: fullQuestions } = await authClient
    .from("questions")
    .select("*")
    .in("id", questionIds);

  const sanitized = (fullQuestions ?? []).map((q) => ({
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
