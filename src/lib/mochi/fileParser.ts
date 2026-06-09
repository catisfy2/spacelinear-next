interface FileParseResult {
  text: string;
  pageCount?: number;
}

export async function parseFile(
  buffer: Buffer,
  filename: string,
): Promise<FileParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf": {
      if (process.env.VERCEL) {
        throw new Error(
          "PDF attachments are not supported on this deployment runtime yet.",
        );
      }

      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const [textResult, infoResult] = await Promise.all([
        parser.getText(),
        parser.getInfo(),
      ]);
      return { text: textResult.text, pageCount: infoResult.total };
    }
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
