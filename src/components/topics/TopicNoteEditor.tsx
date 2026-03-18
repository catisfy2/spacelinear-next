import { useEffect, useMemo, useRef, useState } from 'react';
import type EditorJS from '@editorjs/editorjs';
import { useStore } from '@/store/useStore';
import { Check, Loader2 } from 'lucide-react';
import type { OutputData } from '@editorjs/editorjs';

const DEFAULT_EDITOR_DATA: OutputData = {
  blocks: [
    {
      type: 'paragraph',
      data: { text: '' },
    },
  ],
};

function parseNotes(notes?: string): OutputData {
  if (!notes) return DEFAULT_EDITOR_DATA;

  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.blocks)) {
      return parsed as OutputData;
    }
  } catch {
    return DEFAULT_EDITOR_DATA;
  }

  return DEFAULT_EDITOR_DATA;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

interface TopicNoteEditorProps {
  topicId: string;
}

export function TopicNoteEditor({ topicId }: TopicNoteEditorProps) {
  const { topics, updateTopic } = useStore();
  const topic = topics.find(t => t.id === topicId);

  const holderId = useMemo(
    () => `topic-note-editor-${topicId.replace(/[^a-zA-Z0-9-_]/g, '-')}`,
    [topicId],
  );
  const editorRef = useRef<EditorJS | null>(null);
  const updateTopicRef = useRef(updateTopic);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    updateTopicRef.current = updateTopic;
  }, [updateTopic]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const initialValue = parseNotes(topic?.notes);

    const initEditor = async () => {
      const [{ default: EditorJs }, { default: Header }, { default: List }, { default: Quote }, { default: Delimiter }, { default: Marker }, { default: InlineCode }, { default: CodeTool }, { default: Table }, { default: Warning }, { default: Checklist }, { default: Embed }, { default: LinkTool }] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/header'),
        import('@editorjs/list'),
        import('@editorjs/quote'),
        import('@editorjs/delimiter'),
        import('@editorjs/marker'),
        import('@editorjs/inline-code'),
        import('@editorjs/code'),
        import('@editorjs/table'),
        import('@editorjs/warning'),
        import('@editorjs/checklist'),
        import('@editorjs/embed'),
        import('@editorjs/link'),
      ]);

      if (disposed) return;

      editorRef.current?.destroy();

      editorRef.current = new EditorJs({
        holder: holderId,
        autofocus: true,
        inlineToolbar: true,
        defaultBlock: 'paragraph',
        placeholder: 'Start writing… (type / for commands)',
        data: initialValue,
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
          },
          delimiter: Delimiter,
          marker: Marker,
          inlineCode: InlineCode,
          code: CodeTool,
          table: Table,
          warning: Warning,
          checklist: Checklist,
          embed: Embed,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: '/api/editorjs/link',
            },
          },
        },
        onChange: async () => {
          if (!editorRef.current) return;

          setSaveStatus('saving');
          if (debounceRef.current) clearTimeout(debounceRef.current);

          debounceRef.current = setTimeout(async () => {
            try {
              const saved = await editorRef.current?.save();
              if (!saved) return;
              await updateTopicRef.current(topicId, { notes: JSON.stringify(saved) });
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
            } catch {
              setSaveStatus('idle');
            }
          }, 800);
        },
      });
    };

    void initEditor();

    return () => {
      disposed = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [holderId, topicId]);

  if (!topic) return null;

  return (
    <div className="relative text-foreground">
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

      <div
        id={holderId}
        className="w-full min-h-[60vh] px-[42px] pt-[10px] pb-[60px]"
      />
    </div>
  );
}
