import { noteService } from '@/services/noteService';
import { sendTabMessage } from '@/utils/messaging';
import type {
  ExtMessage,
  MessageResponse,
  CaptureSelectionRequest,
  CapturePageRequest,
  ShowToastCommand,
} from '@/types/messages';
import type { CreateNoteInput, Note } from '@/types';

/**
 * Message handler — the routing hub for the Service Worker.
 * Receives messages from Content Scripts and Popup, dispatches to services.
 *
 * Context menu clicks and keyboard shortcuts are handled separately
 * (see contextMenus.ts and the commands listener in index.ts).
 */
export const messageHandler = {
  /**
   * Handle an incoming runtime message from any context.
   */
  async handleMessage(
    msg: ExtMessage,
    _sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse<Note | undefined>> {
    switch (msg.type) {
      case 'CAPTURE_SELECTION':
        return this.handleCaptureSelection(msg as CaptureSelectionRequest);

      case 'CAPTURE_PAGE':
        return this.handleCapturePage(msg as CapturePageRequest);

      case 'TRIGGER_SELECTION_CAPTURE': {
        // Popup triggered selection capture — forward to CS
        if ('tabId' in msg) {
          const command: ExtMessage = { type: 'GET_SELECTION' };
          await sendTabMessage(msg.tabId, command);
        }
        return { success: true };
      }

      case 'TRIGGER_PAGE_CAPTURE': {
        // Popup triggered page capture — forward to CS
        if ('tabId' in msg) {
          const command: ExtMessage = { type: 'GET_PAGE_CONTENT' };
          await sendTabMessage(msg.tabId, command);
        }
        return { success: true };
      }

      case 'OPEN_MANAGER': {
        chrome.runtime.openOptionsPage();
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown message type: ${msg.type}` };
    }
  },

  /**
   * Handle a selection capture request from CS.
   * Creates a note in IndexedDB.
   */
  async handleCaptureSelection(
    msg: CaptureSelectionRequest
  ): Promise<MessageResponse<Note>> {
    try {
      const payload = msg.payload;

      const input: CreateNoteInput = {
        type: 'selection',
        title: payload.title,
        content: {
          text: payload.text,
          html: payload.html,
        },
        source: {
          url: payload.source.url,
          title: payload.source.title,
          domain: payload.source.domain,
          favicon: payload.source.favicon,
          selectionContext: payload.source.selectionContext,
        },
        tags: [],
      };

      const note = await noteService.createNote(input);
      return { success: true, data: note };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[NotePick] Capture selection failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Handle a full page capture request from CS.
   * Creates a note with Readability result (or raw HTML if extraction failed).
   */
  async handleCapturePage(
    msg: CapturePageRequest
  ): Promise<MessageResponse<Note>> {
    try {
      const payload = msg.payload;

      const input: CreateNoteInput = {
        type: 'page',
        title: payload.readability?.title || payload.source.title || 'Untitled',
        content: {
          text: payload.readability?.textContent || '',
          html: payload.readability?.content || '',
          rawHtml: payload.rawHtml,
          readability: payload.readability ?? undefined,
        },
        source: {
          url: payload.source.url,
          title: payload.source.title,
          domain: payload.source.domain,
          favicon: payload.source.favicon,
        },
        extractionFailed: payload.extractionFailed,
        tags: [],
      };

      const note = await noteService.createNote(input);
      return { success: true, data: note };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[NotePick] Capture page failed:', errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Show a toast notification in the active tab's content script.
   */
  async showToast(
    tabId: number,
    message: string,
    type: 'success' | 'error' | 'warning' = 'success',
    noteId?: string
  ): Promise<void> {
    const command: ShowToastCommand = {
      type: 'SHOW_TOAST',
      payload: { message, type, noteId },
    };
    await sendTabMessage(tabId, command);
  },
};

/**
 * Register SW-side listeners: runtime messages + keyboard shortcuts.
 * Context menu handling is registered separately in contextMenus.ts.
 */
export function registerMessageHandler(): void {
  // Runtime messages from CS and Popup
  chrome.runtime.onMessage.addListener(
    (
      msg: ExtMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse) => void
    ) => {
      messageHandler.handleMessage(msg, sender).then(sendResponse);
      return true; // async response
    }
  );

  // Keyboard shortcuts
  chrome.commands.onCommand.addListener(async (command: string) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const tabId = tab.id;

    if (command === 'capture-selection') {
      const msg: ExtMessage = { type: 'GET_SELECTION' };
      await sendTabMessage(tabId, msg);
    } else if (command === 'capture-page') {
      const msg: ExtMessage = { type: 'GET_PAGE_CONTENT' };
      await sendTabMessage(tabId, msg);
    } else if (command === 'open-manager') {
      chrome.runtime.openOptionsPage();
    }
  });
}
