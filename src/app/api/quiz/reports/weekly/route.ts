import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const accessToken = req.nextUrl.searchParams.get("accessToken");
  const weekEndStr = req.nextUrl.searchParams.get("weekEnd");

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

  const weekEnd = weekEndStr ? new Date(weekEndStr) : new Date();
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  weekEnd.setHours(23, 59, 59, 999);

  const startStr = weekStart.toISOString();
  const endStr = weekEnd.toISOString();

  const { data: sessions } = await authClient
    .from("quiz_sessions")
    .select("id, score, total_questions, time_taken_seconds, completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", startStr)
    .lte("completed_at", endStr)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: true });

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({
      weekStart: weekStart.toISOString().split("T")[0],
      quizzesTaken: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalTimeSeconds: 0,
      dailyBreakdown: [],
    });
  }

  const dailyMap = new Map<string, { quizzes: number; questions: number; correct: number; time: number }>();

  for (const s of sessions) {
    const day = (s.completed_at as string).split("T")[0];
    const existing = dailyMap.get(day) ?? { quizzes: 0, questions: 0, correct: 0, time: 0 };
    existing.quizzes += 1;
    existing.questions += s.total_questions ?? 0;
    existing.correct += s.score ?? 0;
    existing.time += s.time_taken_seconds ?? 0;
    dailyMap.set(day, existing);
  }

  const dailyBreakdown = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      quizzesTaken: stats.quizzes,
      questionsAnswered: stats.questions,
      correctAnswers: stats.correct,
      accuracy: stats.questions > 0 ? Math.round((stats.correct / stats.questions) * 100) : 0,
      totalTimeSeconds: stats.time,
      uniqueTopics: 0,
    }));

  const totalQuestions = sessions.reduce((sum, s) => sum + (s.total_questions ?? 0), 0);
  const totalCorrect = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const totalTime = sessions.reduce((sum, s) => sum + (s.time_taken_seconds ?? 0), 0);

  return NextResponse.json({
    weekStart: weekStart.toISOString().split("T")[0],
    quizzesTaken: sessions.length,
    questionsAnswered: totalQuestions,
    correctAnswers: totalCorrect,
    accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    totalTimeSeconds: totalTime,
    dailyBreakdown,
  });
}
