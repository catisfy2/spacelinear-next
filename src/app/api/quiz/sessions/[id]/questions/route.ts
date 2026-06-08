import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = req.nextUrl.searchParams.get("accessToken");

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

  const { data: session } = await authClient
    .from("quiz_sessions")
    .select("question_set_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: questions } = await authClient
    .from("questions")
    .select("id, question, options, question_type, difficulty, tags, \"order\"")
    .eq("question_set_id", session.question_set_id)
    .order("order", { ascending: true });

  const mapped = (questions ?? []).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    questionType: q.question_type,
    difficulty: q.difficulty,
    tags: q.tags ?? [],
    order: q.order,
  }));

  return NextResponse.json({ questions: mapped });
}
