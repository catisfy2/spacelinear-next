"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import Link from "next/link";

interface NoteRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown note content with:
 * - GFM tables, checkboxes, strikethrough
 * - LaTeX math (inline $...$ and block $$...$$)
 * - Raw HTML passthrough
 * - [[wikilinks]] rendered as local links
 * - Read-only checkboxes
 * - Styled code blocks
 */
export function NoteRenderer({ content, className = "" }: NoteRendererProps) {
  const components: Partial<Components> = {
    // Render [[wikilinks]] as <a> to /notes/[title]
    a: ({ href, children, ...props }) => {
      // Detect wikilink pattern: text content wrapped in [[ ]]
      const text = String(children);
      if (href === undefined) {
        // This shouldn't happen with proper markdown, but handle gracefully
        return <a {...props}>{children}</a>;
      }
      return (
        <a
          href={href}
          {...props}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {children}
        </a>
      );
    },
    // Render checkboxes as read-only toggles
    input: ({ type, checked, ...props }) => {
      if (type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="pointer-events-none mr-1.5 mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-0"
          />
        );
      }
      return <input type={type} {...props} />;
    },
    // Style code blocks
    pre: ({ children, ...props }) => (
      <pre
        className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),
    code: ({ className: codeClassName, children, ...props }) => {
      // inline is passed by react-markdown but not in the public types
      const allProps = props as Record<string, unknown>;
      const isInline = allProps.inline === true;
      if (isInline) {
        return (
          <code
            className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={codeClassName} {...props}>
          {children}
        </code>
      );
    },
    // Style tables
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table
          className="min-w-full border-collapse border border-border text-sm"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className="border border-border bg-muted px-3 py-2 text-left font-semibold"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border px-3 py-2" {...props}>
        {children}
      </td>
    ),
    // Style blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    ),
  };

  // Transform wikilinks [[title]] into markdown links
  const transformed = content.replace(
    /\[\[([^\]]+)\]\]/g,
    (_match, title) => `[${title}](/notes?search=${encodeURIComponent(title)})`,
  );

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={components}
      >
        {transformed}
      </ReactMarkdown>
    </div>
  );
}
