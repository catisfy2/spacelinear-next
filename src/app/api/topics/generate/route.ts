import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/lib/inngest/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const { topicId, title, subjectName, accessToken } = await req.json();

  if (!topicId || !title) {
    return NextResponse.json({ error: 'topicId and title are required' }, { status: 400 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'accessToken is required' }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await inngest.send({
    name: 'topic/ai.generate',
    data: { topicId, title, subjectName: subjectName ?? null },
  });

  return NextResponse.json({ queued: true }, { status: 202 });
}
