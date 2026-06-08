import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await req.json();
  const { questionId, answer, timeTakenSeconds, accessToken } = body;

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

  const { id: sessionId } = await params;

  const { data: question, error: questionError } = await authClient
    .from("questions")
    .select("id, answer, question_type")
    .eq("id", questionId)
    .single();

  if (questionError || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  let isCorrect = false;
  if (question.question_type === "mcq" || question.question_type === "true_false") {
    isCorrect = answer.trim().toLowerCase() === question.answer.trim().toLowerCase();
  }

  const { error: upsertError } = await authClient
    .from("quiz_session_answers")
    .upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        selected_answer: answer,
        is_correct: isCorrect,
        time_taken_seconds: timeTakenSeconds ?? null,
      },
      {
        onConflict: "session_id, question_id",
        ignoreDuplicates: false,
      },
    );

  if (upsertError) {
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }

  if (isCorrect) {
    await authClient.rpc("increment_session_score", {
      session_uuid: sessionId,
    });
  }

  return NextResponse.json({ stored: true });
}
