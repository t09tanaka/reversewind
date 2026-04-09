import { selectionStore } from './selection-store';
import { findMeaningfulAncestor } from './bubble-up';
import { extractSubtree } from './dom-extractor';
import { convertToOutput, optimizeOutputTree } from './tailwind-mapper';
import { generateHtml } from './html-generator';
import { copyToClipboard } from './clipboard';
import { showToast } from './toast';
import { extractBaseStyles, getVisibleBodyChildren } from './page-extractor';
import {
  TOAST_MESSAGES,
  TOAST_DURATION,
  MAX_ELEMENTS,
  MAX_PAGE_ELEMENTS,
} from '../shared/constants';
import type { ReversewindMessage, ExtractedNode } from '../shared/types';

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

function countElements(node: ExtractedNode): number {
  let count = 1;
  for (const child of node.children) {
    if (child.type === 'element') {
      count += countElements(child);
    }
  }
  return count;
}

/**
 * ページ全体をコピーする
 */
function copyPage(sendResponse: (response: unknown) => void): true {
  const bodyCs = getComputedStyle(document.body);
  const baseClasses = extractBaseStyles({
    backgroundColor: bodyCs.backgroundColor,
    color: bodyCs.color,
    fontFamily: bodyCs.fontFamily,
  });

  const visibleChildren = getVisibleBodyChildren();

  let totalElements = 0;
  const extractedChildren: ExtractedNode[] = [];
  for (const child of visibleChildren) {
    const extracted = extractSubtree(child, MAX_PAGE_ELEMENTS - totalElements);
    extractedChildren.push(extracted);
    totalElements += countElements(extracted);
    if (totalElements > MAX_PAGE_ELEMENTS) {
      showToast(TOAST_MESSAGES.PAGE_TOO_LARGE, 'error');
      sendResponse({ success: false, error: 'page too large' });
      return true;
    }
  }

  const childrenHtml = extractedChildren
    .map((ext) => {
      const output = optimizeOutputTree(convertToOutput(ext));
      return generateHtml(output, 1);
    })
    .join('\n');

  const classAttr =
    baseClasses.length > 0 ? ` class="${baseClasses.join(' ')}"` : '';
  const html = `<!-- Reversewind: base styles from html/body -->\n<div${classAttr}>\n${childrenHtml}\n</div>`;

  copyToClipboard(html)
    .then(() => {
      showToast(TOAST_MESSAGES.SUCCESS_PAGE, 'success');
      sendResponse({ success: true });
    })
    .catch((err) => {
      console.error('[Reversewind] copy failed:', err);
      showToast(TOAST_MESSAGES.COPY_FAILED, 'error');
      sendResponse({ success: false, error: 'copy failed' });
    });

  return true;
}

/**
 * コンポーネントをコピーする
 */
function copyComponent(
  element: Element,
  sendResponse: (response: unknown) => void,
): true {
  const extracted = extractSubtree(element, MAX_ELEMENTS);
  const output = optimizeOutputTree(convertToOutput(extracted));
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

  return true;
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

      // bodyまたはbody直下の要素が選択された場合はページ全体コピー
      if (
        element === document.body ||
        element.parentElement === document.body
      ) {
        return copyPage(sendResponse);
      }

      return copyComponent(element, sendResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      console.error('[Reversewind] error:', msg);

      if (msg.includes('too large')) {
        showToast(TOAST_MESSAGES.SUBTREE_TOO_LARGE, 'error');
      } else {
        showToast(TOAST_MESSAGES.COPY_FAILED, 'error');
      }

      sendResponse({ success: false, error: msg });
    }
  },
);
