import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const accessToken = req.nextUrl.searchParams.get("accessToken");
  const dateStr = req.nextUrl.searchParams.get("date");

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

  const date = dateStr ?? new Date().toISOString().split("T")[0];

  const { data: sessions } = await authClient
    .from("quiz_sessions")
    .select("id, score, total_questions, time_taken_seconds, completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", `${date}T00:00:00Z`)
    .lt("completed_at", `${date}T23:59:59Z`)
    .not("completed_at", "is", null);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({
      date,
      quizzesTaken: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalTimeSeconds: 0,
      uniqueTopics: 0,
    });
  }

  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions ?? 0), 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const totalTime = sessions.reduce((sum, s) => sum + (s.time_taken_seconds ?? 0), 0);

  const sessionIds = sessions.map((s) => s.id);
  const { data: answers } = await authClient
    .from("quiz_session_answers")
    .select("question_id")
    .in("session_id", sessionIds);

  let uniqueTopics = 0;
  if (answers && answers.length > 0) {
    const questionIds = [...new Set(answers.map((a) => a.question_id))];
    const { data: questions } = await authClient
      .from("questions")
      .select("topic_name")
      .in("id", questionIds);
    if (questions) {
      uniqueTopics = new Set(
        questions.map((q) => q.topic_name).filter(Boolean),
      ).size;
    }
  }

  return NextResponse.json({
    date,
    quizzesTaken: sessions.length,
    questionsAnswered: totalQuestions,
    correctAnswers: totalCorrect,
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    totalTimeSeconds: totalTime,
    uniqueTopics,
  });
}
