import { createClient } from '@supabase/supabase-js';
import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import {
  buildQuizContext,
  normalizeQuizQuestions,
  quizGenerationSchema,
} from '@/lib/quiz';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const maxDuration = 60;

export async function POST(req: Request) {
  const { topicId, accessToken } = (await req.json()) as {
    topicId?: string;
    accessToken?: string;
  };

  if (!accessToken) {
    return Response.json({ error: 'accessToken is required' }, { status: 401 });
  }

  if (!topicId) {
    return Response.json({ error: 'topicId is required' }, { status: 400 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: topic, error: topicError } = await authClient
    .from('topics')
    .select('id, title, description, notes, user_id')
    .eq('id', topicId)
    .eq('user_id', user.id)
    .single();

  if (topicError || !topic) {
    return Response.json({ error: 'Topic not found' }, { status: 404 });
  }

  const { data: resources } = await authClient
    .from('resources')
    .select('id, title, type, url, content')
    .eq('entity_id', topicId)
    .eq('entity_type', 'topic')
    .eq('user_id', user.id);

  const hasNotes = Boolean(topic.notes?.trim());
  const hasResources = (resources ?? []).length > 0;

  if (!hasNotes && !hasResources) {
    return Response.json(
      { error: 'Topic has no notes or resources to generate a quiz from' },
      { status: 400 },
    );
  }

  const context = buildQuizContext(topic, resources ?? []);

  try {
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: quizGenerationSchema,
      prompt: `You are a study quiz generator for spaced repetition review.

Generate 3 to 5 multiple-choice questions that test recall and understanding of the material below.
Rules:
- Base every question ONLY on the provided topic content (notes, description, resources).
- Each question must have exactly 4 answer options.
- Exactly one option must be correct (correctIndex is 0-based).
- Vary difficulty: include recall, application, and conceptual questions.
- Use clear, concise wording. Avoid trick questions.
- Assign stable string ids like "q1", "q2", etc.

Material:
${context}`,
    });

    const questions = normalizeQuizQuestions(object.questions);

    if (questions.length < 3) {
      return Response.json(
        { error: 'Failed to generate enough valid quiz questions' },
        { status: 500 },
      );
    }

    return Response.json({ questions });
  } catch (error) {
    console.error('[quiz/generate]', error);
    return Response.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
