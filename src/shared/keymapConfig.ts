/**
 * Shared keymap config for markdownEditorOptimized.keymap.
 * Used by the extension host (settings parse) and the webview (bindings).
 */

export const KEYMAP_SETTING_KEY = 'keymap';

export type KeymapCommandName =
  | 'passthrough'
  // History
  | 'undo'
  | 'redo'
  | 'undoSelection'
  | 'redoSelection'
  // Cursor / selection
  | 'cursorCharLeft'
  | 'cursorCharRight'
  | 'cursorCharForward'
  | 'cursorCharBackward'
  | 'cursorGroupLeft'
  | 'cursorGroupRight'
  | 'cursorGroupForward'
  | 'cursorGroupBackward'
  | 'cursorLineUp'
  | 'cursorLineDown'
  | 'cursorPageUp'
  | 'cursorPageDown'
  | 'cursorLineStart'
  | 'cursorLineEnd'
  | 'cursorDocStart'
  | 'cursorDocEnd'
  | 'selectCharLeft'
  | 'selectCharRight'
  | 'selectGroupLeft'
  | 'selectGroupRight'
  | 'selectLineUp'
  | 'selectLineDown'
  | 'selectPageUp'
  | 'selectPageDown'
  | 'selectLineStart'
  | 'selectLineEnd'
  | 'selectDocStart'
  | 'selectDocEnd'
  | 'selectAll'
  | 'selectLine'
  // Edit
  | 'deleteCharBackward'
  | 'deleteCharForward'
  | 'deleteGroupBackward'
  | 'deleteGroupForward'
  | 'deleteLine'
  | 'deleteToLineStart'
  | 'deleteToLineEnd'
  | 'indentMore'
  | 'indentLess'
  | 'indentSelection'
  | 'insertNewlineAndIndent'
  | 'insertBlankLine'
  | 'transposeChars'
  | 'moveLineUp'
  | 'moveLineDown'
  | 'copyLineUp'
  | 'copyLineDown'
  // Fold (CodeMirror language folding)
  | 'foldCode'
  | 'unfoldCode'
  | 'toggleFold'
  | 'foldAll'
  | 'unfoldAll'
  // MEO-specific
  | 'toggleHeadingCollapse'
  | 'openFind'
  | 'openReplace'
  | 'toggleMode';

export type KeymapBinding = {
  key: string;
  command: KeymapCommandName;
};

/** Canonical CM-style key, e.g. Alt-ArrowUp, Mod-Shift-f */
export type NormalizedKeymapBinding = {
  key: string;
  command: KeymapCommandName;
};

export const KEYMAP_COMMAND_WHITELIST: readonly KeymapCommandName[] = [
  'passthrough',
  'undo',
  'redo',
  'undoSelection',
  'redoSelection',
  'cursorCharLeft',
  'cursorCharRight',
  'cursorCharForward',
  'cursorCharBackward',
  'cursorGroupLeft',
  'cursorGroupRight',
  'cursorGroupForward',
  'cursorGroupBackward',
  'cursorLineUp',
  'cursorLineDown',
  'cursorPageUp',
  'cursorPageDown',
  'cursorLineStart',
  'cursorLineEnd',
  'cursorDocStart',
  'cursorDocEnd',
  'selectCharLeft',
  'selectCharRight',
  'selectGroupLeft',
  'selectGroupRight',
  'selectLineUp',
  'selectLineDown',
  'selectPageUp',
  'selectPageDown',
  'selectLineStart',
  'selectLineEnd',
  'selectDocStart',
  'selectDocEnd',
  'selectAll',
  'selectLine',
  'deleteCharBackward',
  'deleteCharForward',
  'deleteGroupBackward',
  'deleteGroupForward',
  'deleteLine',
  'deleteToLineStart',
  'deleteToLineEnd',
  'indentMore',
  'indentLess',
  'indentSelection',
  'insertNewlineAndIndent',
  'insertBlankLine',
  'transposeChars',
  'moveLineUp',
  'moveLineDown',
  'copyLineUp',
  'copyLineDown',
  'foldCode',
  'unfoldCode',
  'toggleFold',
  'foldAll',
  'unfoldAll',
  'toggleHeadingCollapse',
  'openFind',
  'openReplace',
  'toggleMode'
] as const;

const commandSet = new Set<string>(KEYMAP_COMMAND_WHITELIST);

const SPECIAL_KEY_ALIASES: Record<string, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  enter: 'Enter',
  return: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  space: 'Space',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  pgup: 'PageUp',
  pgdn: 'PageDown'
};

const MODIFIER_ALIASES: Record<string, string> = {
  // Map ctrl/cmd/mod → Mod so bindings match CodeMirror's cross-platform Mod
  // (Cmd on macOS, Ctrl on Windows/Linux) and passthrough event matching.
  mod: 'Mod',
  cmd: 'Mod',
  command: 'Mod',
  meta: 'Mod',
  ctrl: 'Mod',
  control: 'Mod',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift'
};

/**
 * Normalize user key strings ("alt+up", "Ctrl-Shift-F", "mod+shift+f") to CodeMirror form ("Alt-ArrowUp").
 */
export function normalizeKeymapKey(raw: string): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed
    .split(/[+\-\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return null;
  }

  const modifiers: string[] = [];
  let mainKey: string | null = null;

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (MODIFIER_ALIASES[lower]) {
      const mod = MODIFIER_ALIASES[lower];
      if (!modifiers.includes(mod)) {
        modifiers.push(mod);
      }
      continue;
    }
    if (mainKey) {
      // Multiple main keys — invalid.
      return null;
    }
    if (SPECIAL_KEY_ALIASES[lower]) {
      mainKey = SPECIAL_KEY_ALIASES[lower];
      continue;
    }
    // Single character → keep letter lowercase for CM (f not F), except when length > 1
    if (part.length === 1) {
      mainKey = part.toLowerCase();
    } else if (/^f\d{1,2}$/i.test(part)) {
      mainKey = part.toUpperCase();
    } else {
      // Pascal-case unknowns (ArrowUp already handled)
      mainKey = part[0].toUpperCase() + part.slice(1);
    }
  }

  if (!mainKey) {
    return null;
  }

  // Stable modifier order matching CM docs: Mod/Ctrl/Alt/Shift
  const order = ['Mod', 'Ctrl', 'Alt', 'Shift'];
  modifiers.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return [...modifiers, mainKey].join('-');
}

export function normalizeKeymapCommand(raw: unknown): KeymapCommandName | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const command = raw.trim();
  if (!commandSet.has(command)) {
    return null;
  }
  return command as KeymapCommandName;
}

export function parseKeymapBindings(raw: unknown): NormalizedKeymapBinding[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seenKeys = new Set<string>();
  const result: NormalizedKeymapBinding[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const key = normalizeKeymapKey(typeof record.key === 'string' ? record.key : '');
    const command = normalizeKeymapCommand(record.command);
    if (!key || !command) {
      continue;
    }
    // Last binding for a key wins.
    if (seenKeys.has(key)) {
      const index = result.findIndex((item) => item.key === key);
      if (index >= 0) {
        result.splice(index, 1);
      }
    }
    seenKeys.add(key);
    result.push({ key, command });
  }

  return result;
}

/** Build a normalized key string from a browser KeyboardEvent (for passthrough checks). */
export function keyEventToNormalizedKey(event: KeyboardEvent, isMac: boolean): string {
  const modifiers: string[] = [];
  // Treat Meta as Mod on mac, Ctrl as Mod on win/linux for matching user "mod+..." bindings.
  if (isMac ? event.metaKey : event.ctrlKey) {
    modifiers.push('Mod');
  }
  // Also allow explicit Ctrl- on mac when ctrl is held without meta
  if (isMac && event.ctrlKey && !event.metaKey) {
    modifiers.push('Ctrl');
  }
  if (!isMac && event.metaKey) {
    modifiers.push('Mod');
  }
  if (event.altKey) {
    modifiers.push('Alt');
  }
  if (event.shiftKey) {
    modifiers.push('Shift');
  }

  let main: string;
  const code = event.code || '';
  const key = event.key || '';

  if (code.startsWith('Arrow') || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    main = key.startsWith('Arrow') ? key : code;
  } else if (code.startsWith('Key') && code.length === 4) {
    main = code.slice(3).toLowerCase();
  } else if (code.startsWith('Digit') && code.length === 6) {
    main = code.slice(5);
  } else if (/^F\d{1,2}$/.test(code)) {
    main = code;
  } else if (key === ' ') {
    main = 'Space';
  } else if (key.length === 1) {
    main = key.toLowerCase();
  } else {
    main = key.length ? key[0].toUpperCase() + key.slice(1) : code;
  }

  const order = ['Mod', 'Ctrl', 'Alt', 'Shift'];
  const uniqueMods = [...new Set(modifiers)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return [...uniqueMods, main].join('-');
}

export function bindingListEquals(a: NormalizedKeymapBinding[], b: NormalizedKeymapBinding[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].key !== b[i].key || a[i].command !== b[i].command) {
      return false;
    }
  }
  return true;
}
