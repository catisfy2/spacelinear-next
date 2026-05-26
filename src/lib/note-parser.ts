/**
 * Extract [[wikilinks]] from markdown content.
 */
export function extractWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

/**
 * Extract #tags from markdown content.
 * Matches #word but not ##, ###, or # inside [[wikilinks]].
 */
export function extractTags(content: string): string[] {
  const regex = /(?<!\w)(?!#)#([a-zA-Z0-9_\-]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return [...new Set(tags)];
}

/**
 * Strip markdown syntax to get plain text.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^### .+$/gm, "")
    .replace(/^## .+$/gm, "")
    .replace(/^# .+$/gm, "")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/(\*|_|~){1,3}(.+?)\1{1,3}/g, "$2")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^[>\-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/\$\$[^$]*\$\$/g, "")
    .replace(/\$[^$]*\$/g, "")
    .replace(/\n{2,}/g, " ")
    .trim();
}

/**
 * Get a short plain-text preview of markdown content.
 */
export function getPreview(content: string, maxChars = 120): string {
  const plain = stripMarkdown(content);
  if (plain.length <= maxChars) return plain;
  return plain.slice(0, maxChars).trimEnd() + "…";
}
