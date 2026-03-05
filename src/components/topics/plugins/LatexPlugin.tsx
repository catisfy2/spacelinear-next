import { useCallback, useEffect, useRef, useState } from 'react';
import { YooptaPlugin, Elements, useYooptaEditor } from '@yoopta/editor';
import type { PluginElementRenderProps } from '@yoopta/editor';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ─── Rendered LaTeX display component ──────────────────────────────────────

function LatexRenderer({ formula, displayMode }: { formula: string; displayMode: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      katex.render(formula || '\\text{Empty formula}', containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: 'hsl(var(--destructive))',
        trust: false,
      });
    } catch {
      if (containerRef.current) {
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  return <span ref={containerRef} />;
}

// ─── Editable LaTeX block component ────────────────────────────────────────

function LatexBlockElement({ element, attributes, children, blockId }: PluginElementRenderProps) {
  const yoopta = useYooptaEditor();

  const formula: string = (element.props as Record<string, unknown>)?.formula as string ?? '';
  const displayMode: boolean = (element.props as Record<string, unknown>)?.displayMode as boolean ?? true;

  const [isEditing, setIsEditing] = useState(!formula);
  const [draft, setDraft] = useState(formula);
  const [draftDisplayMode, setDraftDisplayMode] = useState(displayMode);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when formula changes externally (undo/redo)
  useEffect(() => {
    if (!isEditing) {
      setDraft(formula);
      setDraftDisplayMode(displayMode);
    }
  }, [formula, displayMode, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const validateAndPreview = useCallback((value: string, mode: boolean) => {
    if (!value) { setError(null); return; }
    try {
      katex.renderToString(value, { throwOnError: true, displayMode: mode });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // ── The key fix: write formula back into Slate via Elements.updateElement ──
  const commitEdit = useCallback(() => {
    setIsEditing(false);
    setError(null);
    Elements.updateElement(yoopta, blockId, {
      props: {
        nodeType: 'void',
        formula: draft,
        displayMode: draftDisplayMode,
      },
    });
  }, [yoopta, blockId, draft, draftDisplayMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      }
      if (e.key === 'Escape') {
        setDraft(formula);
        setDraftDisplayMode(displayMode);
        setIsEditing(false);
        setError(null);
      }
    },
    [commitEdit, formula, displayMode],
  );

  const handleToggleDisplayMode = useCallback(() => {
    const newMode = !draftDisplayMode;
    setDraftDisplayMode(newMode);
    validateAndPreview(draft, newMode);
  }, [draftDisplayMode, draft, validateAndPreview]);

  return (
    <div
      {...attributes}
      contentEditable={false}
      className="latex-block"
    >
      {isEditing ? (
        <div className="latex-editor">
          <div className="latex-editor-header">
            <span className="latex-editor-label">LaTeX</span>
            <div className="latex-editor-actions">
              <span className="latex-editor-hint">Enter to save · Esc to cancel</span>
              <button
                type="button"
                className="latex-editor-toggle"
                onClick={handleToggleDisplayMode}
                title={draftDisplayMode ? 'Switch to inline mode' : 'Switch to display mode'}
              >
                {draftDisplayMode ? 'Display' : 'Inline'}
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="latex-editor-textarea"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              validateAndPreview(e.target.value, draftDisplayMode);
            }}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            placeholder="Enter LaTeX formula, e.g. E = mc^2"
            rows={3}
            spellCheck={false}
          />

          {error && <div className="latex-editor-error">{error}</div>}

          {draft && (
            <div className={`latex-preview ${draftDisplayMode ? 'latex-preview--block' : 'latex-preview--inline'}`}>
              <span className="latex-preview-label">Preview</span>
              <div className="latex-preview-content">
                <LatexRenderer formula={draft} displayMode={draftDisplayMode} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`latex-rendered ${displayMode ? 'latex-rendered--block' : 'latex-rendered--inline'}`}
          onClick={() => setIsEditing(true)}
          title="Click to edit formula"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsEditing(true); }}
        >
          {formula ? (
            <LatexRenderer formula={formula} displayMode={displayMode} />
          ) : (
            <span className="latex-placeholder">Click to add LaTeX formula…</span>
          )}
        </div>
      )}

      {/* Required by Slate for void nodes */}
      {children}
    </div>
  );
}

// ─── Yoopta v4 Plugin definition ────────────────────────────────────────────

type LatexElementProps = {
  nodeType: 'void';
  formula: string;
  displayMode: boolean;
};

const LatexPlugin = new YooptaPlugin<
  { latex: { type: 'latex'; id: string; props: LatexElementProps; children: { text: string }[] } },
  { formula?: string; displayMode?: boolean }
>({
  type: 'Latex',
  elements: {
    latex: {
      render: LatexBlockElement,
      asRoot: true,
      props: {
        nodeType: 'void',
        formula: '',
        displayMode: true,
      },
    },
  },
  options: {
    display: {
      title: 'LaTeX',
      description: 'Math formula block',
      icon: '∑',
    },
    shortcuts: ['latex', '$$'],
  },
  parsers: {
    html: {
      serialize: (element) => {
        const formula = (element.props as Record<string, unknown>)?.formula as string ?? '';
        const dm = (element.props as Record<string, unknown>)?.displayMode as boolean ?? true;
        try {
          const html = katex.renderToString(formula, { displayMode: dm, throwOnError: false });
          return dm
            ? `<div class="latex-block">${html}</div>`
            : `<span class="latex-inline">${html}</span>`;
        } catch {
          return `<code>${formula}</code>`;
        }
      },
    },
    markdown: {
      serialize: (element) => {
        const formula = (element.props as Record<string, unknown>)?.formula as string ?? '';
        const dm = (element.props as Record<string, unknown>)?.displayMode as boolean ?? true;
        return dm ? `\n$$\n${formula}\n$$\n` : `$${formula}$`;
      },
    },
  },
});

export default LatexPlugin;
