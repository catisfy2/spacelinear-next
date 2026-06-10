interface FileParseResult {
  text: string;
  pageCount?: number;
}

async function parsePdf(buffer: Buffer): Promise<FileParseResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { WorkerMessageHandler } = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  globalThis.pdfjsWorker = { WorkerMessageHandler };

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  try {
    const pageCount = doc.numPages;
    const pages: string[] = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .filter((item: unknown) => typeof (item as { str?: unknown }).str === "string")
        .map((item) => (item as { str: string }).str)
        .join(" ");
      pages.push(text);
    }
    return { text: pages.join("\n\n"), pageCount };
  } finally {
    (doc as unknown as { destroy: () => Promise<void> }).destroy?.();
  }
}

export async function parseFile(
  buffer: Buffer,
  filename: string,
): Promise<FileParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return parsePdf(buffer);
    case "docx": {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value };
    }
    case "txt":
    case "md":
    case "csv":
    case "html":
    case "htm":
      return { text: buffer.toString("utf-8") };
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}
