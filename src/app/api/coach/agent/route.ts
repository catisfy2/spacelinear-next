import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { groq } from '@ai-sdk/groq';
import {
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import type { CoachContextPayload } from '@/lib/coach/context';
import { buildCoachSystemPrompt } from '@/lib/coach/system-prompt';
import { INITIAL_EASE } from '@/lib/algorithm';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const maxDuration = 60;

async function fetchUserSubjects(
  authClient: SupabaseClient,
  userId: string,
) {
  const { data } = await authClient
    .from('subjects')
    .select('id, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return data ?? [];
}

async function resolveSubjectId(
  authClient: SupabaseClient,
  userId: string,
  options: { subjectId?: string; subjectName?: string },
): Promise<string> {
  const subjects = await fetchUserSubjects(authClient, userId);

  if (options.subjectId && UUID_REGEX.test(options.subjectId)) {
    const byId = subjects.find((s) => s.id === options.subjectId);
    if (byId) return byId.id;
  }

  if (options.subjectName) {
    const normalized = options.subjectName.trim().toLowerCase();
    const byName = subjects.find(
      (s) => s.name.trim().toLowerCase() === normalized,
    );
    if (byName) return byName.id;
  }

  const available =
    subjects.map((s) => `"${s.name}" (${s.id})`).join(', ') ||
    'none — create a subject first';

  throw new Error(
    `Subject not found. Pass subjectName (exact title) or a valid subjectId from listSubjects/createSubject. Available: ${available}`,
  );
}

export async function POST(req: Request) {
  const {
    messages,
    accessToken,
    triggerType = 'STANDARD',
    activeTopicId,
    consecutiveRelearnCount,
  } = (await req.json()) as {
    messages: UIMessage[];
    accessToken?: string;
    triggerType?: CoachContextPayload['triggerType'];
    activeTopicId?: string;
    consecutiveRelearnCount?: number;
  };

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'accessToken is required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existingSubjects = await fetchUserSubjects(authClient, user.id);

  const resolvedTriggerType =
    existingSubjects.length === 0 && triggerType === 'STANDARD'
      ? 'ONBOARDING'
      : triggerType;

  const coachContext: CoachContextPayload = {
    triggerType: resolvedTriggerType,
    activeTopicId,
    consecutiveRelearnCount,
  };

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: buildCoachSystemPrompt(existingSubjects, coachContext),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
    tools: {
      listSubjects: tool({
        description:
          "List the user's current subjects with exact IDs. Call before createTopic when unsure which subject to use.",
        inputSchema: z.object({}),
        execute: async () => {
          const subjects = await fetchUserSubjects(authClient, user.id);
          return { subjects };
        },
      }),
      createSubject: tool({
        description:
          'Create a new subject bucket for grouping notes and flashcards. Returns subjectId and name.',
        inputSchema: z.object({
          name: z.string().describe('The title of the domain (e.g., "Algorithm Design")'),
          description: z.string().optional().describe('Contextual scope for the subject'),
        }),
        execute: async ({ name, description }) => {
          const { data, error } = await authClient
            .from('subjects')
            .insert({
              name,
              description: description ?? null,
              color: '#6366f1',
              icon: '📘',
              user_id: user.id,
            })
            .select('id, name')
            .single();

          if (error || !data) {
            throw new Error(error?.message ?? 'Failed to create subject');
          }

          return { subjectId: data.id, name: data.name };
        },
      }),
      createTopic: tool({
        description:
          'Create a topic under a subject. Pass subjectName (exact title). Topic appears in Today queue immediately.',
        inputSchema: z.object({
          subjectName: z
            .string()
            .describe('Exact name of the parent subject — preferred over subjectId'),
          title: z.string().describe('The specific flashcard/note item title'),
          description: z.string().describe('High-level breakdown summary'),
          content: z
            .string()
            .optional()
            .describe('Optional baseline markdown structure for notes'),
          subjectId: z
            .string()
            .optional()
            .describe('Only if copied verbatim from listSubjects or createSubject'),
        }),
        execute: async ({ subjectName, subjectId, title, description, content }) => {
          const resolvedSubjectId = await resolveSubjectId(authClient, user.id, {
            subjectName,
            subjectId,
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const { data, error } = await authClient
            .from('topics')
            .insert({
              title,
              description,
              notes: content ?? null,
              subject_id: resolvedSubjectId,
              tags: ['ai-scaffolded'],
              state: 'new',
              next_review_date: today.toISOString(),
              current_interval_days: 0,
              ease_factor: INITIAL_EASE,
              total_reviews: 0,
              correct_reviews: 0,
              streak: 0,
              user_id: user.id,
            })
            .select('id, title, subject_id')
            .single();

          if (error || !data) {
            throw new Error(error?.message ?? 'Failed to create topic');
          }

          return {
            topicId: data.id,
            title: data.title,
            subjectId: data.subject_id,
          };
        },
      }),
    },
    onError: ({ error }) => {
      console.error('[coach/agent]', error);
    },
  });

  return result.toUIMessageStreamResponse();
}
