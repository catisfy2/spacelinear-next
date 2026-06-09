import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

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
      const parser = new PDFParse({ data: buffer });
      const [textResult, infoResult] = await Promise.all([
        parser.getText(),
        parser.getInfo(),
      ]);
      return { text: textResult.text, pageCount: infoResult.total };
    }
    case "docx": {
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
