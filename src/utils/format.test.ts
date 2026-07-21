import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { relativeTime, truncateText, getDomain, formatDate } from './format';

describe('format utilities', () => {
  // ===== relativeTime =====
  describe('relativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "刚刚" for future timestamp', () => {
      const now = Date.now();
      expect(relativeTime(now + 5000)).toBe('刚刚');
    });

    it('returns "刚刚" for less than 60 seconds ago', () => {
      const now = Date.now();
      expect(relativeTime(now - 30 * 1000)).toBe('刚刚');
    });

    it('returns "X 分钟前" for minutes ago', () => {
      const now = Date.now();
      expect(relativeTime(now - 5 * 60 * 1000)).toBe('5 分钟前');
    });

    it('returns "X 小时前" for hours ago', () => {
      const now = Date.now();
      expect(relativeTime(now - 3 * 60 * 60 * 1000)).toBe('3 小时前');
    });

    it('returns "X 天前" for days ago (within a week)', () => {
      const now = Date.now();
      expect(relativeTime(now - 3 * 24 * 60 * 60 * 1000)).toBe('3 天前');
    });

    it('returns "X 周前" for 7-30 days ago', () => {
      const now = Date.now();
      // 14 days = 2 weeks
      expect(relativeTime(now - 14 * 24 * 60 * 60 * 1000)).toBe('2 周前');
    });

    it('returns "X 个月前" for months ago', () => {
      const now = Date.now();
      // 60 days = 2 months
      expect(relativeTime(now - 60 * 24 * 60 * 60 * 1000)).toBe('2 个月前');
    });

    it('returns "X 年前" for years ago', () => {
      const now = Date.now();
      // 400 days ≈ 1 year
      expect(relativeTime(now - 400 * 24 * 60 * 60 * 1000)).toBe('1 年前');
    });

    it('returns "刚刚" for exactly now', () => {
      const now = Date.now();
      expect(relativeTime(now)).toBe('刚刚');
    });
  });

  // ===== truncateText =====
  describe('truncateText', () => {
    it('returns empty string for empty input', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('returns original text if shorter than maxLength', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('returns original text if exactly maxLength', () => {
      expect(truncateText('hello', 5)).toBe('hello');
    });

    it('truncates and appends ellipsis when longer than maxLength', () => {
      expect(truncateText('hello world', 5)).toBe('hello...');
    });

    it('handles maxLength of 0', () => {
      expect(truncateText('hello', 0)).toBe('...');
    });
  });

  // ===== getDomain =====
  describe('getDomain', () => {
    it('extracts hostname from a simple URL', () => {
      expect(getDomain('https://example.com')).toBe('example.com');
    });

    it('extracts hostname from URL with path', () => {
      expect(getDomain('https://example.com/path/to/page')).toBe('example.com');
    });

    it('extracts hostname from URL with port', () => {
      expect(getDomain('http://localhost:3000/page')).toBe('localhost');
    });

    it('extracts hostname from URL with subdomain', () => {
      expect(getDomain('https://blog.example.com/article/1')).toBe('blog.example.com');
    });

    it('returns empty string for invalid URL', () => {
      expect(getDomain('not-a-url')).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(getDomain('')).toBe('');
    });
  });

  // ===== formatDate =====
  describe('formatDate', () => {
    it('formats a timestamp as YYYY-MM-DD HH:mm', () => {
      // Use a fixed timestamp
      const ts = new Date('2025-06-15T14:30:00').getTime();
      const result = formatDate(ts);
      // Check format pattern
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('pads single-digit month and day with zeros', () => {
      const ts = new Date('2025-01-05T09:05:00').getTime();
      const result = formatDate(ts);
      expect(result).toBe('2025-01-05 09:05');
    });

    it('does not pad double-digit values', () => {
      const ts = new Date('2025-12-25T14:30:00').getTime();
      const result = formatDate(ts);
      expect(result).toBe('2025-12-25 14:30');
    });
  });
});
