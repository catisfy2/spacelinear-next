import { NextRequest, NextResponse } from "next/server";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const systemPrompt = `You are a friendly, encouraging study buddy helping a student who is in a focused study session.

Your role:
- Help them understand concepts they're stuck on
- Give concise, clear explanations with examples
- Encourage them to keep going
- Be warm and supportive
- Keep responses relatively brief (2-4 paragraphs max) so they can get back to studying

The context of the conversation so far:
${context || "No prior context."}`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: message,
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Study mode chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
