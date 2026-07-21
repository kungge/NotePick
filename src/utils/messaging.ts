import type { ExtMessage, MessageResponse } from '@/types/messages';

/**
 * Send a message to the extension's Service Worker (or other context)
 * and receive a Promise-based response.
 *
 * @param msg - The ExtMessage to send
 * @returns Promise resolving to MessageResponse
 */
export function sendMessage<T = unknown>(msg: ExtMessage): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response: MessageResponse<T>) => {
      resolve(response);
    });
  });
}

/**
 * Send a message to a specific tab's content script.
 *
 * @param tabId - The target tab ID
 * @param msg - The ExtMessage to send
 * @returns Promise resolving to MessageResponse
 */
export function sendTabMessage<T = unknown>(
  tabId: number,
  msg: ExtMessage
): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, msg, (response: MessageResponse<T>) => {
      resolve(response);
    });
  });
}

/**
 * Get the current active tab in the current window.
 * @returns Promise resolving to the active tab, or undefined on error.
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
