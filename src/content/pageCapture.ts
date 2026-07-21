import { Readability } from '@mozilla/readability';
import type { ReadabilityResult, NoteSource } from '@/types';
import { getDomain } from '@/utils/format';

/** Result of a full page capture */
export interface PageCaptureResult {
  rawHtml: string;
  readability: ReadabilityResult | null;
  extractionFailed: boolean;
  source: NoteSource;
}

/**
 * Capture the full page content:
 * 1. Get the complete page HTML via document.documentElement.outerHTML
 * 2. Clone the document and run Readability on the clone
 * 3. Collect page source metadata
 *
 * If Readability fails (throws or returns null), extractionFailed is set to true
 * and the raw HTML is still stored as a snapshot.
 */
export async function getPageCapture(): Promise<PageCaptureResult> {
  // Get full page HTML
  const rawHtml = document.documentElement.outerHTML;

  // Get page source metadata
  const source = getPageSource();

  // Run Readability on a cloned document to avoid mutating the original page
  let readability: ReadabilityResult | null = null;
  let extractionFailed = false;

  try {
    const docClone = document.cloneNode(true) as Document;
    const reader = new Readability(docClone);
    const article = reader.parse();

    if (article) {
      readability = {
        title: article.title ?? '',
        byline: article.byline ?? null,
        excerpt: article.excerpt ?? null,
        length: article.length ?? 0,
        content: article.content ?? '',
        textContent: article.textContent ?? '',
      };
    } else {
      extractionFailed = true;
    }
  } catch (error) {
    console.warn('[NotePick] Readability extraction failed:', error);
    extractionFailed = true;
  }

  return {
    rawHtml,
    readability,
    extractionFailed,
    source,
  };
}

/**
 * Collect page source metadata: URL, title, domain, favicon.
 */
function getPageSource(): NoteSource {
  const url = window.location.href;
  const title = document.title || '';
  const domain = getDomain(url);

  let favicon: string | undefined;
  const faviconLink = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
  );
  if (faviconLink?.href) {
    favicon = faviconLink.href;
  } else {
    favicon = `${window.location.origin}/favicon.ico`;
  }

  return {
    url,
    title,
    domain,
    favicon,
  };
}
