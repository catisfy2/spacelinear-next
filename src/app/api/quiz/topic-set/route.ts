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
  const { questionSetId, accessToken } = await req.json();

  if (!questionSetId || !accessToken) {
    return NextResponse.json(
      { error: "questionSetId and accessToken required" },
      { status: 400 },
    );
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the set exists and belongs to user
  const { data: set } = await authClient
    .from("question_sets")
    .select("id, title, question_count")
    .eq("id", questionSetId)
    .eq("user_id", user.id)
    .single();

  if (!set) {
    return NextResponse.json({ error: "Question set not found" }, { status: 404 });
  }

  // Get all questions in this set
  const { data: questions } = await authClient
    .from("questions")
    .select("id")
    .eq("question_set_id", questionSetId);

  const questionIds = (questions ?? []).map((q) => q.id);

  if (questionIds.length === 0) {
    return NextResponse.json({ error: "This question set has no questions" }, { status: 404 });
  }

  // Create session
  const { data: session, error: sessionError } = await authClient
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      question_set_id: questionSetId,
      mode: "topic_set",
      total_questions: questionIds.length,
      metadata: { question_ids: questionIds },
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
    .eq("question_set_id", questionSetId);

  const sanitized = (fullQuestions ?? []).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
    tags: q.tags,
  }));

  return NextResponse.json({ session, questions: sanitized, set });
}
