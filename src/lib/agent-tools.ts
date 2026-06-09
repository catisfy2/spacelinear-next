import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabase-server";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from "./constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Types ────────────────────────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ActionBlock {
  action: string;
  params: Record<string, unknown>;
}

// ── Parsing ──────────────────────────────────────────────────────────────

/**
 * Parse action blocks from AI response text.
 * Looks for [ACTION]...[/ACTION] blocks containing JSON.
 */
export function parseActionBlocks(text: string): ActionBlock[] {
  const blocks: ActionBlock[] = [];
  const regex = /\[ACTION\]\s*(\{[\s\S]*?\})\s*\[\/ACTION\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && parsed.action && parsed.params) {
        blocks.push({
          action: parsed.action,
          params: parsed.params,
        });
      }
    } catch {
      // Skip malformed blocks
      console.warn("Failed to parse action block:", match[1].slice(0, 100));
    }
  }

  return blocks;
}

/**
 * Remove action blocks from text to get clean response.
 */
export function stripActionBlocks(text: string): string {
  return text
    .replace(/\[ACTION\]\s*\{[\s\S]*?\}\s*\[\/ACTION\]\n*/g, "")
    .replace(/\[ACTION\]\s*\{[\s\S]*?\}\s*\[\/ACTION\]/g, "")
    .trim();
}

// ── Execution ────────────────────────────────────────────────────────────

/**
 * Create an action executor that performs database operations
 * using the user's authenticated Supabase client.
 */
export function createActionExecutor(accessToken: string) {
  const authClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const requireUser = async () => {
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    return user;
  };

  return {
    execute: async (block: ActionBlock): Promise<ActionResult> => {
      try {
        const user = await requireUser();
        return await executeAction(authClient, user.id, block);
      } catch (error: unknown) {
        return {
          success: false,
          action: block.action,
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    },

    executeAll: async (blocks: ActionBlock[]): Promise<ActionResult[]> => {
      const results: ActionResult[] = [];
      for (const block of blocks) {
        results.push(
          await executeAction(authClient, (await requireUser()).id, block),
        );
      }
      return results;
    },
  };
}

async function executeAction(
  client: SupabaseClient<Database>,
  userId: string,
  block: ActionBlock,
): Promise<ActionResult> {
  const params = block.params;

  switch (block.action) {
    case "createSubject":
      return createSubject(client, userId, params);
    case "createTopic":
      return createTopic(client, userId, params);
    case "createNote":
      return createNote(client, userId, params);
    case "createMaterial":
      return createMaterial(client, userId, params);
    case "createQuizQuestions":
      return createQuizQuestions(userId, params);
    case "createQuizSet":
      return createQuizSet(client, userId, params);
    default:
      return {
        success: false,
        action: block.action,
        message: `Unknown action: ${block.action}`,
      };
  }
}

// ── Action Implementations ───────────────────────────────────────────────

async function createSubject(
  client: SupabaseClient<Database>,
  userId: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const name = params.name as string | undefined;
  if (!name?.trim()) {
    return {
      success: false,
      action: "createSubject",
      message: "Subject name is required",
    };
  }

  const { data, error } = await client
    .from("subjects")
    .insert({
      name: name.trim(),
      description: (params.description as string)?.trim() || null,
      color:
        (params.color as string) ||
        DEFAULT_SUBJECT_COLORS[
          Math.floor(Math.random() * DEFAULT_SUBJECT_COLORS.length)
        ],
      icon:
        (params.icon as string) ||
        DEFAULT_SUBJECT_ICONS[
          Math.floor(Math.random() * DEFAULT_SUBJECT_ICONS.length)
        ],
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    return { success: false, action: "createSubject", message: error.message };
  }

  return {
    success: true,
    action: "createSubject",
    message: `Created subject "${data.name}"`,
    data: { id: data.id, name: data.name, icon: data.icon },
  };
}

async function createTopic(
  client: SupabaseClient<Database>,
  userId: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const title = params.title as string | undefined;
  const subjectName = params.subjectName as string | undefined;

  if (!title?.trim()) {
    return {
      success: false,
      action: "createTopic",
      message: "Topic title is required",
    };
  }
  if (!subjectName?.trim()) {
    return {
      success: false,
      action: "createTopic",
      message: "Subject name is required",
    };
  }

  // Find or create the subject
  const { data: existingSubjects } = await client
    .from("subjects")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", subjectName.trim());

  let subjectId: string | null =
    existingSubjects && existingSubjects.length > 0
      ? existingSubjects[0].id
      : null;

  if (!subjectId) {
    const { data: newSubject, error: subjectError } = await client
      .from("subjects")
      .insert({
        name: subjectName.trim(),
        description: null,
        color:
          DEFAULT_SUBJECT_COLORS[
            Math.floor(Math.random() * DEFAULT_SUBJECT_COLORS.length)
          ],
        icon: DEFAULT_SUBJECT_ICONS[
          Math.floor(Math.random() * DEFAULT_SUBJECT_ICONS.length)
        ],
        user_id: userId,
      })
      .select()
      .single();

    if (subjectError) {
      return {
        success: false,
        action: "createTopic",
        message: subjectError.message,
      };
    }
    subjectId = newSubject.id;
  }

  // Create the topic
  const now = new Date();
  const farFuture = new Date(now);
  farFuture.setDate(farFuture.getDate() + 31);

  const { data, error } = await client
    .from("topics")
    .insert({
      title: title.trim(),
      description: (params.description as string)?.trim() || null,
      notes: (params.notes as string) || null,
      subject_id: subjectId,
      tags: (params.tags as string[]) || [],
      user_id: userId,
      state: "new",
      next_review_date: farFuture.toISOString(),
      current_interval_days: 0,
      ease_factor: 2.5,
      total_reviews: 0,
      correct_reviews: 0,
      streak: 0,
    })
    .select()
    .single();

  if (error) {
    return { success: false, action: "createTopic", message: error.message };
  }

  return {
    success: true,
    action: "createTopic",
    message: `Created topic "${data.title}" under "${subjectName}"`,
    data: { id: data.id, title: data.title, subjectName },
  };
}

async function createNote(
  client: SupabaseClient<Database>,
  userId: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const title = params.title as string | undefined;
  const content = params.content as string | undefined;

  if (!title?.trim()) {
    return {
      success: false,
      action: "createNote",
      message: "Note title is required",
    };
  }
  if (!content?.trim()) {
    return {
      success: false,
      action: "createNote",
      message: "Note content is required",
    };
  }

  const { data, error } = await client
    .from("notes")
    .insert({
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      tags: (params.tags as string[]) || [],
    })
    .select()
    .single();

  if (error) {
    return { success: false, action: "createNote", message: error.message };
  }

  return {
    success: true,
    action: "createNote",
    message: `Created note "${data.title}"`,
    data: { id: data.id, title: data.title, createdAt: data.created_at },
  };
}

async function createMaterial(
  client: SupabaseClient<Database>,
  userId: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const name = params.name as string | undefined;
  const content = params.content as string | undefined;

  if (!name?.trim()) {
    return {
      success: false,
      action: "createMaterial",
      message: "Material name is required",
    };
  }
  if (!content?.trim()) {
    return {
      success: false,
      action: "createMaterial",
      message: "Material content is required",
    };
  }

  const { data, error } = await client
    .from("materials")
    .insert({
      user_id: userId,
      name: name.trim(),
      type: "text",
      content: content.trim(),
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      action: "createMaterial",
      message: error.message,
    };
  }

  return {
    success: true,
    action: "createMaterial",
    message: `Created study material "${data.name}"`,
    data: { id: data.id, name: data.name, createdAt: data.created_at },
  };
}

async function createQuizSet(
  client: SupabaseClient<Database>,
  userId: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const title = (params.title as string)?.trim();
  const questions = params.questions as
    | Array<{
        question: string;
        options: string[];
        answer: string;
        explanation?: string;
        difficulty?: string;
        tags?: string[];
      }>
    | undefined;
  const timeLimit = params.timeLimit as number | undefined;
  const topicName = (params.topicName as string)?.trim();
  const difficulty = (params.difficulty as string)?.trim() || "mixed";

  if (!title) {
    return {
      success: false,
      action: "createQuizSet",
      message: "Quiz set title is required",
    };
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return {
      success: false,
      action: "createQuizSet",
      message: "At least one question is required",
    };
  }

  // Resolve topic if topicName provided
  let topicId: string | null = null;
  if (topicName) {
    const { data: existingTopics } = await client
      .from("topics")
      .select("id")
      .eq("user_id", userId)
      .ilike("title", topicName);

    if (existingTopics && existingTopics.length > 0) {
      topicId = existingTopics[0].id;
    }
  }

  // Use admin client for inserts
  const adminClient = getSupabaseAdmin();

  // Create the question set
  const { data: questionSet, error: setError } = await (adminClient as any)
    .from("question_sets")
    .insert({
      user_id: userId,
      title,
      question_count: questions.length,
      topic_id: topicId,
      difficulty,
      time_limit: timeLimit ?? null,
    })
    .select("id")
    .single();

  if (setError || !questionSet) {
    return {
      success: false,
      action: "createQuizSet",
      message: setError?.message || "Failed to create question set",
    };
  }

  const questionSetId = questionSet.id;

  // Insert questions
  const questionRows = questions.map((q, idx) => ({
    question_set_id: questionSetId,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation ?? null,
    difficulty: ["easy", "medium", "hard"].includes(q.difficulty ?? "")
      ? q.difficulty
      : "medium",
    tags: q.tags ?? [],
    order: idx,
  }));

  const { error: questionsError } = await (adminClient as any)
    .from("questions")
    .insert(questionRows);

  if (questionsError) {
    return {
      success: false,
      action: "createQuizSet",
      message: questionsError.message,
    };
  }

  // Also insert into legacy quizzes table for backward compatibility
  try {
    const legacyRows = questions.map((q) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      tags: q.tags ?? [],
      subject: null,
      topic: topicName ?? null,
      created_by: userId,
    }));
    await (adminClient as any).from("quizzes").insert(legacyRows);
  } catch {
    // Legacy insert is non-critical
  }

  const timeLimitMsg =
    timeLimit !== undefined ? ` with a ${timeLimit}-minute time limit` : "";

  return {
    success: true,
    action: "createQuizSet",
    message: `Created quiz set "${title}" with ${questions.length} question(s)${timeLimitMsg}`,
    data: {
      id: questionSetId,
      title,
      questionCount: questions.length,
      timeLimit,
    },
  };
}

async function createQuizQuestions(
  userId: string,
  params: Record<string, unknown>,
): Promise<ActionResult> {
  const questions = params.questions as
    | Array<{
        question: string;
        options: string[];
        answer: string;
        subject?: string;
        topic?: string;
        tags?: string[];
      }>
    | undefined;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return {
      success: false,
      action: "createQuizQuestions",
      message: "At least one question is required",
    };
  }

  const adminClient = getSupabaseAdmin();

  const rows = questions.map((q) => ({
    question: q.question,
    options: q.options,
    answer: q.answer,
    tags: q.tags || [],
    subject: q.subject || null,
    topic: q.topic || null,
    created_by: userId,
  }));

  const { data, error } = await adminClient
    .from("quizzes")
    .insert(rows)
    .select();

  if (error) {
    return {
      success: false,
      action: "createQuizQuestions",
      message: error.message,
    };
  }

  return {
    success: true,
    action: "createQuizQuestions",
    message: `Created ${data.length} quiz question(s)`,
    data: { count: data.length },
  };
}
