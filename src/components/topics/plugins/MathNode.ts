import { MathEditor } from '../MathEditor';
import { createElement, type JSX } from 'react';
import {
  $applyNodeReplacement,
  $createTextNode,
  $getNodeByKey,
  $isTextNode,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { EDIT_MATH_COMMAND } from './mathCommands';

export type SerializedMathNode = Spread<
  {
    formula: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

export class MathNode extends DecoratorNode<JSX.Element> {
  __formula: string;
  __inline: boolean;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__formula, node.__inline, node.__key);
  }

  constructor(formula: string, inline: boolean, key?: NodeKey) {
    super(key);
    this.__formula = formula;
    this.__inline = inline;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    return $createMathNode(serializedNode.formula, serializedNode.inline);
  }

  exportJSON(): SerializedMathNode {
    return {
      ...super.exportJSON(),
      formula: this.__formula,
      inline: this.__inline,
      type: 'math',
      version: 1,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: domNode => {
        if (!(domNode instanceof HTMLElement) || domNode.dataset.type !== 'math') return null;
        return {
          conversion: element => ({
            node: $createMathNode(
              element.getAttribute('data-formula') ?? '',
              element.getAttribute('data-inline') !== 'false',
            ),
          }),
          priority: 1,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement(this.__inline ? 'span' : 'div');
    element.setAttribute('data-type', 'math');
    element.setAttribute('data-formula', this.__formula);
    element.setAttribute('data-inline', String(this.__inline));
    element.textContent = this.getMarkdownSource();
    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement(this.__inline ? 'span' : 'div');
    element.className = config.theme.decorator ?? '';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  getFormula(): string {
    return this.__formula;
  }

  isInline(): boolean {
    return this.__inline;
  }

  getMarkdownSource(): string {
    return this.__inline ? `$${this.__formula}$` : `$$\n${this.__formula}\n$$`;
  }

  decorate(editor: LexicalEditor): JSX.Element {
    return createElement(MathEditor, {
      editor,
      formula: this.__formula,
      inline: this.__inline,
      nodeKey: this.getKey(),
    });
  }
}

export function $createMathNode(formula: string, inline = true): MathNode {
  return $applyNodeReplacement(new MathNode(formula, inline));
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}

export function $replaceMathNodeWithSource(nodeKey: NodeKey): boolean {
  const node = $getNodeByKey(nodeKey);
  if (!$isMathNode(node)) return false;

  const source = node.getMarkdownSource();
  const offset = node.isInline() ? 1 : 3;
  const focusOffset = offset + node.getFormula().length;
  const textNode = $createTextNode(source);
  node.replace(textNode);
  if ($isTextNode(textNode)) {
    textNode.select(offset, focusOffset);
  }
  return true;
}
