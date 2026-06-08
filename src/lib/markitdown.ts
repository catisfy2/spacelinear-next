import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT_PATH = join(process.cwd(), "scripts", "convert-files.py");

function ensurePythonAvailable(): void {
  try {
    execSync("python --version", { encoding: "utf-8", stdio: "ignore" });
  } catch {
    throw new Error(
      "Python is not available. MarkItDown requires Python 3.10+ installed on the server."
    );
  }
}

function ensureMarkItDownInstalled(): void {
  try {
    execSync("python -c 'from markitdown import MarkItDown'", {
      encoding: "utf-8",
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      "MarkItDown is not installed. Run: pip install 'markitdown[all]'"
    );
  }
}

export function convertFileToMarkdown(filePath: string): string {
  ensurePythonAvailable();
  ensureMarkItDownInstalled();

  try {
    const output = execSync(
      `python "${SCRIPT_PATH}" "${filePath.replace(/"/g, '\\"')}"`,
      { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }
    );
    return output.trim();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`MarkItDown conversion failed: ${message}`);
  }
}

export async function convertBufferToMarkdown(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const tmpDir = mkdtempSync(join(tmpdir(), "markitdown-"));
  const tmpPath = join(tmpDir, filename);

  try {
    writeFileSync(tmpPath, buffer);
    return convertFileToMarkdown(tmpPath);
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }
  }
}
