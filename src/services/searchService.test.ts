import { describe, it, expect } from 'vitest';
import { searchService } from './searchService';
import type { Note } from '@/types';

// Helper: create a minimal note for testing
function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'test-id-' + Math.random().toString(36).slice(2),
    type: 'selection',
    title: 'Default Title',
    content: { text: 'Default content', html: '<p>Default content</p>' },
    annotation: '',
    source: { url: 'https://example.com', title: 'Example Page', domain: 'example.com' },
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
    ...overrides,
  };
}

describe('searchService', () => {
  // ===== search =====
  describe('search', () => {
    it('returns empty array for empty query', () => {
      const notes = [makeNote({ title: 'Hello' })];
      expect(searchService.search('', notes)).toEqual([]);
    });

    it('returns empty array for whitespace-only query', () => {
      const notes = [makeNote({ title: 'Hello' })];
      expect(searchService.search('   ', notes)).toEqual([]);
    });

    it('matches by title substring', () => {
      const notes = [
        makeNote({ id: 'n1', title: 'JavaScript Guide' }),
        makeNote({ id: 'n2', title: 'Python Tutorial' }),
      ];
      const results = searchService.search('script', notes);
      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('n1');
      expect(results[0].matchedFields).toContain('title');
    });

    it('matches by content.text substring', () => {
      const notes = [
        makeNote({ id: 'n1', content: { text: 'The quick brown fox', html: '<p>The quick brown fox</p>' } }),
      ];
      const results = searchService.search('brown', notes);
      expect(results).toHaveLength(1);
      expect(results[0].matchedFields).toContain('content.text');
    });

    it('matches by annotation substring', () => {
      const notes = [
        makeNote({ id: 'n1', annotation: 'Important note about caching' }),
      ];
      const results = searchService.search('caching', notes);
      expect(results).toHaveLength(1);
      expect(results[0].matchedFields).toContain('annotation');
    });

    it('matches by source.title substring', () => {
      const notes = [
        makeNote({ id: 'n1', source: { url: 'https://github.com', title: 'GitHub Repository', domain: 'github.com' } }),
      ];
      const results = searchService.search('github', notes);
      expect(results).toHaveLength(1);
      expect(results[0].matchedFields).toContain('source.title');
    });

    it('performs case-insensitive matching', () => {
      const notes = [
        makeNote({ id: 'n1', title: 'JavaScript Guide' }),
      ];
      const results = searchService.search('JAVASCRIPT', notes);
      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('n1');
    });

    it('matches across multiple fields', () => {
      const notes = [
        makeNote({
          id: 'n1',
          title: 'Vue Tutorial',
          content: { text: 'Learn Vue basics', html: '<p>Learn Vue basics</p>' },
          annotation: 'Vue is awesome',
          source: { url: 'https://vuejs.org', title: 'Vue.js Official', domain: 'vuejs.org' },
        }),
      ];
      const results = searchService.search('vue', notes);
      expect(results).toHaveLength(1);
      expect(results[0].matchedFields).toContain('title');
      expect(results[0].matchedFields).toContain('content.text');
      expect(results[0].matchedFields).toContain('annotation');
      expect(results[0].matchedFields).toContain('source.title');
    });

    it('excludes soft-deleted notes', () => {
      const notes = [
        makeNote({ id: 'n1', title: 'Active Note', deletedAt: null }),
        makeNote({ id: 'n2', title: 'Deleted Note', deletedAt: Date.now() }),
      ];
      const results = searchService.search('note', notes);
      expect(results).toHaveLength(1);
      expect(results[0].note.id).toBe('n1');
    });

    it('returns empty array when no notes match', () => {
      const notes = [
        makeNote({ id: 'n1', title: 'Hello World' }),
        makeNote({ id: 'n2', title: 'Foo Bar' }),
      ];
      expect(searchService.search('nonexistent', notes)).toEqual([]);
    });

    it('sorts results by matchedFields count descending', () => {
      const baseTime = Date.now();
      const notes = [
        // Matches only in title
        makeNote({ id: 'n1', title: 'test', createdAt: baseTime + 100 }),
        // Matches in title + annotation
        makeNote({
          id: 'n2',
          title: 'test',
          annotation: 'test annotation',
          createdAt: baseTime,
        }),
      ];
      const results = searchService.search('test', notes);
      expect(results).toHaveLength(2);
      // n2 has 2 matched fields, n1 has 1 → n2 first
      expect(results[0].note.id).toBe('n2');
      expect(results[1].note.id).toBe('n1');
    });

    it('sorts by createdAt descending when matchedFields count is equal', () => {
      const baseTime = Date.now();
      const notes = [
        makeNote({ id: 'n1', title: 'test', createdAt: baseTime }),
        makeNote({ id: 'n2', title: 'test', createdAt: baseTime + 1000 }),
      ];
      const results = searchService.search('test', notes);
      expect(results).toHaveLength(2);
      // Both have 1 matched field, n2 is newer → n2 first
      expect(results[0].note.id).toBe('n2');
      expect(results[1].note.id).toBe('n1');
    });

    it('includes snippets for matched fields', () => {
      const notes = [
        makeNote({ id: 'n1', title: 'JavaScript Guide' }),
      ];
      const results = searchService.search('script', notes);
      expect(results[0].snippets['title']).toBeDefined();
      expect(results[0].snippets['title']).toContain('<mark>');
    });

    it('returns empty array for empty notes array', () => {
      expect(searchService.search('anything', [])).toEqual([]);
    });
  });

  // ===== highlight =====
  describe('highlight', () => {
    it('wraps matched keyword in <mark> tags', () => {
      expect(searchService.highlight('hello world', 'world')).toBe('hello <mark>world</mark>');
    });

    it('matches case-insensitively', () => {
      expect(searchService.highlight('Hello WORLD', 'hello')).toBe('<mark>Hello</mark> WORLD');
    });

    it('returns escaped text when keyword is empty', () => {
      expect(searchService.highlight('hello world', '')).toBe('hello world');
    });

    it('escapes HTML special characters in text', () => {
      expect(searchService.highlight('<b>test</b>', 'test')).toBe(
        '&lt;b&gt;<mark>test</mark>&lt;/b&gt;'
      );
    });

    it('wraps multiple occurrences', () => {
      expect(searchService.highlight('foo bar foo', 'foo')).toBe(
        '<mark>foo</mark> bar <mark>foo</mark>'
      );
    });

    it('treats regex special chars in keyword as literals', () => {
      expect(searchService.highlight('cost: $100', '$100')).toBe('cost: <mark>$100</mark>');
    });
  });
});
