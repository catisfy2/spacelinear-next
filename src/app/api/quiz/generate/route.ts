import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/lib/inngest/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const { materialId, materialName, accessToken } = await req.json();

  if (!materialId || !materialName) {
    return NextResponse.json(
      { error: 'materialId and materialName are required' },
      { status: 400 },
    );
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'accessToken is required' }, { status: 401 });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: material, error: materialError } = await authClient
    .from('materials')
    .select('id, name, user_id')
    .eq('id', materialId)
    .single();

  if (materialError || !material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  }

  const [{ data: subjects }, { data: topics }] = await Promise.all([
    authClient.from('subjects').select('id, name').eq('user_id', user.id),
    authClient.from('topics').select('id, title, subject_id').eq('user_id', user.id),
  ]);

  const subjectNameById = new Map(
    (subjects ?? []).map((subject) => [subject.id, subject.name]),
  );

  const subjectTopicCatalog = {
    subjects: (subjects ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
    })),
    topics: (topics ?? []).map((topic) => ({
      id: topic.id,
      title: topic.title,
      subjectName: subjectNameById.get(topic.subject_id ?? '') ?? null,
    })),
  };

  await inngest.send({
    name: 'material/quiz.generate',
    data: {
      materialId,
      materialName: materialName ?? material.name,
      userId: user.id,
      subjectTopicCatalog,
    },
  });

  return NextResponse.json({ queued: true }, { status: 202 });
}
