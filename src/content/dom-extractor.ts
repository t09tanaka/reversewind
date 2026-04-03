import {
  SAFE_ATTRIBUTES,
  ARIA_PREFIX,
  EVENT_PREFIX,
} from '../shared/constants';
import { extractStyles } from './style-extractor';
import type { ExtractedNode } from '../shared/types';

/**
 * 属性が安全かどうかを判定する
 */
function isSafeAttribute(name: string): boolean {
  if (SAFE_ATTRIBUTES.has(name)) return true;
  if (name.startsWith(ARIA_PREFIX)) return true;
  return false;
}

/**
 * 属性がイベントハンドラかどうかを判定する
 */
function isEventAttribute(name: string): boolean {
  return name.startsWith(EVENT_PREFIX);
}

/**
 * 要素から安全属性のみを抽出する
 */
function extractAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of element.attributes) {
    if (isEventAttribute(attr.name)) continue;
    if (attr.name === 'class' || attr.name === 'style' || attr.name === 'id')
      continue;
    if (!isSafeAttribute(attr.name)) continue;
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * 対象要素とその子要素を再帰的に抽出する
 * @throws サブツリーが上限を超えた場合
 */
export function extractSubtree(
  element: Element,
  maxElements: number,
): ExtractedNode {
  let count = 0;

  function walk(el: Element): ExtractedNode {
    count++;
    if (count > maxElements) {
      throw new Error('subtree too large');
    }

    const children: ExtractedNode[] = [];
    let textContent: string | undefined;

    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(walk(child as Element));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          // テキストノードが直接の子として存在する場合
          if (!textContent) {
            textContent = text;
          } else {
            textContent += ' ' + text;
          }
        }
      }
    }

    return {
      tagName: el.tagName.toLowerCase(),
      attributes: extractAttributes(el),
      textContent:
        children.length === 0 && !textContent
          ? el.textContent?.trim() || undefined
          : textContent,
      children,
      styles: extractStyles(el),
    };
  }

  return walk(element);
}
