import { sendTabMessage } from '@/utils/messaging';
import type {
  GetSelectionCommand,
  GetPageContentCommand,
  ExtMessage,
} from '@/types/messages';

/**
 * Context menu management for the NotePick extension.
 * Creates right-click menu items and routes clicks to content scripts.
 */
export const contextMenus = {
  /**
   * Create the context menu items.
   * Safe to call multiple times — uses removeAll to clear duplicates first.
   */
  create(): void {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'capture-selection',
        title: '保存选区为网页笔记',
        contexts: ['selection'],
      });

      chrome.contextMenus.create({
        id: 'capture-page',
        title: '保存整页为网页笔记',
        contexts: ['page'],
      });
    });
  },

  /**
   * Register the onClicked listener that routes to content scripts.
   * Asks CS to extract selection or page content, then CS sends
   * CAPTURE_SELECTION / CAPTURE_PAGE back to SW for storage.
   */
  registerListener(): void {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (!tab?.id) {
        console.warn('[NotePick] Context menu clicked but no active tab');
        return;
      }

      const tabId = tab.id;

      if (info.menuItemId === 'capture-selection') {
        const command: GetSelectionCommand = { type: 'GET_SELECTION' };
        await sendTabMessage(tabId, command);
      } else if (info.menuItemId === 'capture-page') {
        const command: GetPageContentCommand = { type: 'GET_PAGE_CONTENT' };
        await sendTabMessage(tabId, command);
      }
    });
  },
};
