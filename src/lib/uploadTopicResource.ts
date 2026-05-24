import { supabase } from '@/integrations/supabase/client';
import type { Resource } from '@/lib/types';
import {
  buildStoragePath,
  inferResourceMimeType,
  parseResourceFileMeta,
  serializeResourceFileMeta,
  TOPIC_RESOURCE_BUCKET,
  validateResourceFile,
} from '@/lib/resourceFiles';

export async function uploadTopicResourceFile(
  file: File,
  topicId: string,
  userId: string,
): Promise<Omit<Resource, 'id' | 'createdAt'>> {
  validateResourceFile(file);

  const mimeType = inferResourceMimeType(file);
  const storagePath = buildStoragePath(userId, topicId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(TOPIC_RESOURCE_BUCKET)
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(TOPIC_RESOURCE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    entityId: topicId,
    entityType: 'topic',
    type: 'file',
    title: file.name.replace(/\.[^.]+$/, '') || file.name,
    url: publicUrlData.publicUrl,
    content: serializeResourceFileMeta({
      mimeType,
      fileName: file.name,
      storagePath,
    }),
  };
}

export async function deleteTopicResourceFile(content?: string): Promise<void> {
  const meta = parseResourceFileMeta(content);
  if (!meta) return;

  await supabase.storage.from(TOPIC_RESOURCE_BUCKET).remove([meta.storagePath]);
}
