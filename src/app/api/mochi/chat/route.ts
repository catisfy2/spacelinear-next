import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { groq } from "@ai-sdk/groq";
import { generateText, streamText } from "ai";
import { getGeneralPrompt, getStudyPrompt } from "@/lib/mochi/prompts";
import { embedText } from "@/lib/mochi/embeddings";
import { parseFile } from "@/lib/mochi/fileParser";
import {
  createCompletedActivity,
  createInitialActivity,
  encodeSseEvent,
  type MochiActivity,
  type MochiStreamEvent,
} from "@/lib/mochi/stream";
import * as tools from "@/lib/mochi/tools";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const toolDescriptions = `Available tools (call them using JSON action blocks at the end of your response):

1. logStudyCommit { subjectName?, topicName?, durationMinutes, difficulty, notes? }
2. getStudyHistory { days }
3. getWeeklyProgress {}
4. getQuizGaps {}
5. recommendNextStudy {}
6. getTodaysTopics {}
7. getGapBasedStudyList {}
8. searchMemory { query }
9. storeMemory { content, metadata? }
10. getDailyDigest {}
11. importPastQuizData {}

To call a tool, add an action block:
[ACTION]{"action":"toolName","params":{}}[/ACTION]`;

const studyKeywords = [
  "study", "studying", "studied", "quiz", "exam", "test", "grade", "score",
  "progress", "topic", "subject", "homework", "assignment", "schedule", "plan",
  "review", "practice", "learn", "lesson", "materials", "notes", "pulse",
  "performance", "today", "recommend", "suggest", "weak", "gap", "digest",
  "commit",
];

interface ActionResult {
  action: string;
  summary: string;
}

function getClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function isStudyRelated(text: string) {
  const lower = text.toLowerCase();
  return studyKeywords.some((keyword) => lower.includes(keyword));
}

function stripActions(text: string) {
  return text.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, "").trim();
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
      const parsed = JSON.parse(match[1]) as {
        action?: string;
        params?: unknown;
      };
      const toolFn = parsed.action
        ? (tools as Record<string, unknown>)[parsed.action]
        : null;
      if (typeof toolFn !== "function") continue;

      const result = await (
        toolFn as (token: string, uid: string, params: unknown) => unknown
      )(accessToken, userId, parsed.params ?? {});
      results.push({
        action: parsed.action!,
        summary:
          typeof result === "object" && result !== null
            ? JSON.stringify(result, null, 2)
            : String(result),
      });
    } catch {
      // Skip malformed or failed actions and let Mochi answer normally.
    }
  }

  return results;
}

async function generateChatTitle(
  prompt: string,
  chatId: string,
  accessToken: string,
) {
  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system:
        "Generate a concise 2-5 word chat title from the user's query. Return only the title.",
      messages: [{ role: "user", content: prompt }],
    });
    const title = text.trim().replace(/^["']|["']$/g, "");
    await getClient(accessToken).from("mochi_chats").update({ title }).eq("id", chatId);
    return title;
  } catch {
    return null;
  }
}

async function persistResponse(
  chatId: string,
  userId: string,
  content: string,
  accessToken: string,
  activity: MochiActivity[],
) {
  try {
    const client = getClient(accessToken);
    const { data: message } = await client
      .from("mochi_conversations")
      .insert({
        user_id: userId,
        mochi_chat_id: chatId,
        role: "assistant",
        content,
        tool_calls: { activity },
      })
      .select("id")
      .single();

    await client
      .from("mochi_chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    if (content.length > 150) {
      const embedding = await embedText(content.slice(0, 500));
      const { data: recall } = await client.rpc("match_agent_memories", {
        p_user_id: userId,
        p_embedding: embedding,
        p_match_threshold: 0.85,
        p_match_count: 1,
      });
      if (!recall?.length) {
        await client.from("agent_memories").insert({
          user_id: userId,
          content: content.slice(0, 500),
          embedding,
          metadata: { type: "conversation" },
        });
      }
    }

    return message?.id ?? null;
  } catch {
    return null;
  }
}

function createSseResponse(
  run: (send: (event: MochiStreamEvent) => void) => Promise<void>,
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: MochiStreamEvent) => {
        controller.enqueue(encoder.encode(encodeSseEvent(event)));
      };
      try {
        await run(send);
      } catch (error) {
        console.error("Mochi stream error:", error);
        send({
          type: "error",
          message: "Mochi could not finish that response. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const prompt = ((formData.get("prompt") as string) ?? "").trim();
  const accessToken = (formData.get("accessToken") as string) ?? "";
  const existingChatId = (formData.get("mochiChatId") as string) || null;
  const history = JSON.parse(
    (formData.get("history") as string) ?? "[]",
  ) as { role: "user" | "assistant"; content: string }[];
  const file = formData.get("file") as File | null;

  if (!prompt || !accessToken) {
    return NextResponse.json(
      { error: "Prompt and access token are required" },
      { status: 400 },
    );
  }

  const authClient = getClient(accessToken);
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await tools.getMochiSettings(accessToken, user.id);
  if (!settings.enabled) {
    return NextResponse.json({ error: "Mochi is disabled" }, { status: 403 });
  }

  let fileContext = "";
  let filePageCount: number | undefined;
  let fileName = "";
  if (file) {
    fileName = file.name;
    try {
      const parsed = await parseFile(Buffer.from(await file.arrayBuffer()), fileName);
      filePageCount = parsed.pageCount;
      fileContext = `\n\n---\nAttached file: ${fileName}${filePageCount ? ` (${filePageCount} pages)` : ""}\n\n${parsed.text}\n---`;
    } catch (parseError) {
      return NextResponse.json(
        { error: `Could not read file "${fileName}": ${parseError instanceof Error ? parseError.message : "Unknown error"}` },
        { status: 400 },
      );
    }
  }

  let chatId = existingChatId;
  if (!chatId) {
    const { data: chat, error } = await authClient
      .from("mochi_chats")
      .insert({ user_id: user.id, title: prompt.slice(0, 60) })
      .select("id")
      .single();
    if (error || !chat) {
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }
    chatId = chat.id;
  }

  const userContent = file
    ? `File: ${fileName}${filePageCount ? ` - ${filePageCount} pages` : ""}\n\n${prompt}`
    : prompt;
  await authClient.from("mochi_conversations").insert({
    user_id: user.id,
    mochi_chat_id: chatId,
    role: "user",
    content: userContent,
  });
  await authClient
    .from("mochi_chats")
    .update({
      title: prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chatId);

  const llmPrompt = prompt + fileContext;
  let memories = "(no relevant past context)";
  try {
    const embedding = await embedText(llmPrompt);
    const { data } = await authClient.rpc("match_agent_memories", {
      p_user_id: user.id,
      p_embedding: embedding,
      p_match_threshold: 0.5,
      p_match_count: 5,
    });
    if (data?.length) {
      memories = data.map((memory) => `- ${memory.content}`).join("\n");
    }
  } catch {
    // Memory is optional context.
  }

  const messages = [
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: llmPrompt },
  ];
  const includeTools =
    isStudyRelated(prompt) || history.some((message) => isStudyRelated(message.content));
  const resolvedChatId = chatId;

  return createSseResponse(async (send) => {
    send({
      type: "meta",
      chatId: resolvedChatId,
      activity: createInitialActivity(Boolean(file)),
      ...(filePageCount ? { filePageCount } : {}),
    });

    let finalText = "";
    let actionNames: string[] = [];

    if (includeTools) {
      const { text: initialText } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system:
          getStudyPrompt(
            settings.tone,
            memories,
            user.id,
            new Date().toLocaleDateString(),
          ) +
          "\n\n" +
          toolDescriptions,
        messages,
      });
      const actionResults = await executeActions(initialText, accessToken, user.id);
      actionNames = actionResults.map((result) => result.action);

      if (actionResults.length) {
        const actionData = actionResults
          .map((result) => `Tool "${result.action}" returned:\n${result.summary}`)
          .join("\n\n");
        const result = streamText({
          model: groq("llama-3.3-70b-versatile"),
          system: `You are Mochi, a friendly study assistant. Answer naturally and concisely. Tone: ${settings.tone}`,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: initialText },
            {
              role: "user",
              content: `Use these results to answer the original question. Do not include action blocks.\n\n${actionData}`,
            },
          ],
        });
        for await (const delta of result.textStream) {
          finalText += delta;
          send({ type: "text", delta });
        }
      } else {
        finalText = stripActions(initialText);
        send({ type: "text", delta: finalText });
      }
    } else {
      const result = streamText({
        model: groq("llama-3.3-70b-versatile"),
        system: getGeneralPrompt(settings.tone),
        messages,
      });
      for await (const delta of result.textStream) {
        finalText += delta;
        send({ type: "text", delta });
      }
    }

    const activity = createCompletedActivity(Boolean(file), actionNames);
    send({ type: "meta", chatId: resolvedChatId, activity });
    const messageId = await persistResponse(
      resolvedChatId,
      user.id,
      finalText,
      accessToken,
      activity,
    );

    if (!existingChatId) {
      const title = await generateChatTitle(prompt, resolvedChatId, accessToken);
      if (title) send({ type: "title", title });
    }
    if (messageId) {
      send({ type: "done", messageId });
    } else {
      send({ type: "error", message: "The response could not be saved." });
    }
  });
}
