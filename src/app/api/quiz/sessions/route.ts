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
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);
  const mode = req.nextUrl.searchParams.get("mode");

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getAuthClient(accessToken);
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = authClient
    .from("quiz_sessions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (mode) {
    query = query.eq("mode", mode);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: sessions, count, error } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  return NextResponse.json({
    sessions,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  });
}
