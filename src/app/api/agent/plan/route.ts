import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/lib/inngest/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { prompt, description, materialIds, accessToken } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: user, error: authError } = await authClient.auth.getUser();
    if (authError || !user.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { data, error } = await (authClient as any)
      .from("study_plans")
      .insert({
        user_id: user.user.id,
        prompt: prompt.trim(),
        description: description?.trim() ?? null,
        status: "generating",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create plan" },
        { status: 500 }
      );
    }

    const planId = data.id as string;

    await inngest.send({
      name: "plan/generate",
      data: {
        planId,
        userId: user.user.id,
        prompt: prompt.trim(),
        description: description?.trim() ?? "",
        materialIds: materialIds ?? [],
      },
    });

    return NextResponse.json({ planId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Plan generation error:", message, error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("id");
    const accessToken = searchParams.get("accessToken");

    if (!planId || !accessToken) {
      return NextResponse.json(
        { error: "Plan ID and authentication required" },
        { status: 400 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: user, error: authError } = await authClient.auth.getUser();
    if (authError || !user.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const { data: plan, error } = await (authClient as any)
      .from("study_plans")
      .select("*")
      .eq("id", planId)
      .eq("user_id", user.user.id)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: plan.id,
      title: plan.title,
      prompt: plan.prompt,
      description: plan.description,
      planData: plan.plan_data,
      status: plan.status,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    });
  } catch (error) {
    console.error("Plan fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
