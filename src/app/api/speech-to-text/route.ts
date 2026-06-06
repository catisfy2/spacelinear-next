import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob | null;

    if (!audio) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 },
      );
    }

    // Determine the correct file extension from the blob type
    const ext = audio.type === "audio/webm" ? "webm" : "mp4";

    // Forward the audio to Groq's Whisper endpoint
    const groqForm = new FormData();
    groqForm.append("file", audio, `recording.${ext}`);
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("response_format", "json");

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: groqForm,
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq Whisper API error:", res.status, err);
      return NextResponse.json(
        { error: `Transcription failed: ${res.status} — ${err.slice(0, 200)}` },
        { status: 500 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("Speech-to-text error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
