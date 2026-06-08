import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import {
  parseActionBlocks,
  stripActionBlocks,
  createActionExecutor,
} from "@/lib/agent-tools";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { conversationId, messages, accessToken } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    // ── Agent-capable system prompt ──────────────────────────────────────
    const systemPrompt = `You are SpaceLinear, an intelligent AI study assistant that helps students learn effectively. You have the ability to CREATE and DELETE things in the user's study space — subjects, topics, notes, study materials, and quiz sets.

## Your Capabilities

1. **Answer questions** — explain concepts, provide examples, help with understanding
2. **Create subjects** — organize study areas (e.g., "Machine Learning", "Physics")
3. **Create topics** under subjects for spaced-repetition studying
4. **Create study notes** — save rich text content the user can reference later
5. **Create study materials** — save reference documents and cheat sheets
6. **Create quiz sets** — generate full quiz question sets that appear in the Question Sets section
7. **Create quiz questions** — generate individual multiple-choice practice questions
8. **Delete subjects, topics, notes, materials, and quiz sets** — remove items the user no longer needs

## Uploaded Study Materials

When the user says they've uploaded a study material, they have attached a file (PDF, document, image, etc.) that has been saved as a study material in their account. The material name will be mentioned in their message.

- **Always respond by creating a quiz set** based on the uploaded material. Generate 5-10 relevant multiple-choice questions that test understanding of the material's content.

## How to Take Actions

If the user asks you to create, make, add, or generate something, you MUST include a special action block at the END of your response after any explanatory text:

\`\`\`
[ACTION]
{
  "action": "createSubject",
  "params": { "name": "Machine Learning", "description": "..." }
}
[/ACTION]
\`\`\`

Available actions and their parameters:

- \`createSubject\`: { "name": string, "description"?: string, "color"?: string, "icon"?: string }
- \`createTopic\`: { "title": string, "subjectName": string, "description"?: string, "notes"?: string, "tags"?: string[] }
- \`createNote\`: { "title": string, "content": string, "tags"?: string[] }
- \`createMaterial\`: { "name": string, "content": string }
- \`createQuizSet\`: { "title": string, "questions": [{ "question": string, "options": [4 strings], "answer": string, "explanation"?: string, "difficulty"?: string }], "timeLimit"?: number (minutes), "topicName"?: string, "difficulty"?: string }
- \`createQuizQuestions\`: { "questions": [{ "question": string, "options": [4 strings], "answer": string, "subject"?: string, "topic"?: string, "tags"?: string[] }] }
- \`deleteSubject\`: { "name": string }
- \`deleteTopic\`: { "title": string, "subjectName"?: string }
- \`deleteNote\`: { "title": string }
- \`deleteMaterial\`: { "name": string }
- \`deleteQuizSet\`: { "title": string }

IMPORTANT RULES:
- Always put the action block at the VERY END of your response.
- When the user asks to create a quiz with a specific number of questions and time limit, use \`createQuizSet\`. This is the PRIMARY action for creating quizzes — it creates a full question set that appears in the Quiz Sets section.
- For \`createQuizSet\`, generate the actual questions yourself based on the topic. Use the exact number of questions the user requests. Include 4 options per question and mark the correct answer. Optionally provide an explanation and difficulty level for each question.
- If the user specifies a time limit (e.g., "10 minutes"), pass it as \`timeLimit\` (in minutes).
- If the user mentions a topic (e.g., "on xyz"), pass it as \`topicName\`. The system will link the quiz set to that topic.
- Use \`createQuizQuestions\` only for creating standalone practice questions outside of a quiz set.
- When creating a subject or topic, tell the user what you're creating.
- After creating something, tell the user what was created and give a helpful summary.
- If the user doesn't specify details (like subject name), ask them what they want.
- When asked to delete something, use the appropriate delete action. Always confirm with the user before deleting, then execute the deletion.
- After deleting something, tell the user what was removed.
- Be concise, clear, and encouraging. Use examples and analogies when helpful.`;

    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Save the user message if we have a conversation
    if (conversationId && accessToken) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });

      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg?.role === "user") {
        await authClient.from("messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: lastUserMsg.content,
        });
      }
    }

    // Stream the response from Groq
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      messages: groqMessages,
      onFinish: async ({ text }) => {
        if (!conversationId || !accessToken || !text) return;

        try {
          // 1. Parse action blocks
          const actionBlocks = parseActionBlocks(text);
          const cleanText = stripActionBlocks(text);
          let savedText = cleanText;

          // 2. Execute actions
          if (actionBlocks.length > 0) {
            const executor = createActionExecutor(accessToken);
            const actionResults: string[] = [];

            for (const block of actionBlocks) {
              const result = await executor.execute(block);
              if (result.success) {
                actionResults.push(result.message);
              } else {
                console.error(
                  `Action failed: ${result.action} — ${result.message}`,
                );
              }
            }

            // 3. Prepend action confirmations if not already in the text
            if (actionResults.length > 0) {
              const confirmations = actionResults
                .map((m) => `✅ ${m}`)
                .join("\n");
              if (!cleanText.includes(actionResults[0]!.slice(0, 30))) {
                savedText = `${confirmations}\n\n${cleanText}`;
              }
            }
          }

          // 4. Save to database
          const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
          });

          await authClient.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: savedText,
          });

          // 5. Auto-title from the first user message
          const firstUserMsg = messages.find(
            (m: { role: string }) => m.role === "user",
          );
          if (firstUserMsg) {
            const { data: msgCount } = await authClient
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId);

            if (msgCount && msgCount.length <= 2) {
              const title =
                firstUserMsg.content.slice(0, 60) +
                (firstUserMsg.content.length > 60 ? "..." : "");
              await authClient
                .from("conversations")
                .update({ title, updated_at: new Date().toISOString() })
                .eq("id", conversationId);
            }
          }
        } catch (err) {
          console.error("Failed to process assistant response:", err);
          // Fallback: save raw text if processing fails
          try {
            const authClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: { headers: { Authorization: `Bearer ${accessToken}` } },
            });
            await authClient.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: stripActionBlocks(text),
            });
          } catch {
            // Ignore fallback save errors
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
