import type { OutputNode, OutputChild } from '../shared/types';

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
 * OutputChildからHTML文字列を生成する
 */
function generateChild(child: OutputChild, indent: number): string {
  if (child.type === 'text') {
    return `${'  '.repeat(indent)}${escapeHtml(child.content)}`;
  }
  return generateHtml(child, indent);
}

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

  // 子なし
  if (node.children.length === 0) {
    return `${pad}<${tag}${attrs}></${tag}>`;
  }

  // テキストのみの子（1つのテキストノードだけ）
  if (node.children.length === 1 && node.children[0].type === 'text') {
    return `${pad}<${tag}${attrs}>${escapeHtml(node.children[0].content)}</${tag}>`;
  }

  // 複数の子 — 順序を保持して出力
  const childrenHtml = node.children
    .map((child) => generateChild(child, indent + 1))
    .join('\n');

  return `${pad}<${tag}${attrs}>\n${childrenHtml}\n${pad}</${tag}>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
