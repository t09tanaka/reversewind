/** コンテキストメニューID */
export const MENU_ID = 'reversewind-copy-as-tailwind';

/** メニュー表示テキスト */
export const MENU_TITLE = 'Reversewind: Copy';

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
  // SVG属性
  'xmlns',
  'viewBox',
  'width',
  'height',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
  'opacity',
  'clip-rule',
  'fill-rule',
  'clip-path',
  'mask',
]);

/** SVG要素 — スタイル変換をスキップし、属性をそのまま保持する */
export const SVG_ELEMENTS = new Set([
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polygon',
  'polyline',
  'ellipse',
  'g',
  'defs',
  'use',
  'symbol',
  'clippath',
  'mask',
  'text',
  'tspan',
  'foreignobject',
  'lineargradient',
  'radialgradient',
  'stop',
  'filter',
  'fegaussianblur',
  'feoffset',
  'feblend',
  'fecolormatrix',
  'marker',
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
