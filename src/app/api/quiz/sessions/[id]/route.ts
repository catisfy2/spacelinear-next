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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const accessToken = req.nextUrl.searchParams.get("accessToken");

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get session
  const { data: session } = await authClient
    .from("quiz_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get answers with question details
  const { data: answers } = await authClient
    .from("quiz_session_answers")
    .select("*")
    .eq("session_id", id);

  // Get question details for each answer
  const questionIds = (answers ?? []).map((a) => a.question_id);
  const { data: questions } = questionIds.length > 0
    ? await authClient.from("questions").select("*").in("id", questionIds)
    : { data: [] };

  const questionMap = new Map(
    (questions ?? []).map((q) => [q.id, q]),
  );

  const answersWithQuestions = (answers ?? []).map((a) => ({
    ...a,
    question: questionMap.get(a.question_id) ?? null,
  }));

  return NextResponse.json({ session, answers: answersWithQuestions });
}
