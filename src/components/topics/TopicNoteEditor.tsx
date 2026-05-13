'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  type MDXEditorProps,
} from '@mdxeditor/editor';
import { useStore } from '@/store/useStore';
import { Check, Loader2 } from 'lucide-react';
import { mathPlugin } from './plugins/mathPlugin';
import { slashMenuPlugin } from './plugins/slashMenuPlugin';

const MDXEditor = dynamic(
  () => import('@mdxeditor/editor').then(mod => mod.MDXEditor),
  { ssr: false },
);

const CODE_BLOCK_LANGUAGES = {
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  jsx: 'JSX',
  py: 'Python',
  rs: 'Rust',
  go: 'Go',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  cs: 'C#',
  bash: 'Bash',
  sh: 'Shell',
  sql: 'SQL',
  json: 'JSON',
  yaml: 'YAML',
  md: 'Markdown',
  html: 'HTML',
  css: 'CSS',
  tex: 'TeX',
  txt: 'Plain text',
};

const EDITOR_PLUGINS: MDXEditorProps['plugins'] = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: 'ts' }),
  codeMirrorPlugin({
    codeBlockLanguages: CODE_BLOCK_LANGUAGES,
    autoLoadLanguageSupport: true,
  }),
  diffSourcePlugin(),
  mathPlugin(),
  slashMenuPlugin(),
  markdownShortcutPlugin(),
];

function toMarkdown(notes?: string): string {
  if (!notes) return '';
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === 'object' && parsed !== null) return '';
  } catch {
    return notes;
  }
  return notes;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

interface TopicNoteEditorProps {
  topicId: string;
}

export function TopicNoteEditor({ topicId }: TopicNoteEditorProps) {
  const { topics, updateTopic } = useStore();
  const topic = topics.find(t => t.id === topicId);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialMarkdown = useMemo(() => toMarkdown(topic?.notes), [topic?.notes]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (markdown: string, initialMarkdownNormalize: boolean) => {
      if (initialMarkdownNormalize) return;
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateTopic(topicId, { notes: markdown });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('idle');
        }
      }, 800);
    },
    [topicId, updateTopic],
  );

  if (!topic) return null;

  return (
    <div className="relative mdx-note-editor text-foreground">
      {/* Save indicator */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 text-xs text-muted-foreground pointer-events-none">
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving…</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-green-500">Saved</span>
          </>
        )}
      </div>

      <MDXEditor
        key={topicId}
        markdown={initialMarkdown}
        onChange={handleChange}
        plugins={EDITOR_PLUGINS}
        placeholder="Start writing... (type / for commands)"
        autoFocus={{ defaultSelection: 'rootEnd' }}
        trim={false}
        className="min-h-[60vh]"
        contentEditableClassName="mdx-note-editor-content"
      />
    </div>
  );
}
