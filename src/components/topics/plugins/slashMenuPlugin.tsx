import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addComposerChild$,
  realmPlugin,
  $createCodeBlockNode,
} from '@mdxeditor/editor';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  type TextNode,
} from 'lexical';
import { LexicalTypeaheadMenuPlugin, MenuOption, type MenuTextMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';

type SlashAction = () => void;

class SlashOption extends MenuOption {
  title: string;
  description: string;
  action: SlashAction;

  constructor(key: string, title: string, description: string, action: SlashAction) {
    super(key);
    this.title = title;
    this.description = description;
    this.action = action;
  }
}

function $applyBlockType(tag: HeadingTagType | 'quote'): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  $setBlocksType(selection, () => (tag === 'quote' ? $createQuoteNode() : $createHeadingNode(tag)));
}

function $insertCodeBlock(): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    $insertNodes([$createCodeBlockNode({ language: 'ts', code: '' })]);
    return;
  }
  $setBlocksType(selection, () => $createParagraphNode());
  $insertNodes([$createCodeBlockNode({ language: 'ts', code: '' })]);
}

function $insertMathBlock(): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;
  $setBlocksType(selection, () => $createParagraphNode());
  const mathSource = $createTextNode('$$\n\n$$');
  $insertNodes([mathSource]);
  mathSource.select(3, 3);
}

function $removeSlashQuery(textNode: TextNode | null): void {
  if (!textNode) return;
  const text = textNode.getTextContent();
  const slashIndex = text.lastIndexOf('/');
  if (slashIndex === -1) return;
  textNode.spliceText(slashIndex, text.length - slashIndex, '', true);
}

function getSlashMatch(text: string): MenuTextMatch | null {
  const match = /(^|\s)\/([^\s/]*)$/.exec(text);
  if (!match) return null;
  const slashIndex = text.lastIndexOf('/');
  return {
    leadOffset: slashIndex,
    matchingString: match[2],
    replaceableString: text.slice(slashIndex),
  };
}

function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);

  const options = useMemo(() => {
    const allOptions: SlashOption[] = [
      new SlashOption('h1', 'Heading 1', 'Large section heading', () => $applyBlockType('h1')),
      new SlashOption('h2', 'Heading 2', 'Medium section heading', () => $applyBlockType('h2')),
      new SlashOption('h3', 'Heading 3', 'Small section heading', () => $applyBlockType('h3')),
      new SlashOption('bullet', 'Bullet list', 'Create an unordered list', () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      }),
      new SlashOption('numbered', 'Numbered list', 'Create an ordered list', () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }),
      new SlashOption('todo', 'Todo', 'Create a checklist', () => {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      }),
      new SlashOption('quote', 'Quote', 'Create a block quote', () => $applyBlockType('quote')),
      new SlashOption('code', 'Code block', 'Insert a TypeScript code block', $insertCodeBlock),
      new SlashOption('divider', 'Divider', 'Insert a horizontal rule', () => {
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
      }),
      new SlashOption('math', 'Math block', 'Insert a display equation', $insertMathBlock),
    ];

    if (!query) return allOptions;
    const normalizedQuery = query.toLowerCase();
    return allOptions.filter(option =>
      `${option.title} ${option.description} ${option.key}`.toLowerCase().includes(normalizedQuery),
    );
  }, [editor, query]);

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      onQueryChange={setQuery}
      triggerFn={getSlashMatch}
      options={options}
      preselectFirstItem
      onSelectOption={(option, textNodeContainingQuery, closeMenu) => {
        editor.update(() => {
          $removeSlashQuery(textNodeContainingQuery);
          option.action();
        });
        closeMenu();
      }}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex, options: menuOptions }) => {
        if (!anchorElementRef.current || menuOptions.length === 0) return null;
        return createPortal(
          <div className="slash-menu rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
            {menuOptions.map((option, index) => (
              <button
                key={option.key}
                ref={element => option.setRefElement(element)}
                type="button"
                className="flex w-full min-w-56 flex-col rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                data-selected={selectedIndex === index}
                onMouseDown={event => event.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOptionAndCleanUp(option)}
              >
                <span className="font-medium">{option.title}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>
            ))}
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}

export const slashMenuPlugin = realmPlugin({
  init(realm) {
    realm.pub(addComposerChild$, SlashMenuPlugin);
  },
});
