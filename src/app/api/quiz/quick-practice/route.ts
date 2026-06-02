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
  const { count = 10, accessToken } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick random questions
  const { data: questions } = await authClient
    .from("questions")
    .select("id");

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions available" }, { status: 404 });
  }

  // Shuffle and pick
  const shuffled = questions.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  const questionIds = picked.map((q) => q.id);

  // Create session
  const { data: session, error: sessionError } = await authClient
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      mode: "quick_practice",
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
    .in("id", questionIds);

  const sanitized = (fullQuestions ?? []).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty,
    tags: q.tags,
  }));

  return NextResponse.json({ session, questions: sanitized });
}
