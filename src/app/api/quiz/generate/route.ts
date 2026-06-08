import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";
import type { GenerationMode } from "@/types/quiz";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    mode,
    topicIds,
    customTopic,
    materialIds,
    questionCount = 10,
    difficulty = "mixed",
    supplementWithWeb = false,
    accessToken,
  } = body as {
    mode: GenerationMode;
    topicIds?: string[];
    customTopic?: string;
    materialIds?: string[];
    questionCount?: number;
    difficulty?: string;
    supplementWithWeb?: boolean;
    accessToken: string;
  };

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

  let title = "Quiz";
  if (mode === "today") title = "Today's Quiz";
  else if (mode === "topic" && topicIds?.length) {
    const { data: topics } = await authClient
      .from("topics")
      .select("title")
      .in("id", topicIds);
    title = `Quiz: ${(topics ?? []).map((t) => t.title).join(", ")}`;
  } else if (mode === "custom" && customTopic) {
    title = `Quiz: ${customTopic}`;
  } else if (mode === "materials" && materialIds?.length) {
    const { data: materials } = await authClient
      .from("materials")
      .select("name")
      .in("id", materialIds);
    title = `Quiz: ${(materials ?? []).map((m) => m.name).join(", ")}`;
  }

  const { data: questionSet, error: insertError } = await authClient
    .from("question_sets")
    .insert({
      user_id: user.id,
      title,
      question_count: questionCount,
      difficulty,
      generation_mode: mode,
      generation_status: "queued",
    })
    .select("id")
    .single();

  if (insertError || !questionSet) {
    return NextResponse.json(
      { error: "Failed to create question set" },
      { status: 500 },
    );
  }

  await inngest.send({
    name: "quiz/generate",
    data: {
      questionSetId: questionSet.id,
      mode,
      topicIds,
      customTopic,
      materialIds,
      questionCount,
      difficulty,
      supplementWithWeb,
    },
  });

  return NextResponse.json({ questionSetId: questionSet.id }, { status: 202 });
}
