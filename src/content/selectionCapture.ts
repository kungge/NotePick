import type { SelectionContext, NoteSource } from '@/types';
import { getDomain } from '@/utils/format';

/** Result of a selection capture */
export interface SelectionCaptureResult {
  text: string;
  html: string;
  title: string;
  source: NoteSource;
}

/** Maximum number of characters to capture before/after the selection for context */
const CONTEXT_LENGTH = 100;

/** Maximum length of the auto-generated title */
const TITLE_MAX_LENGTH = 30;

/**
 * Extract the current user text selection from the page.
 * Returns null if no selection exists.
 *
 * Extracts:
 * - Selected text (plain)
 * - Selected HTML (via Range.cloneContents)
 * - Auto-generated title (first 30 chars of selection)
 * - Page source metadata (URL, title, domain, favicon)
 * - Selection context (100 chars before/after)
 */
export function getSelectionCapture(): SelectionCaptureResult | null {
  const selection = window.getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const text = selection.toString().trim();

  if (!text) {
    return null;
  }

  // Clone the selection contents to get HTML
  const fragment = range.cloneContents();
  const div = document.createElement('div');
  div.appendChild(fragment);
  const html = div.innerHTML;

  // Auto-generate title from selection text (first 30 chars)
  const title = text.length > TITLE_MAX_LENGTH
    ? text.slice(0, TITLE_MAX_LENGTH) + '...'
    : text;

  // Extract context (100 chars before/after selection)
  const selectionContext = extractContext(range);

  // Get page metadata
  const source = getPageSource(selectionContext);

  return {
    text,
    html,
    title,
    source,
  };
}

/**
 * Extract ~100 characters of text before and after the selection range.
 */
function extractContext(range: Range): SelectionContext {
  const before: string = getTextBeforeRange(range, CONTEXT_LENGTH);
  const after: string = getTextAfterRange(range, CONTEXT_LENGTH);
  return { before, after };
}

/**
 * Get text content before the selection range, up to `maxLen` characters.
 */
function getTextBeforeRange(range: Range, maxLen: number): string {
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;

  let text = '';

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const fullText = startContainer.textContent || '';
    text = fullText.slice(Math.max(0, startOffset - maxLen), startOffset);
  } else {
    // For element nodes, walk backwards through siblings
    let node: Node | null = startContainer;
    let offset = startOffset;
    const parts: string[] = [];

    while (node && parts.join('').length < maxLen) {
      if (node.nodeType === Node.TEXT_NODE) {
        const fullText = node.textContent || '';
        const sliceEnd = node === startContainer ? offset : fullText.length;
        const sliceStart = Math.max(0, sliceEnd - (maxLen - parts.join('').length));
        parts.unshift(fullText.slice(sliceStart, sliceEnd));
      }
      // Move to previous node (depth-first reverse traversal)
      if (node.previousSibling) {
        node = node.previousSibling;
        // Go to the deepest last child
        while (node.lastChild) {
          node = node.lastChild;
        }
      } else {
        node = node.parentNode;
      }
    }

    text = parts.join('');
  }

  return text.trim().slice(-maxLen);
}

/**
 * Get text content after the selection range, up to `maxLen` characters.
 */
function getTextAfterRange(range: Range, maxLen: number): string {
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;

  let text = '';

  if (endContainer.nodeType === Node.TEXT_NODE) {
    const fullText = endContainer.textContent || '';
    text = fullText.slice(endOffset, endOffset + maxLen);
  } else {
    // For element nodes, walk forwards through siblings
    let node: Node | null = endContainer;
    let offset = endOffset;
    const parts: string[] = [];

    while (node && parts.join('').length < maxLen) {
      if (node.nodeType === Node.TEXT_NODE) {
        const fullText = node.textContent || '';
        const sliceStart = node === endContainer ? offset : 0;
        const remaining = maxLen - parts.join('').length;
        parts.push(fullText.slice(sliceStart, sliceStart + remaining));
      }
      // Move to next node (depth-first forward traversal)
      if (node.firstChild) {
        node = node.firstChild;
      } else if (node.nextSibling) {
        node = node.nextSibling;
      } else {
        // Go up to parent and then to next sibling
        let parent: Node | null = node.parentNode;
        while (parent && !parent.nextSibling) {
          parent = parent.parentNode;
        }
        node = parent?.nextSibling ?? null;
      }
    }

    text = parts.join('');
  }

  return text.trim().slice(0, maxLen);
}

/**
 * Collect page source metadata: URL, title, domain, favicon.
 */
function getPageSource(selectionContext?: SelectionContext): NoteSource {
  const url = window.location.href;
  const title = document.title || '';
  const domain = getDomain(url);

  // Try to find favicon
  let favicon: string | undefined;
  const faviconLink = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (faviconLink?.href) {
    favicon = faviconLink.href;
  } else {
    // Default favicon path
    favicon = `${window.location.origin}/favicon.ico`;
  }

  const source: NoteSource = {
    url,
    title,
    domain,
    favicon,
  };

  if (selectionContext) {
    source.selectionContext = selectionContext;
  }

  return source;
}
