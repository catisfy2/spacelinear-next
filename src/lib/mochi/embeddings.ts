type FeatureExtractor = (
  input: string | string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array } | { data: Float32Array }[]>;

let extractor: FeatureExtractor | null = null;

async function getExtractor() {
  if (process.env.VERCEL) {
    throw new Error("Local embeddings are disabled on Vercel serverless.");
  }

  if (!extractor) {
    const { pipeline } = await import("@xenova/transformers");
    extractor = (await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    )) as FeatureExtractor;
  }
  return extractor;
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor();
  const result = await model(text, { pooling: "mean", normalize: true });
  return Array.from((result as { data: Float32Array }).data);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const model = await getExtractor();
  const results = await model(texts, { pooling: "mean", normalize: true });
  return (results as { data: Float32Array }[]).map((r) => Array.from(r.data));
}
