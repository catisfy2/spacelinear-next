import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (pineconeClient) return pineconeClient;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing PINECONE_API_KEY. Add it to .env.local"
    );
  }

  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
}

export function getPineconeIndexName(): string {
  return process.env.PINECONE_INDEX_NAME ?? "spacelinear-study";
}

export const NAMESPACES = {
  STUDY_PLANS: "study-plans",
  MATERIALS: "materials",
  NOTES: "notes",
  TOPICS: "topics",
  RESOURCES: "resources",
} as const;

export interface StudyMetadata {
  type: "plan" | "material" | "note" | "topic" | "resource";
  userId: string;
  title: string;
  text: string;
  sourceId: string;
  tags: string[];
  subject?: string;
  createdAt: string;
}

export async function upsertStudyContent(
  records: {
    id: string;
    text: string;
    metadata: StudyMetadata;
  }[]
): Promise<void> {
  const pc = getPineconeClient();
  const indexName = getPineconeIndexName();

  try {
    const index = pc.index(indexName);
    await index.upsertRecords({
      records: records.map((r) => ({
        id: r.id,
        chunk_text: r.text,
        type: r.metadata.type,
        userId: r.metadata.userId,
        title: r.metadata.title,
        sourceId: r.metadata.sourceId,
        tags: r.metadata.tags,
        subject: r.metadata.subject ?? "",
        createdAt: r.metadata.createdAt,
      })),
    });
  } catch (error) {
    console.error("Pinecone upsert error:", error);
  }
}

export async function searchStudyContent(
  query: string,
  options: {
    userId?: string;
    topK?: number;
  } = {}
): Promise<
  {
    id: string;
    score: number;
    title: string;
    text: string;
    sourceId: string;
  }[]
> {
  const pc = getPineconeClient();
  const indexName = getPineconeIndexName();

  try {
    const index = pc.index(indexName);
    const response = await index.searchRecords({
      query: {
        inputs: { text: query },
        topK: options.topK ?? 5,
        ...(options.userId ? { filter: { userId: { $eq: options.userId } } } : {}),
      },
    });

    return (response.result?.hits ?? []).map((hit) => ({
      id: hit._id,
      score: hit._score,
      title: (hit.fields as Record<string, string>)?.title ?? "",
      text: (hit.fields as Record<string, string>)?.chunk_text ?? "",
      sourceId: (hit.fields as Record<string, string>)?.sourceId ?? "",
    }));
  } catch (error) {
    console.error("Pinecone search error:", error);
    return [];
  }
}

export async function deleteStudyContent(ids: string[]): Promise<void> {
  const pc = getPineconeClient();
  const indexName = getPineconeIndexName();

  try {
    const index = pc.index(indexName);
    await index.deleteMany({ ids });
  } catch (error) {
    console.error("Pinecone delete error:", error);
  }
}
