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
  const topicId = req.nextUrl.searchParams.get("topicId");

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = authClient
    .from("question_sets")
    .select("id, title, question_count, topic_id, material_id, extra_context, difficulty, time_limit, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  const { data: sets, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch question sets" }, { status: 500 });
  }

  // Get topic names for display
  const topicIds = [...new Set((sets ?? []).map((s) => s.topic_id).filter(Boolean))];
  const { data: topics } = topicIds.length > 0
    ? await authClient.from("topics").select("id, title").in("id", topicIds)
    : { data: [] };

  const topicNameMap = new Map((topics ?? []).map((t) => [t.id, t.title]));

  // Get material names for display
  const materialIds = [...new Set((sets ?? []).map((s) => s.material_id).filter(Boolean))];
  const { data: materials } = materialIds.length > 0
    ? await authClient.from("materials").select("id, name").in("id", materialIds)
    : { data: [] };

  const materialNameMap = new Map((materials ?? []).map((m) => [m.id, m.name]));

  // Check which sets have been attempted
  const setIds = (sets ?? []).map((s) => s.id);
  const { data: attempts } = setIds.length > 0
    ? await authClient
        .from("quiz_sessions")
        .select("question_set_id")
        .eq("user_id", user.id)
        .in("question_set_id", setIds)
        .not("completed_at", "is", null)
    : { data: [] };

  const attemptedSetIds = new Set((attempts ?? []).map((a) => a.question_set_id));

  const enriched = (sets ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    questionCount: s.question_count,
    topicId: s.topic_id,
    topicName: s.topic_id ? (topicNameMap.get(s.topic_id) ?? null) : null,
    materialId: s.material_id ?? null,
    materialName: s.material_id ? (materialNameMap.get(s.material_id) ?? null) : null,
    extraContext: s.extra_context ?? null,
    difficulty: s.difficulty ?? "mixed",
    timeLimit: s.time_limit ?? null,
    createdAt: s.created_at,
    attempted: attemptedSetIds.has(s.id),
  }));

  return NextResponse.json({ sets: enriched });
}
