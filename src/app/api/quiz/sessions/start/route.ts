import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const { questionSetId, accessToken } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: questions, error: questionsError } = await authClient
    .from("questions")
    .select("id, question, options, question_type, difficulty, tags, \"order\"")
    .eq("question_set_id", questionSetId)
    .order("order", { ascending: true });

  if (questionsError || !questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions found" }, { status: 404 });
  }

  const { data: session, error: sessionError } = await authClient
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      question_set_id: questionSetId,
      mode: "quiz",
      score: 0,
      total_questions: questions.length,
    })
    .select("id, user_id, question_set_id, mode, score, total_questions, time_taken_seconds, metadata, started_at, completed_at")
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const mappedQuestions = questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    questionType: q.question_type,
    difficulty: q.difficulty,
    tags: q.tags ?? [],
    order: q.order,
  }));

  return NextResponse.json({
    session: {
      id: session.id,
      userId: session.user_id,
      questionSetId: session.question_set_id,
      mode: session.mode,
      score: session.score,
      totalQuestions: session.total_questions,
      timeTakenSeconds: session.time_taken_seconds,
      metadata: session.metadata ?? {},
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
    questions: mappedQuestions,
  });
}
