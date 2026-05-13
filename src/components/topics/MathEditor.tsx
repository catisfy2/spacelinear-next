import { useEffect, useRef } from 'react';
import type { NodeKey } from 'lexical';
import type { LexicalEditor } from 'lexical';
import katex from 'katex';
import { EDIT_MATH_COMMAND } from './plugins/mathCommands';

interface MathEditorProps {
  editor: LexicalEditor;
  formula: string;
  inline: boolean;
  nodeKey: NodeKey;
}

export function MathEditor({ editor, formula, inline, nodeKey }: MathEditorProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      katex.render(formula || '\\text{Empty formula}', containerRef.current, {
        displayMode: !inline,
        throwOnError: false,
        errorColor: 'hsl(var(--destructive))',
        trust: false,
      });
    } catch {
      containerRef.current.textContent = formula;
    }
  }, [formula, inline]);

  return (
    <span
      className={inline ? 'math-rendered math-rendered--inline' : 'math-rendered math-rendered--block'}
      contentEditable={false}
      onClick={() => editor.dispatchCommand(EDIT_MATH_COMMAND, nodeKey)}
      role="button"
      tabIndex={0}
      title="Click to edit equation"
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          editor.dispatchCommand(EDIT_MATH_COMMAND, nodeKey);
        }
      }}
    >
      <span ref={containerRef} />
    </span>
  );
}
