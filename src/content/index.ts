import { getSelectionCapture } from './selectionCapture';
import { getPageCapture } from './pageCapture';
import { showToast } from './toast';
import { sendMessage } from '@/utils/messaging';
import type {
  ExtMessage,
  MessageResponse,
  CaptureSelectionRequest,
  CapturePageRequest,
} from '@/types/messages';

/**
 * Content Script entry point.
 * Listens for commands from the Service Worker and responds with
 * extracted page content (selections, full page HTML + Readability).
 */
chrome.runtime.onMessage.addListener(
  (
    msg: ExtMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    switch (msg.type) {
      case 'GET_SELECTION':
        handleGetSelection()
          .then(sendResponse)
          .catch((err) => {
            sendResponse({
              success: false,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        return true; // async response

      case 'GET_PAGE_CONTENT':
        handleGetPageContent()
          .then(sendResponse)
          .catch((err) => {
            sendResponse({
              success: false,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        return true; // async response

      case 'SHOW_TOAST':
        showToast(msg.payload.message, msg.payload.type, msg.payload.noteId);
        sendResponse({ success: true });
        return false; // sync response

      default:
        sendResponse({ success: false, error: `Unknown command: ${msg.type}` });
        return false;
    }
  }
);

/**
 * Handle GET_SELECTION command:
 * 1. Extract the current text selection + HTML + context
 * 2. If selection is empty, show a warning toast
 * 3. Otherwise, send CAPTURE_SELECTION message to SW for storage
 */
async function handleGetSelection(): Promise<MessageResponse> {
  const capture = getSelectionCapture();

  if (!capture) {
    // No selection — show warning toast
    showToast('请先选中要采集的内容', 'warning');
    return { success: false, error: '选区为空' };
  }

  // Build the CAPTURE_SELECTION message and send to SW
  const request: CaptureSelectionRequest = {
    type: 'CAPTURE_SELECTION',
    payload: {
      text: capture.text,
      html: capture.html,
      title: capture.title,
      source: {
        url: capture.source.url,
        title: capture.source.title,
        domain: capture.source.domain,
        favicon: capture.source.favicon,
        selectionContext: capture.source.selectionContext ?? { before: '', after: '' },
      },
    },
  };

  const response = await sendMessage<unknown>(request);

  if (response.success) {
    showToast('✓ 已保存', 'success');
  } else {
    showToast('保存失败: ' + (response.error || '未知错误'), 'error');
  }

  return response;
}

/**
 * Handle GET_PAGE_CONTENT command:
 * 1. Capture the full page HTML
 * 2. Run Readability on a cloned document
 * 3. Send CAPTURE_PAGE message to SW for storage
 */
async function handleGetPageContent(): Promise<MessageResponse> {
  const capture = await getPageCapture();

  // Build the CAPTURE_PAGE message and send to SW
  const request: CapturePageRequest = {
    type: 'CAPTURE_PAGE',
    payload: {
      rawHtml: capture.rawHtml,
      readability: capture.readability,
      extractionFailed: capture.extractionFailed,
      source: {
        url: capture.source.url,
        title: capture.source.title,
        domain: capture.source.domain,
        favicon: capture.source.favicon,
      },
    },
  };

  const response = await sendMessage<unknown>(request);

  if (response.success) {
    if (capture.extractionFailed) {
      showToast('已保存原始快照（正文提取失败）', 'warning');
    } else {
      const wordCount = capture.readability?.textContent?.length ?? 0;
      showToast(`✓ 整页已保存（正文 ${wordCount} 字）`, 'success');
    }
  } else {
    showToast('保存失败: ' + (response.error || '未知错误'), 'error');
  }

  return response;
}
