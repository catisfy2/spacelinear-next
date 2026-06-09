import { pipeline } from "@xenova/transformers";

let extractor: Awaited<ReturnType<typeof pipeline<"feature-extraction">>> | null = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor();
  const result = await model(text, { pooling: "mean", normalize: true });
  return Array.from(result.data as Float32Array);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const model = await getExtractor();
  const results = await model(texts, { pooling: "mean", normalize: true });
  return (results as unknown as { data: Float32Array }[]).map((r) =>
    Array.from(r.data),
  );
}
