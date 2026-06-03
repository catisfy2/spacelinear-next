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

export async function GET(req: NextRequest) {
  const accessToken = req.nextUrl.searchParams.get("accessToken");
  const questionSetId = req.nextUrl.searchParams.get("questionSetId");
  const difficulty = req.nextUrl.searchParams.get("difficulty");

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = authClient
    .from("questions")
    .select("*");

  if (questionSetId) {
    query = query.eq("question_set_id", questionSetId).order("order", { ascending: true });
  }

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  const { data: questions, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }

  const sanitized = (questions ?? []).map((q) => ({
    id: q.id,
    questionSetId: q.question_set_id,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    tags: q.tags ?? [],
    createdAt: q.created_at,
  }));

  return NextResponse.json({ questions: sanitized });
}
