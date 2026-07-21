/**
 * Highlight utility — wraps matched keywords in <mark> tags.
 * Used for search result snippets in the Manager UI.
 */

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Highlight all occurrences of `keyword` in `text` by wrapping them in <mark> tags.
 * Case-insensitive matching. Returns safe HTML string for use with v-html.
 *
 * @param text - The source text to highlight in
 * @param keyword - The keyword to highlight
 * @returns Safe HTML string with <mark> wrapped matches
 */
export function highlightText(text: string, keyword: string): string {
  if (!text) return '';
  if (!keyword || !keyword.trim()) return escapeHtml(text);

  const escapedText = escapeHtml(text);
  // Escape regex special chars in keyword
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract a snippet of text around the first match of keyword.
 *
 * @param text - Full text to search in
 * @param keyword - Keyword to find
 * @param radius - Characters to include on each side (default 60)
 * @returns Snippet string with ellipsis if truncated
 */
export function extractSnippet(text: string, keyword: string, radius = 60): string {
  if (!text || !keyword) return '';

  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerKeyword);

  if (matchIndex === -1) return '';

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + keyword.length + radius);

  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return prefix + text.slice(start, end) + suffix;
}

/**
 * Highlight a snippet extracted from text around a keyword match.
 * Combines extractSnippet + highlightText in one call.
 *
 * @param text - Full text
 * @param keyword - Keyword to search for
 * @returns Highlighted snippet HTML
 */
export function highlightSnippet(text: string, keyword: string): string {
  const snippet = extractSnippet(text, keyword);
  return highlightText(snippet, keyword);
}
