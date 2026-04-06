import { selectionStore } from './selection-store';
import { findMeaningfulAncestor } from './bubble-up';
import { extractSubtree } from './dom-extractor';
import { convertToOutput } from './tailwind-mapper';
import { generateHtml } from './html-generator';
import { copyToClipboard } from './clipboard';
import { showToast } from './toast';
import {
  TOAST_MESSAGES,
  TOAST_DURATION,
  MAX_ELEMENTS,
} from '../shared/constants';
import type { ReversewindMessage } from '../shared/types';

// 右クリック対象要素を保持
document.addEventListener('contextmenu', (e) => {
  const target = e.target;
  if (target instanceof Element) {
    selectionStore.set(findMeaningfulAncestor(target));
  }
});

/**
 * 対象要素を一時的にハイライトする（オーバーレイ方式）
 * 元ページの要素スタイルを変更せず、上に被せるdivで表現する
 */
function highlightElement(element: Element): () => void {
  const rect = element.getBoundingClientRect();
  const overlay = document.createElement('div');

  overlay.style.cssText = [
    'position: fixed',
    `top: ${rect.top - 2}px`,
    `left: ${rect.left - 2}px`,
    `width: ${rect.width + 4}px`,
    `height: ${rect.height + 4}px`,
    'border: 2px solid #10b981',
    'border-radius: 4px',
    'pointer-events: none',
    'z-index: 2147483646',
    'box-shadow: 0 0 8px rgba(16, 185, 129, 0.4)',
    'transition: opacity 0.2s ease',
    'opacity: 1',
  ].join('; ');

  document.body.appendChild(overlay);

  return () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };
}

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

          // コピー成功時にハイライト表示
          const removeHighlight = highlightElement(element);
          setTimeout(removeHighlight, TOAST_DURATION);

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
