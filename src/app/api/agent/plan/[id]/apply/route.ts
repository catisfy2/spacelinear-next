import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { upsertStudyContent } from "@/lib/pinecone";
import type { StudyPlanData } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { accessToken } = await req.json();

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

    const { data: plan, error: planError } = await (authClient as any)
      .from("study_plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    if (plan.status !== "review") {
      return NextResponse.json(
        { error: "Plan is not in review status" },
        { status: 400 }
      );
    }

    const planData = plan.plan_data as StudyPlanData | null;
    if (!planData?.subjects?.length) {
      return NextResponse.json(
        { error: "Plan has no subjects to apply" },
        { status: 400 }
      );
    }

    const adminClient = getSupabaseAdmin();
    const createdSubjects: { id: string; name: string }[] = [];
    const createdTopics: { id: string; title: string }[] = [];

    for (const subject of planData.subjects) {
      const { data: newSubject, error: subjectError } = await (adminClient as any)
        .from("subjects")
        .insert({
          user_id: user.user.id,
          name: subject.name,
          description: subject.description,
          color: getSubjectColor(createdSubjects.length),
          icon: getSubjectIcon(createdSubjects.length),
        })
        .select("id, name")
        .single();

      if (subjectError || !newSubject) continue;

      createdSubjects.push(newSubject);

      for (const topic of subject.topics) {
          const { data: newTopic, error: topicError } = await (adminClient as any)
            .from("topics")
            .insert({
              subject_id: newSubject.id,
              user_id: user.user.id,
              plan_id: id,
              title: topic.title,
              description: topic.description,
              tags: [subject.name.toLowerCase(), topic.difficulty],
              state: "backlog",
              next_review_date: new Date().toISOString(),
            })
          .select("id, title")
          .single();

        if (topicError || !newTopic) continue;

        createdTopics.push(newTopic);

        for (const resource of topic.resources) {
          await (adminClient as any)
            .from("resources")
            .insert({
              entity_id: newTopic.id,
              entity_type: "topic",
              type: "link",
              title: resource.title,
              url: resource.url,
              content: resource.description,
            })
            .maybeSingle();
        }
      }
    }

    await (adminClient as any)
      .from("study_plans")
      .update({
        status: "applied",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    try {
      const contentText = planData.subjects
        .flatMap((s) => s.topics)
        .map((t) => `${t.title}: ${t.description}`)
        .join("\n");

      await upsertStudyContent([
        {
          id: `plan-applied-${id}`,
          text: contentText,
          metadata: {
            type: "plan",
            userId: user.user.id,
            title: plan.title ?? "Study Plan",
            text: contentText,
            sourceId: id,
            tags: planData.subjects.map((s) => s.name.toLowerCase()),
            createdAt: new Date().toISOString(),
          },
        },
      ]);
    } catch {
      // Pinecone upsert is non-critical
    }

    return NextResponse.json({
      success: true,
      subjectsCreated: createdSubjects.length,
      topicsCreated: createdTopics.length,
    });
  } catch (error) {
    console.error("Plan apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const SUBJECT_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

const SUBJECT_ICONS = [
  "📚", "🔬", "📐", "🌍", "💻",
  "🎨", "📖", "🧠", "📝", "🔭",
];

function getSubjectColor(index: number): string {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

function getSubjectIcon(index: number): string {
  return SUBJECT_ICONS[index % SUBJECT_ICONS.length];
}
