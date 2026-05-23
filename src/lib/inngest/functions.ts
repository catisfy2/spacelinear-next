import { inngest } from './client';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { getSupabaseAdmin } from '@/lib/supabase-server';

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
  }
);
