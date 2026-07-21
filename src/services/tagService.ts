import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import type { Tag } from '@/types';

/**
 * Tag service — handles tag CRUD and uniqueness.
 * Tags are stored as names in note.tags[]; the Tag table is used
 * for uniqueness constraint and autocomplete suggestions.
 */
export const tagService = {
  /**
   * Create a new tag with a unique name.
   * Throws if a tag with the same name already exists.
   */
  async createTag(name: string): Promise<Tag> {
    const existing = await this.getTagByName(name);
    if (existing) {
      throw new Error(`Tag "${name}" already exists`);
    }
    const tag: Tag = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
    };
    await db.tags.add(tag);
    return tag;
  },

  /**
   * Find a tag by its name (case-sensitive).
   */
  async getTagByName(name: string): Promise<Tag | undefined> {
    return db.tags.where('name').equals(name).first();
  },

  /**
   * Get all tags, sorted by creation time ascending.
   */
  async getAllTags(): Promise<Tag[]> {
    const tags = await db.tags.toArray();
    return tags.sort((a, b) => a.createdAt - b.createdAt);
  },

  /**
   * Ensure a tag exists (create if not), return the tag name.
   * Used during note creation to register new tags.
   */
  async ensureTag(name: string): Promise<string> {
    const existing = await this.getTagByName(name);
    if (existing) {
      return existing.name;
    }
    await this.createTag(name);
    return name;
  },
};
