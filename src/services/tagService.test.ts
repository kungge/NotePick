import { describe, it, expect, beforeEach } from 'vitest';
import { tagService } from './tagService';
import { db } from './db';

describe('tagService', () => {
  beforeEach(async () => {
    await db.notes.clear();
    await db.tags.clear();
  });

  // ===== createTag =====
  describe('createTag', () => {
    it('creates a tag and returns it with generated fields', async () => {
      const tag = await tagService.createTag('javascript');

      expect(tag.id).toBeDefined();
      expect(tag.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(tag.name).toBe('javascript');
      expect(tag.createdAt).toBeGreaterThan(0);
    });

    it('persists the tag in the database', async () => {
      await tagService.createTag('vue');
      const fetched = await tagService.getTagByName('vue');
      expect(fetched).toBeDefined();
      expect(fetched!.name).toBe('vue');
    });

    it('throws an error when creating a duplicate tag', async () => {
      await tagService.createTag('typescript');
      await expect(tagService.createTag('typescript')).rejects.toThrow(
        'Tag "typescript" already exists'
      );
    });
  });

  // ===== getTagByName =====
  describe('getTagByName', () => {
    it('returns a tag by its name', async () => {
      await tagService.createTag('react');
      const tag = await tagService.getTagByName('react');
      expect(tag).toBeDefined();
      expect(tag!.name).toBe('react');
    });

    it('returns undefined for non-existent name', async () => {
      const tag = await tagService.getTagByName('nonexistent');
      expect(tag).toBeUndefined();
    });

    it('is case-sensitive', async () => {
      await tagService.createTag('JavaScript');
      // Exact case match
      expect(await tagService.getTagByName('JavaScript')).toBeDefined();
      // Different case should not match
      expect(await tagService.getTagByName('javascript')).toBeUndefined();
    });
  });

  // ===== getAllTags =====
  describe('getAllTags', () => {
    it('returns empty array when no tags exist', async () => {
      const tags = await tagService.getAllTags();
      expect(tags).toEqual([]);
    });

    it('returns all tags sorted by createdAt ascending', async () => {
      const t1 = await tagService.createTag('first');
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const t2 = await tagService.createTag('second');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const t3 = await tagService.createTag('third');

      const tags = await tagService.getAllTags();
      expect(tags).toHaveLength(3);
      expect(tags[0].id).toBe(t1.id);
      expect(tags[1].id).toBe(t2.id);
      expect(tags[2].id).toBe(t3.id);
    });
  });

  // ===== ensureTag =====
  describe('ensureTag', () => {
    it('creates a new tag if it does not exist and returns the name', async () => {
      const name = await tagService.ensureTag('newtag');
      expect(name).toBe('newtag');

      // Verify it was actually created
      const tag = await tagService.getTagByName('newtag');
      expect(tag).toBeDefined();
      expect(tag!.name).toBe('newtag');
    });

    it('returns the existing tag name without creating a duplicate', async () => {
      await tagService.createTag('existing');
      const name = await tagService.ensureTag('existing');
      expect(name).toBe('existing');

      // Verify no duplicate was created
      const tags = await tagService.getAllTags();
      expect(tags).toHaveLength(1);
    });

    it('does not throw when ensuring an existing tag', async () => {
      await tagService.createTag('safe-tag');
      await expect(tagService.ensureTag('safe-tag')).resolves.toBe('safe-tag');
    });
  });
});
