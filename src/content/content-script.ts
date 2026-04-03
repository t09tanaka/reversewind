import { selectionStore } from './selection-store';
import { extractSubtree } from './dom-extractor';
import { convertToOutput } from './tailwind-mapper';
import { generateHtml } from './html-generator';
import { copyToClipboard } from './clipboard';
import { showToast } from './toast';
import { TOAST_MESSAGES, MAX_ELEMENTS } from '../shared/constants';
import type { ReversewindMessage } from '../shared/types';

// 右クリック対象要素を保持
document.addEventListener('contextmenu', (e) => {
  const target = e.target;
  if (target instanceof Element) {
    selectionStore.set(target);
  }
});

// Service Workerからのメッセージを受信
chrome.runtime.onMessage.addListener(
  (message: ReversewindMessage, _sender, sendResponse) => {
    if (message.type !== 'REVERSEWIND_CONVERT') return;

    try {
      const element = selectionStore.get();
      if (!element) {
        showToast(TOAST_MESSAGES.TARGET_NOT_FOUND, 'error');
        sendResponse({ success: false, error: 'target not found' });
        return;
      }

      const extracted = extractSubtree(element, MAX_ELEMENTS);
      const output = convertToOutput(extracted);
      const html = generateHtml(output);

      copyToClipboard(html)
        .then(() => {
          showToast(TOAST_MESSAGES.SUCCESS, 'success');
          sendResponse({ success: true });
        })
        .catch((err) => {
          console.error('[Reversewind] copy failed:', err);
          showToast(TOAST_MESSAGES.COPY_FAILED, 'error');
          sendResponse({ success: false, error: 'copy failed' });
        });

      // 非同期レスポンスのためtrueを返す
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      console.error('[Reversewind] error:', message);

      if (message.includes('too large')) {
        showToast(TOAST_MESSAGES.SUBTREE_TOO_LARGE, 'error');
      } else {
        showToast(TOAST_MESSAGES.COPY_FAILED, 'error');
      }

      sendResponse({ success: false, error: message });
    }
  },
);
