import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

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

    const systemPrompt = `You are a helpful AI study assistant. You help students learn, understand concepts, create study plans, and answer questions about their study materials. Be concise, clear, and encouraging. Use examples and analogies when helpful.`;

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
        // Save assistant message to DB after streaming completes
        if (conversationId && accessToken && text) {
          try {
            const authClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: {
                headers: { Authorization: `Bearer ${accessToken}` },
              },
            });

            await authClient.from("messages").insert({
              conversation_id: conversationId,
              role: "assistant",
              content: text,
            });

            // Auto-title from the first user message
            const firstUserMsg = messages.find(
              (m: { role: string }) => m.role === "user",
            );
            if (firstUserMsg) {
              const { data: msgCount } = await authClient
                .from("messages")
                .select("id", { count: "exact", head: true })
                .eq("conversation_id", conversationId);

              // If only 2 messages (user + assistant), it's the first exchange
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
            console.error("Failed to save assistant message:", err);
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
