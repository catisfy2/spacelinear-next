"""MarkItDown wrapper: converts uploaded files to Markdown for LLM ingestion."""
import sys
from markitdown import MarkItDown


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python convert-files.py <file-path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        md = MarkItDown(enable_plugins=False)
        result = md.convert(file_path)
        print(result.text_content)
    except Exception as e:
        print(f"Error converting file: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
