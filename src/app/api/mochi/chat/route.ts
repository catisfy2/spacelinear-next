import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { groq } from "@ai-sdk/groq";
import { generateText, streamText } from "ai";
import { getGeneralPrompt, getStudyPrompt } from "@/lib/mochi/prompts";
import { embedText } from "@/lib/mochi/embeddings";
import * as tools from "@/lib/mochi/tools";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const toolDescriptions = `Available tools (call them using JSON action blocks at the end of your response):

1. logStudyCommit
   Params: { subjectName?: string, topicName?: string, durationMinutes: number, difficulty: "easy"|"medium"|"hard"|"review", notes?: string }
   Description: Log a study session.

2. getStudyHistory
   Params: { days: number }
   Description: Get recent study commits grouped by day.

3. getWeeklyProgress
   Params: {}
   Description: Get this week's quiz stats with daily breakdown.

4. getQuizGaps
   Params: {}
   Description: Get topics with lowest quiz accuracy.

5. recommendNextStudy
   Params: {}
   Description: Get personalized study recommendations.

6. getTodaysTopics
   Params: {}
   Description: Get today's study list from the topics table — what's actually displayed on your Today page. Use this when the user asks what to study today.

7. getGapBasedStudyList
   Params: {}
   Description: Get a prioritized list of topics to review based on low quiz accuracy and study gaps.

8. searchMemory
   Params: { query: string }
   Description: Search past memories and conversations.

9. storeMemory
   Params: { content: string, metadata?: object }
   Description: Store an important fact or memory.

10. getDailyDigest
   Params: {}
   Description: Get today's study and quiz stats including streak.

11. importPastQuizData
   Params: {}
   Description: Import past quiz history into memory.

To call a tool, add an action block at the end of your response:
[ACTION]{"action":"toolName","params":{...}}[/ACTION]

You can call multiple tools in sequence — place each in its own block.`;

function stripActions(text: string) {
  return text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, "").trim();
}

const studyKeywords = [
  "study", "studying", "studied", "quiz", "quizzes", "exam", "exams",
  "test", "tests", "grade", "grades", "score", "scores", "progress",
  "topic", "topics", "subject", "subjects", "homework", "assignment",
  "schedule", "plan", "review", "practice", "learn", "lesson",
  "materials", "notes", "pulse", "performance", "today",
  "recommend", "suggest", "weak", "gap", "digest", "commit",
];

function isStudyRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return studyKeywords.some((kw) => lower.includes(kw));
}

interface ActionResult {
  action: string;
  summary: string;
}

async function executeActions(
  text: string,
  accessToken: string,
  userId: string,
): Promise<ActionResult[]> {
  const actionRegex = /\[ACTION\]\s*(\{[\s\S]*?\})\s*\[\/ACTION\]/g;
  const results: ActionResult[] = [];
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.action && parsed.params) {
        const toolFn = (tools as Record<string, unknown>)[parsed.action];
        if (typeof toolFn === "function") {
          const result = await (toolFn as (token: string, uid: string, params: unknown) => unknown)(
            accessToken,
            userId,
            parsed.params,
          );
          const summary =
            typeof result === "object" && result !== null
              ? JSON.stringify(result, null, 2)
              : String(result);
          results.push({ action: parsed.action, summary });
        }
      }
    } catch {
      // skip malformed blocks
    }
  }
  return results;
}

function getClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function persistResponse(
  chatId: string,
  userId: string,
  content: string,
  accessToken: string,
) {
  try {
    const client = getClient(accessToken);

    await client.from("mochi_conversations").insert({
      user_id: userId,
      mochi_chat_id: chatId,
      role: "assistant",
      content,
    });

    await client
      .from("mochi_chats")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId);

    if (content.length > 150) {
      const embedding = await embedText(content.slice(0, 500));
      const { data: recall } = await client.rpc("match_agent_memories", {
        p_user_id: userId,
        p_embedding: embedding,
        p_match_threshold: 0.85,
        p_match_count: 1,
      });
      if (!recall || (recall as unknown[]).length === 0) {
        await client.from("agent_memories").insert({
          user_id: userId,
          content: content.slice(0, 500),
          embedding,
          metadata: { type: "conversation" },
        });
      }
    }
  } catch {
    // best-effort
  }
}

export async function POST(req: NextRequest) {
  const { prompt, accessToken, history, mochiChatId } = await req.json();

  if (!accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 401 });
  }

  const authClient = getClient(accessToken);

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await tools.getMochiSettings(accessToken, user.id);
  if (!settings.enabled) {
    return NextResponse.json({ error: "Mochi is disabled" }, { status: 403 });
  }

  // Resolve or create mochi chat
  let chatId = mochiChatId;
  if (!chatId) {
    const { data: chat, error: chatErr } = await authClient
      .from("mochi_chats")
      .insert({ user_id: user.id, title: prompt.slice(0, 60) })
      .select()
      .single();
    if (chatErr || !chat) {
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }
    chatId = chat.id;
  }

  // Save user message
  await authClient.from("mochi_conversations").insert({
    user_id: user.id,
    mochi_chat_id: chatId,
    role: "user",
    content: prompt,
  });

  // Update chat title
  await authClient
    .from("mochi_chats")
    .update({
      title: prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId);

  let memories = "(no relevant past context)";
  if (prompt) {
    try {
      const embedding = await embedText(prompt);
      const { data: matches } = await authClient.rpc("match_agent_memories", {
        p_user_id: user.id,
        p_embedding: embedding,
        p_match_threshold: 0.5,
        p_match_count: 5,
      });
      if (matches && matches.length > 0) {
        memories = (matches as { content: string }[])
          .map((m) => `- ${m.content}`)
          .join("\n");
      }
    } catch {
      // memory search failed
    }
  }

  const msgHistory = (history ?? []).map((m: { role: string; content: string }) => ({
    role: m.role,
    content: m.content,
  }));
  const messages = [
    ...msgHistory,
    { role: "user" as const, content: prompt },
  ];

  const includeTools = isStudyRelated(prompt) || history?.some((m: { content: string }) => isStudyRelated(m.content));

  if (includeTools) {
    // Study mode — collect first response to detect and execute actions
    const systemPrompt = getStudyPrompt(
      settings.tone,
      memories,
      user.id,
      new Date().toLocaleDateString(),
    ) + "\n\n" + toolDescriptions;

    const { text: initialText } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
    });

    const actionResults = await executeActions(initialText, accessToken, user.id);

    if (actionResults.length > 0) {
      // Stream synthesis token-by-token
      const actionData = actionResults
        .map((r) => `Tool "${r.action}" returned:\n${r.summary}`)
        .join("\n\n");

      const synthesisPrompt = `You previously chose to look up data. Here are the results:\n\n${actionData}\n\nUsing this data, give a friendly, natural answer to the user's original question. Be specific — reference actual numbers, topic names, and recommendations. Do NOT include any action blocks.`;

      const result = streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: `You are Mochi, a friendly study assistant. Answer naturally and conversationally. Keep responses helpful and concise. Tone: ${settings.tone}`,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: initialText },
          { role: "user", content: synthesisPrompt },
        ],
      });

      let finalText = "";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.textStream) {
            finalText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
          await persistResponse(chatId, user.id, finalText, accessToken);
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain",
          "X-Mochi-Chat-Id": chatId,
        },
      });
    }

    // No actions — return stripped initial text as single chunk
    const finalText = stripActions(initialText);
    await persistResponse(chatId, user.id, finalText, accessToken);

    return new Response(finalText, {
      headers: {
        "Content-Type": "text/plain",
        "X-Mochi-Chat-Id": chatId,
      },
    });
  }

  // General mode — stream token-by-token
  const systemPrompt = getGeneralPrompt(settings.tone);

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    messages,
  });

  let finalText = "";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.textStream) {
        finalText += chunk;
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
      await persistResponse(chatId, user.id, finalText, accessToken);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "X-Mochi-Chat-Id": chatId,
    },
  });
}
