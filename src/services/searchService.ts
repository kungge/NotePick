import type { Note, SearchResult } from '@/types';

/**
 * Escape HTML special characters to prevent XSS when rendering snippets.
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
 * Highlight occurrences of `keyword` in `text` by wrapping them in <mark> tags.
 * Case-insensitive matching. Returns safe HTML.
 */
function highlight(text: string, keyword: string): string {
  if (!keyword || !text) {
    return escapeHtml(text);
  }
  const escapedText = escapeHtml(text);
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract a snippet around the first match of keyword in text.
 * Returns ~120 characters centered on the match.
 */
function extractSnippet(text: string, keyword: string): string {
  if (!text || !keyword) return '';
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerKeyword);
  if (matchIndex === -1) return '';

  const snippetRadius = 60;
  const start = Math.max(0, matchIndex - snippetRadius);
  const end = Math.min(text.length, matchIndex + keyword.length + snippetRadius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return prefix + text.slice(start, end) + suffix;
}

/**
 * Search service — performs in-memory substring matching on loaded notes.
 * Searches across: title, content.text, annotation, source.title.
 */
export const searchService = {
  /**
   * Search notes for a keyword. Returns matching notes with highlighted snippets.
   * Case-insensitive substring matching.
   */
  search(query: string, notes: Note[]): SearchResult[] {
    if (!query || !query.trim()) return [];

    const keyword = query.trim();
    const results: SearchResult[] = [];

    for (const note of notes) {
      if (note.deletedAt !== null) continue;

      const matchedFields: string[] = [];
      const snippets: Record<string, string> = {};

      // Check title
      if (note.title.toLowerCase().includes(keyword.toLowerCase())) {
        matchedFields.push('title');
        snippets['title'] = highlight(note.title, keyword);
      }

      // Check content.text
      const contentText = note.content.text;
      if (contentText && contentText.toLowerCase().includes(keyword.toLowerCase())) {
        matchedFields.push('content.text');
        const snippet = extractSnippet(contentText, keyword);
        snippets['content.text'] = highlight(snippet, keyword);
      }

      // Check annotation
      const annotation = note.annotation;
      if (annotation && annotation.toLowerCase().includes(keyword.toLowerCase())) {
        matchedFields.push('annotation');
        snippets['annotation'] = highlight(extractSnippet(annotation, keyword), keyword);
      }

      // Check source.title
      const sourceTitle = note.source.title;
      if (sourceTitle && sourceTitle.toLowerCase().includes(keyword.toLowerCase())) {
        matchedFields.push('source.title');
        snippets['source.title'] = highlight(sourceTitle, keyword);
      }

      if (matchedFields.length > 0) {
        results.push({
          note,
          matchedFields,
          snippets,
        });
      }
    }

    // Sort by number of matched fields descending, then by createdAt descending
    results.sort((a, b) => {
      if (b.matchedFields.length !== a.matchedFields.length) {
        return b.matchedFields.length - a.matchedFields.length;
      }
      return b.note.createdAt - a.note.createdAt;
    });

    return results;
  },

  /**
   * Generate highlighted HTML for a single text + keyword pair.
   */
  highlight(text: string, keyword: string): string {
    return highlight(text, keyword);
  },
};
