import { describe, it, expect } from 'vitest';
import { highlightText, extractSnippet, highlightSnippet } from './highlight';

describe('highlight utilities', () => {
  // ===== highlightText =====
  describe('highlightText', () => {
    it('returns empty string for empty text', () => {
      expect(highlightText('', 'keyword')).toBe('');
    });

    it('returns escaped text when keyword is empty', () => {
      expect(highlightText('hello world', '')).toBe('hello world');
    });

    it('returns escaped text when keyword is whitespace only', () => {
      expect(highlightText('hello world', '   ')).toBe('hello world');
    });

    it('wraps a single match in <mark> tags', () => {
      expect(highlightText('hello world', 'world')).toBe('hello <mark>world</mark>');
    });

    it('wraps multiple occurrences in <mark> tags', () => {
      expect(highlightText('foo bar foo', 'foo')).toBe('<mark>foo</mark> bar <mark>foo</mark>');
    });

    it('matches case-insensitively', () => {
      expect(highlightText('Hello WORLD', 'hello')).toBe('<mark>Hello</mark> WORLD');
      expect(highlightText('Hello WORLD', 'world')).toBe('Hello <mark>WORLD</mark>');
    });

    it('escapes HTML special characters in text', () => {
      expect(highlightText('<script>alert(1)</script>', 'alert')).toBe(
        '&lt;script&gt;<mark>alert</mark>(1)&lt;/script&gt;'
      );
    });

    it('escapes ampersand in text', () => {
      expect(highlightText('a & b', 'b')).toBe('a &amp; <mark>b</mark>');
    });

    it('treats regex special characters in keyword as literals', () => {
      expect(highlightText('price: $50 (test)', '$50')).toBe('price: <mark>$50</mark> (test)');
      expect(highlightText('a.b.c', '.b.')).toBe('a<mark>.b.</mark>c');
    });

    it('preserves original case in highlighted output', () => {
      expect(highlightText('JavaScript is great', 'javascript')).toBe(
        '<mark>JavaScript</mark> is great'
      );
    });
  });

  // ===== extractSnippet =====
  describe('extractSnippet', () => {
    it('returns empty string for empty text', () => {
      expect(extractSnippet('', 'keyword')).toBe('');
    });

    it('returns empty string for empty keyword', () => {
      expect(extractSnippet('some text', '')).toBe('');
    });

    it('returns empty string when keyword not found', () => {
      expect(extractSnippet('hello world', 'foo')).toBe('');
    });

    it('returns snippet with prefix ellipsis when match is not at start', () => {
      const longText = 'a'.repeat(100) + 'keyword' + 'b'.repeat(100);
      const snippet = extractSnippet(longText, 'keyword');
      expect(snippet.startsWith('...')).toBe(true);
      expect(snippet.endsWith('...')).toBe(true);
      expect(snippet).toContain('keyword');
    });

    it('returns snippet without prefix ellipsis when match is at start', () => {
      const text = 'keyword' + 'b'.repeat(100);
      const snippet = extractSnippet(text, 'keyword');
      expect(snippet.startsWith('...')).toBe(false);
      expect(snippet.endsWith('...')).toBe(true);
      expect(snippet.startsWith('keyword')).toBe(true);
    });

    it('returns snippet without suffix ellipsis when match is at end', () => {
      const text = 'a'.repeat(100) + 'keyword';
      const snippet = extractSnippet(text, 'keyword');
      expect(snippet.startsWith('...')).toBe(true);
      expect(snippet.endsWith('...')).toBe(false);
      expect(snippet.endsWith('keyword')).toBe(true);
    });

    it('returns full text without ellipsis when text is short', () => {
      const text = 'hello keyword world';
      const snippet = extractSnippet(text, 'keyword');
      expect(snippet).toBe('hello keyword world');
    });

    it('matches case-insensitively', () => {
      const snippet = extractSnippet('Hello KEYWORD world', 'keyword');
      expect(snippet).toContain('KEYWORD');
    });

    it('respects custom radius parameter', () => {
      const text = 'a'.repeat(200) + 'keyword' + 'b'.repeat(200);
      const snippet = extractSnippet(text, 'keyword', 10);
      // snippet = '...' + 10 chars before + 'keyword' + 10 chars after + '...'
      expect(snippet).toContain('...');
      // The slice content (without ellipsis) should be 10 + 7 + 10 = 27 chars
      const content = snippet.replace(/\.\.\./g, '');
      expect(content.length).toBe(27);
    });
  });

  // ===== highlightSnippet =====
  describe('highlightSnippet', () => {
    it('returns empty string for empty text', () => {
      expect(highlightSnippet('', 'keyword')).toBe('');
    });

    it('returns empty string when keyword not found', () => {
      expect(highlightSnippet('hello world', 'foo')).toBe('');
    });

    it('extracts snippet and wraps keyword in <mark>', () => {
      const text = 'hello keyword world';
      const result = highlightSnippet(text, 'keyword');
      expect(result).toContain('<mark>keyword</mark>');
    });

    it('combines snippet extraction with highlighting for long text', () => {
      const longText = 'a'.repeat(100) + 'findme' + 'b'.repeat(100);
      const result = highlightSnippet(longText, 'findme');
      expect(result).toContain('<mark>findme</mark>');
      expect(result).toContain('...');
    });

    it('escapes HTML in the snippet', () => {
      const text = '<b>findme</b>';
      const result = highlightSnippet(text, 'findme');
      expect(result).toContain('&lt;b&gt;');
      expect(result).toContain('<mark>findme</mark>');
    });
  });
});
