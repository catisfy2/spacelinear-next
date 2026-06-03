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
  const { sessionId, questionId, answer, timeTakenSeconds, accessToken } =
    await req.json();

  if (!sessionId || !questionId || answer == null || !accessToken) {
    return NextResponse.json(
      { error: "sessionId, questionId, answer, and accessToken required" },
      { status: 400 },
    );
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify session belongs to user
  const { data: session } = await authClient
    .from("quiz_sessions")
    .select("id, score, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.completed_at) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  // Get the question
  const { data: question } = await authClient
    .from("questions")
    .select("answer, explanation")
    .eq("id", questionId)
    .single();

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = answer === question.answer;

  // Check if answer already exists for this question in this session
  const { data: existing } = await authClient
    .from("quiz_session_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (!existing) {
    // Insert answer
    const { error: insertError } = await authClient
      .from("quiz_session_answers")
      .insert({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: answer,
        is_correct: isCorrect,
        time_taken_seconds: timeTakenSeconds ?? null,
      });

    if (insertError) {
      return NextResponse.json({ error: "Failed to record answer" }, { status: 500 });
    }

    // Atomically increment score if correct
    if (isCorrect) {
      const { error: incError } = await authClient.rpc("increment_session_score", {
        session_uuid: sessionId,
      });
      if (incError) {
        console.error("increment_session_score RPC failed:", incError);
        await authClient
          .from("quiz_sessions")
          .update({ score: (session.score ?? 0) + 1 })
          .eq("id", sessionId);
      }
    }
  }

  return NextResponse.json({
    isCorrect,
    answer: question.answer,
    explanation: question.explanation,
  });
}
