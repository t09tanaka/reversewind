/** コンテキストメニューID */
export const MENU_ID = 'reversewind-copy-as-tailwind';

/** メニュー表示テキスト */
export const MENU_TITLE = 'Copy as Tailwind';

/** サブツリー要素数の上限 */
export const MAX_ELEMENTS = 300;

/** 保持する安全属性リスト */
export const SAFE_ATTRIBUTES = new Set([
  'href',
  'src',
  'alt',
  'title',
  'role',
  'type',
  'name',
  'value',
  'placeholder',
  'target',
  'rel',
]);

/** aria-* 属性のプレフィックス */
export const ARIA_PREFIX = 'aria-';

/** 除去するイベント属性のプレフィックス */
export const EVENT_PREFIX = 'on';

/** トースト表示時間 (ms) */
export const TOAST_DURATION = 3000;

/** トーストメッセージ */
export const TOAST_MESSAGES = {
  SUCCESS: 'Reversewind: copied as Tailwind',
  TARGET_NOT_FOUND: 'Reversewind: target not found',
  COPY_FAILED: 'Reversewind: copy failed',
  SUBTREE_TOO_LARGE: 'Reversewind: subtree too large',
} as const;
