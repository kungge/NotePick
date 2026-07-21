/** Toast type determines the visual style */
type ToastType = 'success' | 'error' | 'warning';

/** Duration to show the toast before auto-dismissing (ms) */
const TOAST_DURATION = 3000;

/** Unique ID to prevent duplicate toast containers */
const CONTAINER_ID = '__notepick-toast-host__';

/**
 * Color schemes for each toast type — applied in the Shadow DOM
 * so they are completely isolated from the host page's CSS.
 */
const TOAST_STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: '#f0fdf4',
    border: '#22c55e',
    text: '#15803d',
    icon: '✓',
  },
  error: {
    bg: '#fef2f2',
    border: '#ef4444',
    text: '#dc2626',
    icon: '✕',
  },
  warning: {
    bg: '#fffbeb',
    border: '#f59e0b',
    text: '#d97706',
    icon: '⚠',
  },
};

/**
 * Show a toast notification at the top of the page.
 * Uses Shadow DOM for complete style isolation from the host page.
 * Auto-dismisses after 3 seconds.
 *
 * @param message - The message text to display
 * @param type - Toast style: 'success' | 'error' | 'warning'
 * @param _noteId - Reserved for P1 click-to-edit (not used in MVP)
 */
export function showToast(
  message: string,
  type: ToastType = 'success',
  _noteId?: string
): void {
  // Ensure the host container exists
  const container = ensureContainer();

  // Remove any existing toast element
  const existingToast = container.querySelector('.notepick-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const style = TOAST_STYLES[type];

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'notepick-toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // Build inner HTML — inline styles for Shadow DOM isolation
  toast.innerHTML = `
    <span class="notepick-toast-icon" style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
      background: ${style.border};
      color: #ffffff;
    ">${style.icon}</span>
    <span class="notepick-toast-message" style="
      font-size: 14px;
      font-weight: 500;
      color: ${style.text};
      line-height: 1.4;
      flex: 1;
    ">${escapeHtml(message)}</span>
  `;

  // Apply container styles
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    background: ${style.bg};
    border: 1px solid ${style.border};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 400px;
    width: fit-content;
    margin: 0 auto;
    cursor: default;
    user-select: none;
    animation: notepick-toast-in 0.25s ease forwards;
  `;

  // Add entrance animation keyframes to shadow root
  const styleEl = container.querySelector('style');
  if (styleEl && !styleEl.textContent.includes('notepick-toast-in')) {
    styleEl.textContent += `
      @keyframes notepick-toast-in {
        from { opacity: 0; transform: translateY(-12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes notepick-toast-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-12px); }
      }
    `;
  }

  // Append toast to shadow root
  const shadowRoot = container.shadowRoot;
  if (shadowRoot) {
    shadowRoot.appendChild(toast);

    // Auto-dismiss after TOAST_DURATION
    setTimeout(() => {
      toast.style.animation = 'notepick-toast-out 0.25s ease forwards';
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, TOAST_DURATION);
  }
}

/**
 * Ensure the toast host container exists with a Shadow DOM root.
 * The host is a fixed-position div at the top of the page body.
 */
function ensureContainer(): HTMLElement {
  let container = document.getElementById(CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 0;
      right: 0;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    `;
    document.body.appendChild(container);

    // Attach shadow DOM for style isolation
    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Inject base styles into shadow root
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .notepick-toast {
        pointer-events: auto;
      }
    `;
    shadowRoot.appendChild(styleEl);
  }

  return container;
}

/**
 * Escape HTML special characters in a string for safe insertion into innerHTML.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
