import { contextMenus } from './contextMenus';
import { registerMessageHandler } from './messageHandler';

/**
 * Service Worker entry point.
 * Registers all event listeners on install/startup and on module load.
 *
 * SW may be suspended by the browser after ~30s of inactivity.
 * Top-level listener registrations here are re-executed when the SW
 * module is re-imported after wake-up, ensuring all listeners are active.
 */

// Initialize on first install and on browser startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('[NotePick] Extension installed/updated');
  contextMenus.create();
  contextMenus.registerListener();
  registerMessageHandler();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[NotePick] Browser startup');
  contextMenus.create();
  contextMenus.registerListener();
  registerMessageHandler();
});

// Also register immediately when SW module loads (handles wake-up)
contextMenus.registerListener();
registerMessageHandler();
