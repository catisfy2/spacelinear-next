import { inngest } from "./client";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { GenerationMode, GenerationStatus, QuestionType } from "@/types/quiz";

interface TopicInfo {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
}

interface MaterialInfo {
  id: string;
  name: string;
  content: string | null;
  type: string;
}

interface GeneratedQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  questionType: QuestionType;
  tags: string[];
  subjectName: string | null;
  topicName: string | null;
}

function parseJsonFromAi(text: string): { questions: GeneratedQuestion[] } {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, trimmed];
  const payload = JSON.parse(jsonMatch[1] ?? trimmed);
  if (Array.isArray(payload)) return { questions: payload };
  return payload;
}

async function firecrawlSearch(
  query: string,
  limit = 3,
): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return "";
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit }),
    });
    if (!response.ok) return "";
    const data = (await response.json()) as {
      data?: { title?: string; url?: string; description?: string }[];
    };
    const results = data.data ?? [];
    return results
      .map((r) => `- ${r.title ?? "Untitled"}: ${r.description ?? ""} (${r.url ?? ""})`)
      .join("\n");
  } catch {
    return "";
  }
}

async function updateStatus(
  questionSetId: string,
  status: GenerationStatus,
  error?: string,
) {
  const update: Record<string, unknown> = { generation_status: status };
  if (error) update.generation_error = error;
  const admin = getSupabaseAdmin();
  await admin.from("question_sets").update(update).eq("id", questionSetId);
}

async function buildContext(
  mode: GenerationMode,
  topicIds: string[] | undefined,
  customTopic: string | undefined,
  materialIds: string[] | undefined,
  supplementWithWeb: boolean,
): Promise<string> {
  const parts: string[] = [];
  const admin = getSupabaseAdmin();

  if (mode === "today" || mode === "topic") {
    if (topicIds && topicIds.length > 0) {
      const { data: topics } = await admin
        .from("topics")
        .select("id, title, description, subject_id")
        .in("id", topicIds);
      if (topics) {
        const { data: subjects } = await admin
          .from("subjects")
          .select("id, name");
        const subjectMap = new Map(
          (subjects ?? []).map((s) => [s.id, s.name]),
        );
        for (const topic of topics) {
          const subjectName = subjectMap.get(topic.subject_id ?? "") ?? null;
          parts.push(
            `Topic: ${topic.title}\nDescription: ${topic.description ?? "N/A"}\nSubject: ${subjectName ?? "N/A"}`,
          );
          if (supplementWithWeb) {
            const webContent = await firecrawlSearch(
              `learn ${topic.title} ${subjectName ?? ""}`,
            );
            if (webContent) {
              parts.push(`\nWeb Resources for "${topic.title}":\n${webContent}`);
            }
          }
        }
      }
    }
  }

  if (mode === "custom" && customTopic) {
    parts.push(`Topic: ${customTopic}`);
    const webContent = await firecrawlSearch(
      `learn ${customTopic} educational resources`,
      5,
    );
    if (webContent) {
      parts.push(`\nWeb Resources:\n${webContent}`);
    }
  }

  if (mode === "materials") {
    if (materialIds && materialIds.length > 0) {
      const { data: materials } = await admin
        .from("materials")
        .select("id, name, content, type")
        .in("id", materialIds);
      if (materials) {
        for (const material of materials) {
          const content = material.content ?? "";
          parts.push(
            `Material: ${material.name}\nContent:\n${content.slice(0, 4000)}`,
          );
          if (supplementWithWeb) {
            const webContent = await firecrawlSearch(
              `${material.name} educational context`,
              2,
            );
            if (webContent) {
              parts.push(`\nSupplementary:\n${webContent}`);
            }
          }
        }
      }
    }
  }

  return parts.join("\n\n---\n\n").slice(0, 15000);
}

export const generateQuizFromTopic = inngest.createFunction(
  {
    id: "generate-quiz-from-topic",
    triggers: { event: "quiz/generate" },
  },
  async ({ event, step }) => {
    const {
      questionSetId,
      mode,
      topicIds,
      customTopic,
      materialIds,
      questionCount,
      difficulty,
      supplementWithWeb,
    } = event.data as {
      questionSetId: string;
      mode: GenerationMode;
      topicIds?: string[];
      customTopic?: string;
      materialIds?: string[];
      questionCount: number;
      difficulty: string;
      supplementWithWeb: boolean;
    };

    await step.run("update-status-searching", async () => {
      await updateStatus(questionSetId, "searching");
    });

    const context = await step.run("gather-context", async () => {
      return buildContext(mode, topicIds, customTopic, materialIds, supplementWithWeb);
    });

    if (!context.trim()) {
      await step.run("update-status-error", async () => {
        await updateStatus(questionSetId, "error", "No context could be gathered");
      });
      return { error: "No context gathered" };
    }

    await step.run("update-status-generating", async () => {
      await updateStatus(questionSetId, "generating");
    });

    const generated = await step.run("generate-questions", async () => {
      const difficultyInstruction =
        difficulty === "mixed"
          ? "Mix of easy, medium, and hard questions"
          : `All questions should be ${difficulty} difficulty`;

      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `You are an educational quiz generator. Based on the following content, create ${questionCount} quiz questions with mixed types.

${difficultyInstruction}

Content:
"""
${context}
"""

Return a JSON object with a "questions" array. Each question item must have:
- "question": string - the question text
- "options": array of strings - for MCQ: exactly 4 options, for true_false: ["True", "False"], for short_answer: []
- "answer": string - the correct answer
- "explanation": string - brief explanation of the correct answer
- "difficulty": "easy" | "medium" | "hard"
- "questionType": "mcq" | "true_false" | "short_answer"
- "tags": array of 2-4 lowercase hyphenated concept tags
- "subjectName": string or null - the subject name if identifiable
- "topicName": string or null - the topic name if identifiable

Rules:
- Mix question types: about 60% MCQ, 20% true/false, 20% short answer
- For MCQ, ensure exactly 4 options and the answer must match one of them exactly
- For true/false, options must be ["True", "False"]
- For short_answer, options must be empty array []
- Make questions challenging but fair
- Each question must have a clear, correct answer

Example:
{
  "questions": [
    {
      "question": "What is the powerhouse of the cell?",
      "options": ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"],
      "answer": "Mitochondria",
      "explanation": "Mitochondria are known as the powerhouse of the cell because they generate ATP through cellular respiration.",
      "difficulty": "easy",
      "questionType": "mcq",
      "tags": ["biology", "cell-biology"],
      "subjectName": "Biology",
      "topicName": "Cell Structure"
    }
  ]
}

Return ONLY valid JSON, no other text.`,
      });

      return parseJsonFromAi(text);
    });

    const raw = (generated.questions ?? []) as GeneratedQuestion[];
    const questions = raw
      .filter(
        (q) =>
          q.question &&
          Array.isArray(q.options) &&
          (q.questionType === "short_answer" || q.options.length >= 2) &&
          q.answer,
      )
      .slice(0, questionCount);

    if (questions.length === 0) {
      await step.run("update-status-error", async () => {
        await updateStatus(questionSetId, "error", "AI did not return valid questions");
      });
      return { error: "No valid questions generated" };
    }

    await step.run("insert-questions", async () => {
      const rows = questions.map((q, idx) => ({
        question_set_id: questionSetId,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation ?? null,
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty)
          ? q.difficulty
          : "medium",
        question_type: q.questionType ?? "mcq",
        tags: q.tags ?? [],
        subject_name: q.subjectName ?? null,
        topic_name: q.topicName ?? null,
        order: idx,
      }));

      const { error } = await getSupabaseAdmin()
        .from("questions")
        .insert(rows);
      if (error) throw error;
    });

    await step.run("update-question-set-count", async () => {
      const admin = getSupabaseAdmin();
      await admin
        .from("question_sets")
        .update({
          question_count: questions.length,
          generation_status: "complete",
        })
        .eq("id", questionSetId);
    });

    return { questionSetId, count: questions.length };
  },
);
