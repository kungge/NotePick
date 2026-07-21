// ===== Enum Types =====
export type NoteType = 'selection' | 'page';

// ===== Nested Data Structures =====

/** Context surrounding a text selection (100 chars before/after) */
export interface SelectionContext {
  /** 100 characters before the selection start */
  before: string;
  /** 100 characters after the selection end */
  after: string;
}

/** Result from @mozilla/readability parse() */
export interface ReadabilityResult {
  title: string;
  byline: string | null;
  excerpt: string | null;
  length: number;
  /** Readability extracted HTML */
  content: string;
  /** Readability extracted plain text */
  textContent: string;
}

/** Content payload of a note */
export interface NoteContent {
  /** Plain text (selection text or Readability textContent) */
  text: string;
  /** HTML (selection HTML or Readability content HTML) */
  html: string;
  /** Only type=page: full page snapshot */
  rawHtml?: string;
  /** Only type=page: full Readability result object */
  readability?: ReadabilityResult;
}

/** Source metadata of the page where the note was captured */
export interface NoteSource {
  url: string;
  title: string;
  domain: string;
  favicon?: string;
  /** Only type=selection */
  selectionContext?: SelectionContext;
}

// ===== Core Entities =====

/** A web note — the central data model */
export interface Note {
  /** UUID v4 */
  id: string;
  type: NoteType;
  /** Editable title */
  title: string;
  content: NoteContent;
  /** Personal annotation, editable */
  annotation: string;
  source: NoteSource;
  /** Tag name array (not IDs — simplifies display & search) */
  tags: string[];
  /** Only type=page: whether Readability extraction failed */
  extractionFailed?: boolean;
  /** Millisecond timestamp */
  createdAt: number;
  updatedAt: number;
  /** Soft delete timestamp, null = active */
  deletedAt: number | null;
}

/** Tag entity — used for uniqueness constraint and autocomplete */
export interface Tag {
  /** UUID v4 */
  id: string;
  /** Unique tag name */
  name: string;
  /** Reserved for P1 */
  color?: string;
  createdAt: number;
}

// ===== Input Types =====

export interface CreateNoteInput {
  type: NoteType;
  title: string;
  content: NoteContent;
  source: NoteSource;
  extractionFailed?: boolean;
  tags?: string[];
}

export interface NoteUpdateInput {
  title?: string;
  annotation?: string;
  tags?: string[];
  updatedAt?: number;
}

// ===== Search Types =====

export interface SearchResult {
  note: Note;
  /** Field names that matched: 'title', 'content.text', 'annotation', 'source.title' */
  matchedFields: string[];
  /** Field → snippet with highlight markup */
  snippets: Record<string, string>;
}
