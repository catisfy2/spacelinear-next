import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  createRootEditorSubscription$,
  realmPlugin,
  type LexicalVisitor,
  type MdastImportVisitor,
} from '@mdxeditor/editor';
import { mathFromMarkdown, mathToMarkdown } from 'mdast-util-math';
import type { InlineMath, Math as MdastMath } from 'mdast-util-math';
import { math } from 'micromark-extension-math';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  type LexicalEditor,
  type LexicalNode,
  TextNode,
} from 'lexical';
import {
  $createMathNode,
  $isMathNode,
  $replaceMathNodeWithSource,
  MathNode,
} from './MathNode';
import { EDIT_MATH_COMMAND } from './mathCommands';

export const INLINE_MATH_PATTERN = /\$([^$\n]+)\$(?=\s)/g;
export const BLOCK_MATH_PATTERN = /\$\$\n([\s\S]+?)\n\$\$(?=\s)/g;

function canAppend(node: LexicalNode): node is LexicalNode & { append: (...nodes: LexicalNode[]) => void } {
  return $isElementNode(node) || node.getType() === 'root';
}

function hasMeaningfulMath(formula: string): boolean {
  const normalized = formula.trim();
  return normalized.length > 0 && !/^\d+(?:\.\d+)?$/.test(normalized);
}

function replaceTextRange(textNode: TextNode, start: number, end: number, replacement: MathNode): void {
  const text = textNode.getTextContent();
  let target: TextNode;

  if (start === 0 && end === text.length) {
    target = textNode;
  } else if (start === 0) {
    [target] = textNode.splitText(end);
  } else if (end === text.length) {
    [, target] = textNode.splitText(start);
  } else {
    [, target] = textNode.splitText(start, end);
  }

  target.replace(replacement);
}

function findMathMatch(text: string): { start: number; end: number; formula: string; inline: boolean } | null {
  BLOCK_MATH_PATTERN.lastIndex = 0;
  const blockMatch = BLOCK_MATH_PATTERN.exec(text);
  if (blockMatch && hasMeaningfulMath(blockMatch[1])) {
    return {
      start: blockMatch.index,
      end: blockMatch.index + blockMatch[0].length,
      formula: blockMatch[1],
      inline: false,
    };
  }

  INLINE_MATH_PATTERN.lastIndex = 0;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = INLINE_MATH_PATTERN.exec(text))) {
    const previousChar = text[inlineMatch.index - 1];
    const formula = inlineMatch[1];
    if ((!previousChar || /\s|[([{:;]/.test(previousChar)) && hasMeaningfulMath(formula)) {
      return {
        start: inlineMatch.index,
        end: inlineMatch.index + inlineMatch[0].length,
        formula,
        inline: true,
      };
    }
  }

  return null;
}

function transformTextNode(textNode: TextNode): void {
  if (!textNode.isSimpleText() || textNode.isComposing()) return;
  const text = textNode.getTextContent();
  if (!text.includes('$')) return;

  const match = findMathMatch(text);
  if (!match) return;

  replaceTextRange(textNode, match.start, match.end, $createMathNode(match.formula, match.inline));
}

function registerMath(editor: LexicalEditor): () => void {
  const removeEditCommand = editor.registerCommand(
    EDIT_MATH_COMMAND,
    nodeKey => {
      return $replaceMathNodeWithSource(nodeKey);
    },
    COMMAND_PRIORITY_EDITOR,
  );
  const removeTransform = editor.registerNodeTransform(TextNode, transformTextNode);
  return () => {
    removeEditCommand();
    removeTransform();
  };
}

export const mathImportVisitor: MdastImportVisitor<InlineMath | MdastMath> = {
  testNode: node => node.type === 'math' || node.type === 'inlineMath',
  visitNode({ mdastNode, lexicalParent }) {
    if (!canAppend(lexicalParent)) return;
    lexicalParent.append($createMathNode(mdastNode.value ?? '', mdastNode.type === 'inlineMath'));
  },
};

export const mathExportVisitor: LexicalVisitor = {
  testLexicalNode: $isMathNode,
  visitLexicalNode({ lexicalNode, mdastParent, actions }) {
    if (!$isMathNode(lexicalNode)) return;
    actions.appendToParent(mdastParent, {
      type: lexicalNode.isInline() ? 'inlineMath' : 'math',
      value: lexicalNode.getFormula(),
    } as never);
  },
};

export const INSERT_MATH_COMMAND = 'insert-math-block';

export function insertMathSourceBlock(editor: LexicalEditor): void {
  editor.update(() => {
    const selection = $getSelection();
    const source = '$$\n\n$$';
    const textNode = $createTextNode(source);
    if ($isRangeSelection(selection)) {
      selection.insertNodes([textNode]);
    } else {
      const paragraph = $createParagraphNode();
      paragraph.append(textNode);
      $insertNodes([paragraph]);
    }
    textNode.select(3, 3);
  });
}

export const mathPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addLexicalNode$]: MathNode,
      [addSyntaxExtension$]: math({ singleDollarTextMath: true }),
      [addMdastExtension$]: mathFromMarkdown(),
      [addToMarkdownExtension$]: mathToMarkdown({ singleDollarTextMath: true }),
      [addImportVisitor$]: mathImportVisitor,
      [addExportVisitor$]: mathExportVisitor,
      [createRootEditorSubscription$]: registerMath,
    });
  },
});
