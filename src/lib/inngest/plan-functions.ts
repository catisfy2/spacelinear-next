import { inngest } from "./client";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { convertBufferToMarkdown } from "@/lib/markitdown";
import { upsertStudyContent, searchStudyContent, NAMESPACES } from "@/lib/pinecone";
import type { StudyPlanData, StudyPlanSubject, StudyPlanTopic } from "@/lib/types";

interface PlanEventData {
  planId: string;
  userId: string;
  prompt: string;
  description: string;
  materialIds: string[];
}

interface FirecrawlSearchResult {
  title: string;
  url: string;
  description: string;
}

async function searchResources(query: string): Promise<FirecrawlSearchResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `best resources to learn ${query}`,
        limit: 3,
      }),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      data?: Array<{ title?: string; url?: string; description?: string }>;
    };

    return (data.data ?? []).map((item) => ({
      title: item.title ?? "Untitled",
      url: item.url ?? "",
      description: item.description ?? "",
    }));
  } catch {
    return [];
  }
}

async function extractFileContents(materialIds: string[]): Promise<string> {
  if (materialIds.length === 0) return "";

  const admin = getSupabaseAdmin();
  const contents: string[] = [];

  for (const materialId of materialIds) {
    try {
      const { data: material, error } = await admin
        .from("materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (error || !material) continue;

      if (material.type === "text" && material.content) {
        contents.push(material.content.slice(0, 8000));
      } else if (material.type === "link") {
        contents.push(`Link: ${material.name}\nURL: ${material.url ?? "unknown"}`);
      } else if (material.type === "file" && material.storage_path) {
        const { data: blob, error: downloadError } = await admin.storage
          .from("materials")
          .download(material.storage_path);

        if (downloadError || !blob) continue;

        const buffer = Buffer.from(await blob.arrayBuffer());
        const filename = material.name;
        const mime = material.mime_type ?? "";

        const isTextLike =
          mime.startsWith("text/") ||
          mime === "application/json" ||
          filename.endsWith(".md") ||
          filename.endsWith(".txt");

        if (isTextLike) {
          const text = buffer.toString("utf-8");
          contents.push(text.slice(0, 8000));
        } else if (
          filename.endsWith(".pdf") ||
          filename.endsWith(".docx") ||
          filename.endsWith(".pptx") ||
          filename.endsWith(".xlsx")
        ) {
          try {
            const markdown = await convertBufferToMarkdown(buffer, filename);
            contents.push(markdown.slice(0, 8000));
          } catch {
            contents.push(`[Unprocessable file: ${filename}]`);
          }
        } else {
          contents.push(`[File: ${filename} (${mime})]`);
        }
      }
    } catch {
      // skip failed materials
    }
  }

  return contents.join("\n\n---\n\n");
}

export const generateStudyPlan = inngest.createFunction(
  {
    id: "generate-study-plan",
    triggers: { event: "plan/generate" },
  },
  async ({ event, step }) => {
    const { planId, userId, prompt, description, materialIds } = event.data as PlanEventData;

    const fileContents = await step.run("extract-file-contents", async () => {
      return await extractFileContents(materialIds);
    });

    const topicStructure = await step.run("analyze-with-llm", async () => {
      const syllabusContext = fileContents
        ? `\n\nUploaded syllabus content:\n"""\n${fileContents}\n"""`
        : "";

      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `You are an expert curriculum designer creating a structured study plan.

IMPORTANT: The user's goal is an instruction you must follow precisely. If the user specifies a specific number of topics or subjects, create exactly that number. If the user asks to add topics to an existing subject, create only that subject. Do not override the user's explicit constraints. If the user gives a general goal without specifics, then freely determine subjects and topics.

User's instruction: "${prompt}"
Additional context: "${description}"${syllabusContext}

Return a JSON object with a "subjects" array. Each subject has:
- "name": subject name
- "description": brief description
- "topics": array of topic objects with:
  - "title": topic name
  - "description": 1-2 sentence explanation
  - "difficulty": "beginner", "intermediate", or "advanced"
  - "estimated_minutes": estimated study time in minutes (target 30, range 20-40)
  - "prerequisites": array of prerequisite topic titles (can be empty)
  - "order": number indicating learning sequence (1, 2, 3...)
  - "searchQuery": a concise search query to find best resources for this topic

Follow the atomic topic principle: every topic must be self-contained and completable within 20-40 minutes. If a concept is too large, split it into multiple smaller topics. Prerequisites should form a logical learning path, and topics should not depend on topics more than 1-2 steps ahead.

Generate however many topics and subjects are needed to cover the goal comprehensively, unless the user explicitly specifies otherwise.
Keep searchQuery concrete and specific (e.g., "calculus limits and continuity khan academy" not "math resources").

Return ONLY valid JSON, no other text.`,
      });

      const jsonMatch = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
      const payload = JSON.parse(jsonMatch[1] ?? text) as StudyPlanData;

      return payload;
    });

    const enrichedSubjects = await step.run("search-web-resources", async () => {
      const enriched: StudyPlanSubject[] = [];

      for (const subject of topicStructure.subjects) {
        const enrichedTopics: StudyPlanTopic[] = [];

        for (const topic of subject.topics) {
          const resources: FirecrawlSearchResult[] = await searchResources(
            topic.searchQuery ?? `${subject.name} ${topic.title}`
          );

          enrichedTopics.push({
            title: topic.title,
            description: topic.description,
            difficulty: topic.difficulty,
            estimated_minutes: topic.estimated_minutes,
            prerequisites: topic.prerequisites,
            order: topic.order,
            resources: resources.map((r) => ({
              title: r.title,
              url: r.url,
              type: inferResourceType(r.url, r.title),
              description: r.description,
            })),
          });
        }

        enriched.push({
          name: subject.name,
          description: subject.description,
          topics: enrichedTopics,
        });
      }

      return enriched;
    });

    await step.run("search-existing-content", async () => {
      try {
        const similarContent = await searchStudyContent(prompt, { userId });
        return similarContent;
      } catch {
        return [];
      }
    });

    await step.run("assemble-final-plan", async () => {
      const planTitle = prompt.length > 80 ? prompt.slice(0, 80) + "..." : prompt;

      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `Create a concise, engaging title and summary for this study plan.

Plan goal: "${prompt}"
Subjects: ${enrichedSubjects.map((s) => s.name).join(", ")}

Return a JSON object:
{
  "title": "A short compelling title (max 80 chars)",
  "summary": "A 2-3 sentence overview of the plan"
}

Return ONLY valid JSON, no other text.`,
      });

      const jsonMatch = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
      const meta = JSON.parse(jsonMatch[1] ?? text) as { title: string; summary: string };

      const planData: StudyPlanData = {
        subjects: enrichedSubjects as StudyPlanSubject[],
      };

      await (getSupabaseAdmin() as any)
        .from("study_plans")
        .update({
          title: meta.title,
          plan_data: planData,
          status: "review",
        })
        .eq("id", planId);

      try {
        const contentText = enrichedSubjects
          .flatMap((s) => s.topics)
          .map((t) => `${t.title}: ${t.description}`)
          .join("\n");

        await upsertStudyContent([
          {
            id: `plan-${planId}`,
            text: contentText,
            metadata: {
              type: "plan",
              userId,
              title: meta.title,
              text: contentText,
              sourceId: planId,
              tags: enrichedSubjects.map((s) => s.name.toLowerCase()),
              createdAt: new Date().toISOString(),
            },
          },
        ]);
      } catch {
        // Pinecone upsert is non-critical
      }
    });

    return { planId };
  }
);

function inferResourceType(
  url: string,
  title: string
): "video" | "article" | "course" | "book" | "other" {
  const lower = `${url} ${title}`.toLowerCase();

  if (
    lower.includes("youtube") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo") ||
    lower.includes("video")
  ) {
    return "video";
  }

  if (
    lower.includes("coursera") ||
    lower.includes("udemy") ||
    lower.includes("edx") ||
    lower.includes("khanacademy") ||
    lower.includes("course") ||
    lower.includes("class")
  ) {
    return "course";
  }

  if (
    lower.includes("book") ||
    lower.includes("amazon") ||
    lower.includes("oreilly") ||
    lower.includes("pdf")
  ) {
    return "book";
  }

  if (
    lower.includes("blog") ||
    lower.includes("article") ||
    lower.includes("medium") ||
    lower.includes("wiki") ||
    lower.includes("documentation") ||
    lower.includes("guide") ||
    lower.includes("tutorial")
  ) {
    return "article";
  }

  return "other";
}
