import { TOAST_DURATION } from '../shared/constants';

/**
 * ページ上にトースト通知を表示する
 * Shadow DOMを使用して元ページのスタイルに影響されないようにする
 */
export function showToast(message: string, type: 'success' | 'error'): void {
  const host = document.createElement('div');
  host.id = 'reversewind-toast-host';

  const shadow = host.attachShadow({ mode: 'closed' });

  const bgColor = type === 'success' ? '#10b981' : '#ef4444';

  shadow.innerHTML = `
    <style>
      .toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        padding: 12px 20px;
        border-radius: 8px;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        background-color: ${bgColor};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: none;
      }
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }
    </style>
    <div class="toast">${message}</div>
  `;

  document.body.appendChild(host);

  const toast = shadow.querySelector('.toast')!;

  // 表示アニメーション
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // 自動非表示
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      host.remove();
    }, 200);
  }, TOAST_DURATION);
}
