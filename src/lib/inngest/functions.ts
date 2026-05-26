import { inngest } from './client';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { getSupabaseAdmin } from '@/lib/supabase-server';

interface GeneratedQuiz {
  question: string;
  options: string[];
  answer: string;
  tags: string[];
  subject?: string;
  topic?: string;
}

interface SubjectTopicCatalog {
  subjects: { id: string; name: string }[];
  topics: { id: string; title: string; subjectName: string | null }[];
}

function parseJsonFromAi(text: string): { quizzes: GeneratedQuiz[] } {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [
    null,
    trimmed,
  ];
  const payload = JSON.parse(jsonMatch[1] ?? trimmed) as
    | { quizzes: GeneratedQuiz[] }
    | GeneratedQuiz[];

  if (Array.isArray(payload)) {
    return { quizzes: payload };
  }

  return payload;
}

async function getMaterialContent(materialId: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data: material, error } = await admin
    .from('materials')
    .select('*')
    .eq('id', materialId)
    .single();

  if (error || !material) {
    throw new Error(`Material not found: ${materialId}`);
  }

  if (material.type === 'text' && material.content) {
    return material.content.slice(0, 8000);
  }

  if (material.type === 'link') {
    return `Link title: ${material.name}\nURL: ${material.url ?? 'unknown'}`;
  }

  if (material.type === 'file' && material.storage_path) {
    const { data: blob, error: downloadError } = await admin.storage
      .from('materials')
      .download(material.storage_path);

    if (downloadError || !blob) {
      return `File: ${material.name} (${material.mime_type ?? 'unknown type'})`;
    }

    const mime = material.mime_type ?? '';
    const isTextLike =
      mime.startsWith('text/') ||
      mime === 'application/json' ||
      material.name.endsWith('.md') ||
      material.name.endsWith('.txt');

    if (isTextLike) {
      const text = await blob.text();
      return text.slice(0, 8000);
    }

    return `File: ${material.name} (${material.mime_type ?? 'unknown type'})`;
  }

  return material.name;
}

function matchToExisting(
  value: string | undefined,
  options: string[],
): string | null {
  if (!value?.trim() || options.length === 0) return null;

  const normalized = value.trim().toLowerCase();
  const exact = options.find((option) => option.toLowerCase() === normalized);
  if (exact) return exact;

  const partial = options.find(
    (option) =>
      option.toLowerCase().includes(normalized) ||
      normalized.includes(option.toLowerCase()),
  );
  return partial ?? null;
}

function buildSubjectTopicPrompt(catalog: SubjectTopicCatalog): string {
  if (catalog.subjects.length === 0) {
    return `No predefined subjects or topics exist for this user. Infer appropriate subject and topic names for each question.`;
  }

  const grouped = catalog.subjects
    .map((subject) => {
      const subjectTopics = catalog.topics
        .filter((topic) => topic.subjectName === subject.name)
        .map((topic) => topic.title);

      if (subjectTopics.length === 0) {
        return `- ${subject.name}`;
      }

      return `- ${subject.name}\n  ${subjectTopics.map((topic) => `- ${topic}`).join('\n  ')}`;
    })
    .join('\n');

  return `Use ONLY these existing subject and topic names (copy them exactly):
${grouped}

For each quiz question, pick the closest matching subject and topic from the list above. Do not invent new subject or topic names.`;
}

function resolveQuizSubjectTopic(
  quiz: GeneratedQuiz,
  catalog: SubjectTopicCatalog,
): { subject: string | null; topic: string | null } {
  if (catalog.subjects.length === 0) {
    return {
      subject: quiz.subject?.trim() || null,
      topic: quiz.topic?.trim() || null,
    };
  }

  const subjectNames = catalog.subjects.map((subject) => subject.name);
  let subject = matchToExisting(quiz.subject, subjectNames);

  const topicsForSubject = subject
    ? catalog.topics
        .filter((topic) => topic.subjectName === subject)
        .map((topic) => topic.title)
    : catalog.topics.map((topic) => topic.title);

  let topic = matchToExisting(quiz.topic, topicsForSubject);

  if (topic && !subject) {
    const matchedTopic = catalog.topics.find((item) => item.title === topic);
    subject = matchedTopic?.subjectName ?? null;
  }

  if (!subject && subjectNames.length === 1) {
    subject = subjectNames[0];
  }

  const resolvedTopicsForSubject = subject
    ? catalog.topics
        .filter((topic) => topic.subjectName === subject)
        .map((topic) => topic.title)
    : catalog.topics.map((topic) => topic.title);

  if (subject && !topic && resolvedTopicsForSubject.length === 1) {
    topic = resolvedTopicsForSubject[0];
  }

  return { subject, topic };
}

export const generateTopicContent = inngest.createFunction(
  {
    id: 'generate-topic-content',
    triggers: { event: 'topic/ai.generate' },
  },
  async ({ event, step }) => {
    const { topicId, title, subjectName } = event.data;

    const result = await step.run('generate-ai-content', async () => {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: `Generate learning content for a topic titled "${title}"${subjectName ? ` under the subject "${subjectName}"` : ''}.

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

      return JSON.parse(text) as { description: string; tags: string[] };
    });

    await step.run('update-topic', async () => {
      await getSupabaseAdmin()
        .from('topics')
        .update({
          description: result.description,
          tags: result.tags,
        })
        .eq('id', topicId);
    });

    return { topicId, description: result.description, tags: result.tags };
  },
);

export const generateQuizFromMaterial = inngest.createFunction(
  {
    id: 'generate-quiz-from-material',
    triggers: { event: 'material/quiz.generate' },
  },
  async ({ event, step }) => {
    const { materialId, materialName, userId, subjectTopicCatalog } =
      event.data as {
        materialId: string;
        materialName: string;
        userId: string;
        subjectTopicCatalog?: SubjectTopicCatalog;
      };

    const catalog: SubjectTopicCatalog = subjectTopicCatalog ?? {
      subjects: [],
      topics: [],
    };

    const materialContent = await step.run('fetch-material-content', async () =>
      getMaterialContent(materialId),
    );

    const subjectTopicInstructions = buildSubjectTopicPrompt(catalog);

    const generated = await step.run('generate-quiz-questions', async () => {
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: `You are an educational quiz generator. Based on the following study material, create 10-15 multiple-choice quiz questions.

Material title: "${materialName}"
Material content:
"""
${materialContent}
"""

${subjectTopicInstructions}

Return a JSON object with a "quizzes" array. Each quiz item must have:
- "question": string
- "options": array of exactly 4 answer strings
- "answer": the correct option string (must exactly match one of the options)
- "tags": array of 2-4 lowercase hyphenated concept tags related to the question
- "subject": subject name string
- "topic": topic name string

Example:
{
  "quizzes": [
    {
      "question": "What is Newton's second law?",
      "options": ["F = ma", "E = mc^2", "V = IR", "P = IV"],
      "answer": "F = ma",
      "tags": ["physics", "newton-laws", "force"],
      "subject": "Physics",
      "topic": "Mechanics"
    }
  ]
}

Return ONLY valid JSON, no other text.`,
      });

      return parseJsonFromAi(text);
    });

    const quizzes = generated.quizzes
      .filter(
        (quiz) =>
          quiz.question &&
          Array.isArray(quiz.options) &&
          quiz.options.length === 4 &&
          quiz.answer &&
          quiz.options.includes(quiz.answer),
      )
      .slice(0, 15);

    if (quizzes.length === 0) {
      throw new Error('AI did not return valid quiz questions');
    }

    await step.run('insert-quizzes', async () => {
      const rows = quizzes.map((quiz) => {
        const { subject, topic } = resolveQuizSubjectTopic(quiz, catalog);

        return {
          question: quiz.question,
          options: quiz.options,
          answer: quiz.answer,
          tags: quiz.tags ?? [],
          subject,
          topic,
          material_id: materialId,
          created_by: userId,
        };
      });

      const { error } = await getSupabaseAdmin().from('quizzes').insert(rows);
      if (error) throw error;
    });

    return { materialId, count: quizzes.length };
  },
);
