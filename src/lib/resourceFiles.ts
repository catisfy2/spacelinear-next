export const TOPIC_RESOURCE_BUCKET = 'topic-resources';

export const ACCEPTED_RESOURCE_EXTENSIONS = ['png', 'pdf', 'pptx'] as const;

export const ACCEPTED_RESOURCE_MIME_TYPES = [
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

export const MAX_RESOURCE_FILE_BYTES = 20 * 1024 * 1024;

export interface ResourceFileMeta {
  mimeType: string;
  fileName: string;
  storagePath: string;
}

export function getResourceFileExtension(fileName: string): string | null {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? null;
}

export function inferResourceMimeType(file: File): string {
  if (file.type) return file.type;

  const extension = getResourceFileExtension(file.name);
  if (extension === 'png') return 'image/png';
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'pptx') {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }

  return file.type;
}

export function isAcceptedResourceFile(file: File): boolean {
  const mimeType = inferResourceMimeType(file);
  const extension = getResourceFileExtension(file.name);

  return (
    ACCEPTED_RESOURCE_MIME_TYPES.includes(
      mimeType as (typeof ACCEPTED_RESOURCE_MIME_TYPES)[number],
    ) ||
    (extension !== null &&
      ACCEPTED_RESOURCE_EXTENSIONS.includes(
        extension as (typeof ACCEPTED_RESOURCE_EXTENSIONS)[number],
      ))
  );
}

export function validateResourceFile(file: File): void {
  if (!isAcceptedResourceFile(file)) {
    throw new Error('Only PNG, PDF, and PPTX files are supported.');
  }

  if (file.size > MAX_RESOURCE_FILE_BYTES) {
    throw new Error('Files must be 20 MB or smaller.');
  }
}

export function parseResourceFileMeta(content?: string): ResourceFileMeta | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Partial<ResourceFileMeta>;
    if (parsed.mimeType && parsed.fileName && parsed.storagePath) {
      return {
        mimeType: parsed.mimeType,
        fileName: parsed.fileName,
        storagePath: parsed.storagePath,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeResourceFileMeta(meta: ResourceFileMeta): string {
  return JSON.stringify(meta);
}

export function getResourceNodeSize(mimeType: string): { width: number; height: number } {
  if (mimeType === 'image/png') {
    return { width: 420, height: 320 };
  }
  if (mimeType === 'application/pdf') {
    return { width: 400, height: 480 };
  }
  return { width: 320, height: 200 };
}

export function buildStoragePath(userId: string, topicId: string, fileName: string): string {
  const extension = getResourceFileExtension(fileName) ?? 'bin';
  return `${userId}/${topicId}/${crypto.randomUUID()}.${extension}`;
}
