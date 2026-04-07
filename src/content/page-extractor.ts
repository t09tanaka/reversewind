import { rgbToHex } from './tailwind-mapper';

/** body直下で除外する非可視要素 */
export const HIDDEN_BODY_CHILDREN = new Set(['SCRIPT', 'NOSCRIPT', 'STYLE']);

/** ベーススタイル抽出用の入力 */
export type BaseStyleInput = {
  backgroundColor: string;
  color: string;
  fontFamily: string;
};

/**
 * body の computed style からベーススタイルの Tailwind クラスリストを生成する
 */
export function extractBaseStyles(input: BaseStyleInput): string[] {
  const classes: string[] = [];

  // Background color
  const bg = input.backgroundColor;
  if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
    const hex = rgbToHex(bg);
    if (hex === '#ffffff') {
      classes.push('bg-white');
    } else if (hex !== 'transparent' && hex !== '#000000') {
      classes.push(`bg-[${hex}]`);
    }
  }

  // Text color
  const color = input.color;
  if (color) {
    const hex = rgbToHex(color);
    if (hex === '#ffffff') {
      classes.push('text-white');
    } else if (hex !== '#000000' && hex !== 'transparent') {
      classes.push(`text-[${hex}]`);
    }
  }

  // Font family — Tailwind標準のみマッピング
  const ff = input.fontFamily.toLowerCase();
  if (ff.includes('ui-sans-serif') || ff.includes('system-ui')) {
    classes.push('font-sans');
  } else if (ff.includes('ui-serif') || ff.includes('georgia')) {
    classes.push('font-serif');
  } else if (ff.includes('ui-monospace') || ff.includes('monospace')) {
    classes.push('font-mono');
  }

  return classes;
}

/**
 * body 直下の可視要素を収集する
 */
export function getVisibleBodyChildren(): Element[] {
  const children = Array.from(document.body.children);
  return children.filter((el) => {
    if (HIDDEN_BODY_CHILDREN.has(el.tagName)) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return false;
    return true;
  });
}
