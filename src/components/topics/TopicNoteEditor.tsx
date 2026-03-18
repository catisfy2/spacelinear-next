import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import YooptaEditor, {
  createYooptaEditor,
  buildBlockData,
  buildBlockElement,
  generateId,
  type YooptaContentValue,
  type YooptaOnChangeOptions,
} from '@yoopta/editor';
import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Headings from '@yoopta/headings';
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists';
import Accordion from '@yoopta/accordion';
import Divider from '@yoopta/divider';
import Callout from '@yoopta/callout';
import Link from '@yoopta/link';
import TableOfContents from '@yoopta/table-of-contents';
import Table from '@yoopta/table';
import Image from '@yoopta/image';
import Code from '@yoopta/code';
import Embed from '@yoopta/embed';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import LatexPlugin from './plugins/LatexPlugin';
import { Bold, Italic, Underline, Strike, CodeMark, Highlight } from '@yoopta/marks';
import { useStore } from '@/store/useStore';
import { Check, Loader2 } from 'lucide-react';

const PLUGINS = [
  Paragraph,
  Blockquote,
  Headings.HeadingOne,
  Headings.HeadingTwo,
  Headings.HeadingThree,
  BulletedList,
  NumberedList,
  TodoList,
  Accordion, // Toggle Heading + Toggle List behavior
  Divider,
  Callout,
  Link, // "Link to page" / inline links
  TableOfContents,
  Table, // Simple table block
  Image,
  Code,
  Embed,
  LatexPlugin,
] as const;

const TOOLS = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  ActionMenu: {
    tool: ActionMenuList,
    render: DefaultActionMenuRender,
  },
};

const MARKS = [Bold, Italic, Underline, Strike, CodeMark, Highlight];

function getDefaultValue(): YooptaContentValue {
  const id = generateId();
  return {
    [id]: buildBlockData({
      id,
      type: 'Paragraph',
      value: [buildBlockElement({ type: 'paragraph', children: [{ text: '' }] })],
      meta: { order: 0, depth: 0 },
    }),
  } as YooptaContentValue;
}

function parseNotes(notes?: string): YooptaContentValue {
  if (!notes) return getDefaultValue();
  try {
    const parsed = JSON.parse(notes);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length > 0
    ) {
      return parsed as YooptaContentValue;
    }
  } catch {
    // not JSON — return default
  }
  return getDefaultValue();
}

type SaveStatus = 'idle' | 'saving' | 'saved';

interface TopicNoteEditorProps {
  topicId: string;
}

export function TopicNoteEditor({ topicId }: TopicNoteEditorProps) {
  const { topics, updateTopic } = useStore();
  const topic = topics.find(t => t.id === topicId);

  const editor = useMemo(() => createYooptaEditor(), [topicId]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialValue = useMemo(() => parseNotes(topic?.notes), [topicId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (value: YooptaContentValue, _options: YooptaOnChangeOptions) => {
      setSaveStatus('saving');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateTopic(topicId, { notes: JSON.stringify(value) });
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
    <div className="relative yoopta-editor text-foreground">
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

      <YooptaEditor
        editor={editor}
        plugins={PLUGINS}
        marks={MARKS}
        tools={TOOLS}
        value={initialValue}
        onChange={handleChange}
        placeholder="Start writing… (type / for commands)"
        width="100%"
        autoFocus
        style={{
          padding: '10px 42px 60px',
          fontFamily: 'inherit',
          minHeight: '60vh',
          color: 'hsl(var(--foreground))',
        }}
      />
    </div>
  );
}
