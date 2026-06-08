import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ questionSetId: string }> },
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

  const { questionSetId } = await params;

  const { data: qs, error } = await authClient
    .from("question_sets")
    .select("generation_status, question_count")
    .eq("id", questionSetId)
    .single();

  if (error || !qs) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const progressMap: Record<string, number> = {
    queued: 0,
    searching: 25,
    generating: 60,
    complete: 100,
    error: 100,
  };

  return NextResponse.json({
    status: qs.generation_status,
    progress: progressMap[qs.generation_status as string] ?? 0,
  });
}
