import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from "@/lib/constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const INITIAL_EASE = 2.5;

function getAuthClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, accessToken, conversationId: incomingConversationId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!accessToken) {
      return NextResponse.json({ error: "Access token required" }, { status: 401 });
    }

    const authClient = getAuthClient(accessToken);
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subjects } = await authClient
      .from("subjects")
      .select("id, name")
      .eq("user_id", user.id);

    const { data: topics } = await authClient
      .from("topics")
      .select("id, title, subject_id")
      .eq("user_id", user.id);

    let conversationId = incomingConversationId;
    let pastMessages: { role: "user" | "assistant"; content: string }[] = [];

    if (conversationId) {
      const { data: conversation } = await authClient
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (conversation) {
        const { data: msgs } = await authClient
          .from("messages")
          .select("role, content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(20);
        pastMessages = (msgs ?? []).slice(-10) as typeof pastMessages;
      } else {
        conversationId = undefined;
      }
    }

    if (!conversationId) {
      const title = prompt.slice(0, 60) + (prompt.length > 60 ? "..." : "");
      const { data: conversation } = await authClient
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();
      conversationId = conversation?.id;
    }

    await authClient.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: prompt,
    });

    const system = `You are an AI study assistant for SpaceLinear. You help users create and manage their study content using tools.

AVAILABLE TOOLS:
- createSubject, createTopic, createNote, createMaterial — create new content
- listSubjects, listTopics — list existing content
- scheduleTopicForToday — schedule a topic for review
- generateAiContent — auto-generate descriptions and tags for a topic
- searchNotes — search your notes and materials for relevant information

RULES:
1. PLAN FIRST. Break the request into steps before acting. For example, if the user asks to "create a Physics subject with topics", first create the subject, then create each topic under it.
2. Always use tools to fulfill the request — never just describe what you would do.
3. After completing all actions, respond with a clear summary of what was created or changed.
4. If you need more information, ask the user directly.
5. Pick a random icon and color from the available defaults when none is specified.`;

    const messageContents = pastMessages.map(
      (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
    ).join("\n\n");

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system,
      prompt: `Current subjects: ${JSON.stringify(subjects ?? [])}
Current topics: ${JSON.stringify(topics ?? [])}

${messageContents ? `Recent conversation:\n${messageContents}\n\n` : ""}New request: ${prompt}`,
      stopWhen: stepCountIs(10),
      tools: {
        createSubject: tool({
          description: "Create a new study subject. Picks a random icon and color if not specified.",
          inputSchema: z.object({
            name: z.string().describe("Subject name"),
            description: z.string().optional().describe("Subject description"),
            color: z.string().optional().describe("Color hex code"),
            icon: z.string().optional().describe("Icon emoji"),
          }),
          execute: async ({ name, description, color, icon }) => {
            const { data, error } = await authClient
              .from("subjects")
              .insert({
                name,
                description: description ?? null,
                color: color ?? pick(DEFAULT_SUBJECT_COLORS),
                icon: icon ?? pick(DEFAULT_SUBJECT_ICONS),
                user_id: user.id,
              })
              .select()
              .single();
            if (error) throw new Error(`Failed to create subject: ${error.message}`);
            return { id: data.id, name: data.name, color: data.color, icon: data.icon };
          },
        }),
        createTopic: tool({
          description: "Create a new topic under a subject.",
          inputSchema: z.object({
            title: z.string().describe("Topic title"),
            subjectId: z.string().describe("Subject ID to create under"),
            description: z.string().optional().describe("Topic description or notes"),
            tags: z.array(z.string()).optional().describe("Tags for the topic"),
          }),
          execute: async ({ title, subjectId, description, tags }) => {
            const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
            const { data, error } = await authClient
              .from("topics")
              .insert({
                title,
                description: description ?? null,
                notes: description ?? null,
                subject_id: subjectId,
                tags: tags ?? [],
                state: "backlog",
                next_review_date: farFuture,
                current_interval_days: 0,
                ease_factor: INITIAL_EASE,
                total_reviews: 0,
                correct_reviews: 0,
                streak: 0,
                user_id: user.id,
              })
              .select()
              .single();
            if (error) throw new Error(`Failed to create topic: ${error.message}`);
            return { id: data.id, title: data.title, subjectId: data.subject_id };
          },
        }),
        createNote: tool({
          description: "Create a new note with markdown content",
          inputSchema: z.object({
            title: z.string().describe("Note title"),
            content: z.string().describe("Note content in markdown format"),
            tags: z.array(z.string()).optional().describe("Tags for the note"),
          }),
          execute: async ({ title, content, tags }) => {
            const { data, error } = await authClient
              .from("notes")
              .insert({
                title,
                content,
                tags: tags ?? [],
                starred: false,
                user_id: user.id,
              })
              .select()
              .single();
            if (error) throw new Error(`Failed to create note: ${error.message}`);
            return { id: data.id, title: data.title };
          },
        }),
        createMaterial: tool({
          description: "Create a study material from text content. This triggers AI quiz generation.",
          inputSchema: z.object({
            name: z.string().describe("Material name"),
            content: z.string().describe("Study material content (text, notes, or article)"),
          }),
          execute: async ({ name, content }) => {
            const { data, error } = await authClient
              .from("materials")
              .insert({
                name,
                type: "text",
                content,
                user_id: user.id,
              })
              .select()
              .single();
            if (error) throw new Error(`Failed to create material: ${error.message}`);
            return { id: data.id, name: data.name };
          },
        }),
        listSubjects: tool({
          description: "List all existing subjects for the user",
          inputSchema: z.object({}),
          execute: async () => {
            const { data, error } = await authClient
              .from("subjects")
              .select("id, name, description, color, icon")
              .eq("user_id", user.id)
              .order("name");
            if (error) throw new Error(`Failed to list subjects: ${error.message}`);
            return { subjects: data ?? [] };
          },
        }),
        listTopics: tool({
          description: "List existing topics, optionally filtered by subject",
          inputSchema: z.object({
            subjectId: z.string().optional().describe("Subject ID to filter by"),
          }),
          execute: async ({ subjectId }) => {
            let query = authClient
              .from("topics")
              .select("id, title, subject_id, state, tags")
              .eq("user_id", user.id);
            if (subjectId) query = query.eq("subject_id", subjectId);
            const { data, error } = await query.order("title");
            if (error) throw new Error(`Failed to list topics: ${error.message}`);
            return { topics: data ?? [] };
          },
        }),
        scheduleTopicForToday: tool({
          description: "Schedule a topic for review today so it appears in the Today view",
          inputSchema: z.object({
            topicId: z.string().describe("Topic ID to schedule"),
          }),
          execute: async ({ topicId }) => {
            const { data, error } = await authClient
              .from("topics")
              .update({
                state: "new",
                next_review_date: new Date().toISOString(),
              })
              .eq("id", topicId)
              .eq("user_id", user.id)
              .select()
              .single();
            if (error) throw new Error(`Failed to schedule topic: ${error.message}`);
            return { id: data.id, title: data.title, state: data.state };
          },
        }),
        generateAiContent: tool({
          description: "Generate an AI description and tags for a topic using the Groq LLM",
          inputSchema: z.object({
            topicId: z.string().describe("Topic ID to update"),
            title: z.string().describe("Topic title for context"),
            subjectName: z.string().optional().describe("Subject name the topic belongs to"),
          }),
          execute: async ({ topicId, title, subjectName }) => {
            const { text } = await generateText({
              model: groq("llama-3.3-70b-versatile"),
              prompt: `Generate learning content for a topic titled "${title}"${subjectName ? ` under the subject "${subjectName}"` : ""}.

Return a JSON object with exactly two fields:
- "description": a 1-2 sentence explanation of the concept
- "tags": an array of 3-5 relevant lowercase hyphenated tags

Example:
{
  "description": "A mechanism that allows neural networks to focus on different parts of the input sequence when making predictions.",
  "tags": ["deep-learning", "transformers", "neural-networks"]
}

Return ONLY valid JSON, no other text.`,
            });
            const parsed = JSON.parse(text) as { description: string; tags: string[] };
            const { error } = await authClient
              .from("topics")
              .update({
                description: parsed.description,
                tags: parsed.tags,
              })
              .eq("id", topicId)
              .eq("user_id", user.id);
            if (error) throw new Error(`Failed to update topic: ${error.message}`);
            return { topicId, description: parsed.description, tags: parsed.tags };
          },
        }),
        searchNotes: tool({
          description: "Search your notes and study materials by keyword. Returns relevant snippets the AI can use to answer questions.",
          inputSchema: z.object({
            query: z.string().describe("Search keywords or phrase"),
            limit: z.number().optional().describe("Maximum results to return (default 5)"),
          }),
          execute: async ({ query, limit = 5 }) => {
            const [notesResult, materialsResult] = await Promise.all([
              authClient
                .from("notes")
                .select("id, title, content")
                .eq("user_id", user.id)
                .ilike("content", `%${query}%`)
                .order("updated_at", { ascending: false })
                .limit(limit),
              authClient
                .from("materials")
                .select("id, name, content")
                .eq("user_id", user.id)
                .not("content", "is", null)
                .ilike("content", `%${query}%`)
                .order("updated_at", { ascending: false })
                .limit(limit),
            ]);
            const results: { source: string; title: string; snippet: string }[] = [];
            for (const note of notesResult.data ?? []) {
              const snippet = note.content.length > 300
                ? note.content.slice(0, 300) + "..."
                : note.content;
              results.push({ source: "note", title: note.title, snippet });
            }
            for (const mat of materialsResult.data ?? []) {
              const snippet = mat.content && mat.content.length > 300
                ? mat.content.slice(0, 300) + "..."
                : mat.content ?? "";
              results.push({ source: "material", title: mat.name, snippet });
            }
            if (notesResult.error) throw new Error(`Failed to search notes: ${notesResult.error.message}`);
            if (materialsResult.error) throw new Error(`Failed to search materials: ${materialsResult.error.message}`);
            return { results, total: results.length };
          },
        }),
      },
    });

    if (result.text) {
      await authClient.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: result.text,
      });
    }

    return NextResponse.json({
      text: result.text,
      conversationId,
      steps: result.steps?.length ?? 0,
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent processing failed" },
      { status: 500 },
    );
  }
}
