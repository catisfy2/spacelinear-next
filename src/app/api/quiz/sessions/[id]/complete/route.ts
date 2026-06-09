import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { timeTakenSeconds, accessToken } = await req.json();

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

  const { data: session, error: sessionError } = await authClient
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.completed_at) {
    const existing = await buildResults(authClient, sessionId);
    return NextResponse.json({ session: mapSession(session), results: existing });
  }

  const { data: answers } = await authClient
    .from("quiz_session_answers")
    .select("id, question_id, selected_answer, is_correct")
    .eq("session_id", sessionId);

  if (!answers) {
    return NextResponse.json({ error: "No answers found" }, { status: 400 });
  }

  const shortAnswerIds = answers
    .filter((a) => !a.is_correct && a.selected_answer)
    .map((a) => a.question_id);

  if (shortAnswerIds.length > 0) {
    const { data: shortQuestions } = await authClient
      .from("questions")
      .select("id, question, answer, explanation")
      .in("id", shortAnswerIds)
      .eq("question_type", "short_answer");

    if (shortQuestions && shortQuestions.length > 0) {
      const shortAnswersToEval = answers.filter(
        (a) =>
          shortQuestions.some((q) => q.id === a.question_id) &&
          a.selected_answer,
      );

      if (shortAnswersToEval.length > 0) {
        const evaluationPrompt = shortAnswersToEval
          .map((a) => {
            const q = shortQuestions.find((sq) => sq.id === a.question_id)!;
            return `Q: "${q.question}"\nCorrect: "${q.answer}"\nStudent: "${a.selected_answer}"`;
          })
          .join("\n\n");

        try {
          const { text } = await generateText({
            model: groq("llama-3.3-70b-versatile"),
            prompt: `You are a teacher evaluating short-answer quiz responses. For each question, determine if the student's answer is semantically correct (not just keyword matching).

${evaluationPrompt}

Return a JSON array of objects with fields "questionId" and "isCorrect" (boolean).

Example:
[
  {"questionId": "abc-123", "isCorrect": true},
  {"questionId": "def-456", "isCorrect": false}
]

Return ONLY valid JSON, no other text.`,
          });

          const cleanJson = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
          const evaluations = JSON.parse(cleanJson) as {
            questionId: string;
            isCorrect: boolean;
          }[];

          for (const evalItem of evaluations) {
            const existingAnswer = answers.find(
              (a) => a.question_id === evalItem.questionId,
            );
            if (existingAnswer && existingAnswer.is_correct !== evalItem.isCorrect) {
              await authClient
                .from("quiz_session_answers")
                .update({ is_correct: evalItem.isCorrect })
                .eq("id", existingAnswer.id);

              if (evalItem.isCorrect) {
                await authClient.rpc("increment_session_score", {
                  session_uuid: sessionId,
                });
              }
            }
          }
        } catch {
          // AI evaluation failed – leave short answers as-is
        }
      }
    }
  }

  await authClient
    .from("quiz_sessions")
    .update({
      completed_at: new Date().toISOString(),
      time_taken_seconds: timeTakenSeconds ?? null,
    })
    .eq("id", sessionId);

  const { data: updatedSession } = await authClient
    .from("quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  const results = await buildResults(authClient, sessionId);

  return NextResponse.json({
    session: mapSession(updatedSession ?? session),
    results,
  });
}

async function buildResults(
  client: ReturnType<typeof createClient<Database>>,
  sessionId: string,
) {
  const { data: answers } = await client
    .from("quiz_session_answers")
    .select("question_id, selected_answer, is_correct")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!answers) return [];

  const questionIds = answers.map((a) => a.question_id);
  const { data: questions } = await client
    .from("questions")
    .select("id, question, answer, explanation, question_type")
    .in("id", questionIds)
    .order("order", { ascending: true });

  if (!questions) return [];

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return answers.map((a) => {
    const q = questionMap.get(a.question_id);
    return {
      questionId: a.question_id,
      question: q?.question ?? "",
      userAnswer: a.selected_answer ?? "",
      correctAnswer: q?.answer ?? "",
      explanation: q?.explanation ?? null,
      isCorrect: a.is_correct,
      questionType: q?.question_type ?? "mcq",
    };
  });
}

function mapSession(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    questionSetId: row.question_set_id,
    mode: row.mode,
    score: row.score,
    totalQuestions: row.total_questions,
    timeTakenSeconds: row.time_taken_seconds,
    metadata: row.metadata ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
