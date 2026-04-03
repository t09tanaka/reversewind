import type { OutputNode } from '../shared/types';

/** セルフクローズタグ */
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * OutputNodeからインデント付きHTML文字列を生成する
 */
export function generateHtml(node: OutputNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  const tag = node.tagName;
  const isVoid = VOID_ELEMENTS.has(tag);

  // 属性を組み立て
  const parts: string[] = [];

  // class
  if (node.classList.length > 0) {
    parts.push(`class="${node.classList.join(' ')}"`);
  }

  // style
  const styleEntries = Object.entries(node.style);
  if (styleEntries.length > 0) {
    const styleStr = styleEntries.map(([k, v]) => `${k}: ${v}`).join('; ');
    parts.push(`style="${styleStr}"`);
  }

  // 安全属性
  for (const [key, value] of Object.entries(node.attributes)) {
    parts.push(`${key}="${escapeHtml(value)}"`);
  }

  const attrs = parts.length > 0 ? ' ' + parts.join(' ') : '';

  // セルフクローズタグ
  if (isVoid) {
    return `${pad}<${tag}${attrs} />`;
  }

  // 子要素もテキストもない
  if (node.children.length === 0 && !node.textContent) {
    return `${pad}<${tag}${attrs}></${tag}>`;
  }

  // テキストのみ
  if (node.children.length === 0 && node.textContent) {
    return `${pad}<${tag}${attrs}>${escapeHtml(node.textContent)}</${tag}>`;
  }

  // 子要素あり
  const childrenHtml = node.children
    .map((child) => generateHtml(child, indent + 1))
    .join('\n');

  const lines = [`${pad}<${tag}${attrs}>`];

  if (node.textContent) {
    lines.push(`${'  '.repeat(indent + 1)}${escapeHtml(node.textContent)}`);
  }

  lines.push(childrenHtml);
  lines.push(`${pad}</${tag}>`);

  return lines.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
