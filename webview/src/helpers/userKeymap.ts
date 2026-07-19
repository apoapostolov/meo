import type { Command, KeyBinding } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import {
  undo,
  redo,
  undoSelection,
  redoSelection,
  cursorCharLeft,
  cursorCharRight,
  cursorCharForward,
  cursorCharBackward,
  cursorGroupLeft,
  cursorGroupRight,
  cursorGroupForward,
  cursorGroupBackward,
  cursorLineUp,
  cursorLineDown,
  cursorPageUp,
  cursorPageDown,
  cursorLineStart,
  cursorLineEnd,
  cursorDocStart,
  cursorDocEnd,
  selectCharLeft,
  selectCharRight,
  selectGroupLeft,
  selectGroupRight,
  selectLineUp,
  selectLineDown,
  selectPageUp,
  selectPageDown,
  selectLineStart,
  selectLineEnd,
  selectDocStart,
  selectDocEnd,
  selectAll,
  selectLine,
  deleteCharBackward,
  deleteCharForward,
  deleteGroupBackward,
  deleteGroupForward,
  deleteLine,
  deleteToLineStart,
  deleteToLineEnd,
  indentMore,
  indentLess,
  indentSelection,
  insertNewlineAndIndent,
  insertBlankLine,
  transposeChars,
  moveLineUp,
  moveLineDown,
  copyLineUp,
  copyLineDown
} from '@codemirror/commands';
import { foldCode, unfoldCode, toggleFold, foldAll, unfoldAll } from '@codemirror/language';
import {
  getCollapsedHeadingSections,
  toggleCollapsibleSection
} from './headingCollapse';
import type { KeymapCommandName, NormalizedKeymapBinding } from '../../../src/shared/keymapConfig';

export type KeymapCommandHandlers = {
  openFind?: () => void;
  openReplace?: () => void;
  toggleMode?: () => void;
};

const toggleHeadingCollapseCommand: Command = (view) => {
  const head = view.state.selection.main.head;
  const sections = getCollapsedHeadingSections(view.state);
  if (!sections.length) {
    return false;
  }

  // Prefer the heading whose body contains the cursor, else the heading line itself.
  let target = sections.find(
    (section) => head > section.collapseFrom && head < section.collapseTo
  );
  if (!target) {
    target = sections.find((section) => {
      const line = view.state.doc.lineAt(section.lineFrom);
      return head >= line.from && head <= line.to;
    });
  }
  if (!target) {
    // Nearest heading above the cursor.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      if (sections[i].lineFrom <= head) {
        target = sections[i];
        break;
      }
    }
  }
  if (!target) {
    return false;
  }
  return toggleCollapsibleSection(view, target.lineFrom);
};

const BUILTIN_COMMANDS: Partial<Record<KeymapCommandName, Command>> = {
  undo,
  redo,
  undoSelection,
  redoSelection,
  cursorCharLeft,
  cursorCharRight,
  cursorCharForward,
  cursorCharBackward,
  cursorGroupLeft,
  cursorGroupRight,
  cursorGroupForward,
  cursorGroupBackward,
  cursorLineUp,
  cursorLineDown,
  cursorPageUp,
  cursorPageDown,
  cursorLineStart,
  cursorLineEnd,
  cursorDocStart,
  cursorDocEnd,
  selectCharLeft,
  selectCharRight,
  selectGroupLeft,
  selectGroupRight,
  selectLineUp,
  selectLineDown,
  selectPageUp,
  selectPageDown,
  selectLineStart,
  selectLineEnd,
  selectDocStart,
  selectDocEnd,
  selectAll,
  selectLine,
  deleteCharBackward,
  deleteCharForward,
  deleteGroupBackward,
  deleteGroupForward,
  deleteLine,
  deleteToLineStart,
  deleteToLineEnd,
  indentMore,
  indentLess,
  indentSelection,
  insertNewlineAndIndent,
  insertBlankLine,
  transposeChars,
  moveLineUp,
  moveLineDown,
  copyLineUp,
  copyLineDown,
  foldCode,
  unfoldCode,
  toggleFold,
  foldAll,
  unfoldAll,
  toggleHeadingCollapse: toggleHeadingCollapseCommand
};

/**
 * passthrough: claim the key in CM (so lower keymaps don't handle it) but do not
 * preventDefault/stopPropagation, so VS Code / the browser can still see it.
 */
const passthroughBinding = (key: string): KeyBinding => ({
  key,
  run: () => true,
  preventDefault: false,
  stopPropagation: false
});

export function buildUserKeymapBindings(
  bindings: readonly NormalizedKeymapBinding[],
  handlers: KeymapCommandHandlers = {}
): KeyBinding[] {
  if (!bindings.length) {
    return [];
  }

  const result: KeyBinding[] = [];

  for (const binding of bindings) {
    if (binding.command === 'passthrough') {
      result.push(passthroughBinding(binding.key));
      continue;
    }

    if (binding.command === 'openFind') {
      result.push({
        key: binding.key,
        run: () => {
          handlers.openFind?.();
          return Boolean(handlers.openFind);
        }
      });
      continue;
    }

    if (binding.command === 'openReplace') {
      result.push({
        key: binding.key,
        run: () => {
          handlers.openReplace?.();
          return Boolean(handlers.openReplace);
        }
      });
      continue;
    }

    if (binding.command === 'toggleMode') {
      result.push({
        key: binding.key,
        run: () => {
          handlers.toggleMode?.();
          return Boolean(handlers.toggleMode);
        }
      });
      continue;
    }

    const command = BUILTIN_COMMANDS[binding.command];
    if (!command) {
      continue;
    }
    result.push({ key: binding.key, run: command });
  }

  return result;
}

export function collectPassthroughKeys(
  bindings: readonly NormalizedKeymapBinding[]
): Set<string> {
  const keys = new Set<string>();
  for (const binding of bindings) {
    if (binding.command === 'passthrough') {
      keys.add(binding.key);
    }
  }
  return keys;
}

/** No-op helper so EditorView is retained as a type-only-friendly import side path. */
export function isEditorView(value: unknown): value is EditorView {
  return Boolean(value && typeof value === 'object' && 'state' in (value as object));
}
