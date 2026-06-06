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
  const { sessionId, timeTakenSeconds, accessToken } = await req.json();

  if (!sessionId || !accessToken) {
    return NextResponse.json(
      { error: "sessionId and accessToken required" },
      { status: 400 },
    );
  }

  const authClient = getAuthClient(accessToken);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify session belongs to user
  const { data: session } = await authClient
    .from("quiz_sessions")
    .select("id, completed_at, total_questions, score")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.completed_at) {
    // Already completed — return the session as-is (idempotent)
    return NextResponse.json({ session });
  }

  // Get current score and total from answers
  const { data: answers } = await authClient
    .from("quiz_session_answers")
    .select("is_correct")
    .eq("session_id", sessionId);

  const score = (answers ?? []).filter((a) => a.is_correct).length;
  const answeredCount = (answers ?? []).length;

  // Preserve the session's original total_questions count if it's larger
  // (ensures we don't shrink total_questions if some questions were skipped)
  const totalQuestions = Math.max(session.total_questions ?? 0, answeredCount);

  // Complete the session
  const { data: updated, error: updateError } = await authClient
    .from("quiz_sessions")
    .update({
      score,
      total_questions: totalQuestions,
      time_taken_seconds: timeTakenSeconds ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to complete session:", updateError);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: updated });
}
