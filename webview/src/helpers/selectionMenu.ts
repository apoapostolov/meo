import { createElement, Bold, Italic, Strikethrough, Terminal, Link, Brackets, Keyboard } from 'lucide';

export interface SelectionMenuElements {
  menu: HTMLDivElement;
  suggestions: HTMLDivElement;
}

export type DiagnosticSuggestionMenuItem = {
  from: number;
  to: number;
  text: string;
};

export type SelectionMenuState = {
  visible?: boolean;
  anchorX?: number;
  anchorY?: number;
  anchorBottomY?: number;
  align?: 'center' | 'start';
  diagnosticSuggestions?: DiagnosticSuggestionMenuItem[];
  /** When true, selection is still being dragged — keep menu hidden. */
  selecting?: boolean;
};

const createSelectionActionButton = (action: string, label: string, Icon: any): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'selection-inline-button';
  button.dataset.action = action;
  button.title = label;
  button.setAttribute('aria-label', label);
  button.appendChild(createElement(Icon, { width: 16, height: 16 }));
  return button;
};

export const createSelectionMenu = (): SelectionMenuElements => {
  const menu = document.createElement('div');
  menu.className = 'selection-inline-menu';
  menu.setAttribute('role', 'toolbar');
  menu.setAttribute('aria-label', 'Inline markdown formatting');
  // Keep out of the tab order until shown; buttons remain clickable via pointer.
  menu.setAttribute('aria-hidden', 'true');

  const selectionBoldBtn = createSelectionActionButton('bold', 'Bold', Bold);
  const selectionItalicBtn = createSelectionActionButton('italic', 'Italic', Italic);
  const selectionLineoverBtn = createSelectionActionButton('lineover', 'Lineover', Strikethrough);
  const selectionInlineCodeBtn = createSelectionActionButton('inlineCode', 'Inline Code', Terminal);
  const selectionLinkBtn = createSelectionActionButton('link', 'Link', Link);
  const selectionWikiLinkBtn = createSelectionActionButton('wikiLink', 'Wiki Link', Brackets);
  const selectionKbdBtn = createSelectionActionButton('kbd', 'Kbd', Keyboard);
  const suggestions = document.createElement('div');
  suggestions.className = 'selection-inline-suggestions';
  suggestions.setAttribute('role', 'group');
  suggestions.setAttribute('aria-label', 'Suggested replacements');

  menu.append(
    selectionBoldBtn,
    selectionItalicBtn,
    selectionLineoverBtn,
    selectionInlineCodeBtn,
    selectionLinkBtn,
    selectionWikiLinkBtn,
    selectionKbdBtn,
    suggestions
  );

  return { menu, suggestions };
};

export const createSelectionMenuController = (
  elements: SelectionMenuElements,
  getEditor: () => any
) => {
  let activeSuggestions: DiagnosticSuggestionMenuItem[] = [];
  let visible = false;
  let lastLayoutKey = '';
  let suppressHideUntil = 0;
  let pendingShowFrame: number | null = null;
  let pendingState: SelectionMenuState | null = null;

  const renderSuggestions = (suggestions: DiagnosticSuggestionMenuItem[] = []): void => {
    activeSuggestions = suggestions.slice(0, 1);
    elements.suggestions.replaceChildren();
    elements.suggestions.hidden = activeSuggestions.length === 0;

    for (let index = 0; index < activeSuggestions.length; index += 1) {
      const suggestion = activeSuggestions[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'selection-inline-suggestion';
      button.dataset.suggestionIndex = String(index);
      button.title = suggestion.text;
      button.textContent = suggestion.text;
      elements.suggestions.appendChild(button);
    }
  };

  const topToolbarBottom = (): number => {
    const toolbar = document.querySelector('.mode-toolbar');
    if (!(toolbar instanceof HTMLElement)) {
      return 0;
    }
    return toolbar.getBoundingClientRect().bottom;
  };

  const hide = (): void => {
    if (pendingShowFrame !== null) {
      window.cancelAnimationFrame(pendingShowFrame);
      pendingShowFrame = null;
    }
    pendingState = null;
    if (!visible && !elements.menu.classList.contains('is-visible')) {
      return;
    }
    visible = false;
    lastLayoutKey = '';
    elements.menu.classList.remove('is-visible');
    elements.menu.classList.remove('is-below');
    elements.menu.setAttribute('aria-hidden', 'true');
    renderSuggestions();
  };

  const layoutMenu = (selectionState: SelectionMenuState): void => {
    const margin = 8;
    const gap = margin;
    const anchorX = selectionState.anchorX ?? 0;
    const anchorY = selectionState.anchorY ?? margin;
    const anchorBottomY = selectionState.anchorBottomY ?? anchorY;

    // Measure while invisible but in the document flow of fixed positioning.
    // Avoid flashing at 0,0: keep previous left/top if any, otherwise park off-screen.
    if (!visible) {
      if (!elements.menu.style.left) {
        elements.menu.style.left = '-10000px';
        elements.menu.style.top = '0px';
      }
      elements.menu.classList.add('is-visible');
      elements.menu.classList.remove('is-below');
    }

    const menuWidth = Math.max(1, elements.menu.offsetWidth);
    const menuHeight = Math.max(1, elements.menu.offsetHeight);
    const rawLeft = selectionState.align === 'center' ? anchorX - (menuWidth / 2) : anchorX;
    const maxLeft = Math.max(margin, window.innerWidth - menuWidth - margin);
    const clampedLeft = Math.min(maxLeft, Math.max(margin, rawLeft));

    // Prefer above the selection; fall back below when the toolbar would clip it.
    // Compute top without CSS translateY so above/below does not thrash transforms.
    const aboveTop = anchorY - gap - menuHeight;
    const shouldPlaceBelow = aboveTop < topToolbarBottom() + gap;
    let top = shouldPlaceBelow ? anchorBottomY + gap : aboveTop;
    const maxTop = Math.max(margin, window.innerHeight - menuHeight - margin);
    top = Math.min(maxTop, Math.max(margin, top));

    const layoutKey = [
      Math.round(clampedLeft),
      Math.round(top),
      shouldPlaceBelow ? 1 : 0,
      selectionState.align ?? 'center',
      activeSuggestions.map((item) => item.text).join('\u001f')
    ].join(':');

    if (visible && layoutKey === lastLayoutKey) {
      return;
    }

    elements.menu.style.left = `${clampedLeft}px`;
    elements.menu.style.top = `${top}px`;
    elements.menu.classList.toggle('is-below', shouldPlaceBelow);
    elements.menu.classList.add('is-visible');
    elements.menu.setAttribute('aria-hidden', 'false');
    visible = true;
    lastLayoutKey = layoutKey;
  };

  const flushPendingShow = (): void => {
    pendingShowFrame = null;
    const selectionState = pendingState;
    pendingState = null;
    if (!selectionState?.visible || selectionState.selecting) {
      hide();
      return;
    }
    renderSuggestions(selectionState.diagnosticSuggestions ?? []);
    layoutMenu(selectionState);
  };

  const update = (selectionState: SelectionMenuState | null): void => {
    // While the user is interacting with the menu itself, don't let editor
    // selection churn hide it out from under the pointer.
    if (Date.now() < suppressHideUntil && elements.menu.matches(':hover')) {
      return;
    }

    if (!selectionState?.visible || selectionState.selecting) {
      hide();
      return;
    }

    pendingState = selectionState;
    if (pendingShowFrame !== null) {
      return;
    }
    // Defer one frame so CM/live decorations can settle and we never paint at 0,0.
    pendingShowFrame = window.requestAnimationFrame(flushPendingShow);
  };

  const noteMenuInteraction = (): void => {
    // Keep menu alive briefly across the click → selection refresh cycle.
    suppressHideUntil = Date.now() + 400;
  };

  const handleAction = (action: string): void => {
    noteMenuInteraction();
    const editor = getEditor();
    if (!editor) return;
    editor.insertFormat(action);
    editor.focus();
  };

  const handleSuggestion = (index: number): void => {
    noteMenuInteraction();
    const editor = getEditor();
    const suggestion = activeSuggestions[index];
    if (!editor || !suggestion) return;
    editor.applyDiagnosticSuggestion(suggestion.from, suggestion.to, suggestion.text);
    hide();
    editor.focus();
  };

  return {
    hide,
    update,
    handleAction,
    handleSuggestion,
    noteMenuInteraction,
    elements,
    isVisible: () => visible
  };
};

export type SelectionMenuController = ReturnType<typeof createSelectionMenuController>;
