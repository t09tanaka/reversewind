import {
  SAFE_ATTRIBUTES,
  ARIA_PREFIX,
  EVENT_PREFIX,
  SVG_ELEMENTS,
} from '../shared/constants';
import { extractStyles } from './style-extractor';
import { detectAuthoredSize } from './size-detector';
import type {
  ExtractedNode,
  ExtractedChild,
  NormalizedStyles,
} from '../shared/types';

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
 * HTML要素から安全属性のみを抽出する
 */
function extractHtmlAttributes(element: Element): Record<string, string> {
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
 * SVG要素から属性を抽出する（イベント属性とstyleのみ除去、classは保持）
 */
function extractSvgAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of element.attributes) {
    if (isEventAttribute(attr.name)) continue;
    if (attr.name === 'style' || attr.name === 'id') continue;
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * 対象要素とその子要素を再帰的に抽出する
 * テキストノードと要素ノードの出現順序を保持する
 * @throws サブツリーが上限を超えた場合
 */
export function extractSubtree(
  element: Element,
  maxElements: number,
): ExtractedNode {
  let count = 0;

  function walk(
    el: Element,
    parentStyles: NormalizedStyles | undefined,
  ): ExtractedNode {
    count++;
    if (count > maxElements) {
      throw new Error('subtree too large');
    }

    const tagName = el.tagName.toLowerCase();
    const isSvg = SVG_ELEMENTS.has(tagName);
    const styles = extractStyles(el);
    const sizeInfo = detectAuthoredSize(el);
    const children: ExtractedChild[] = [];

    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(walk(child as Element, styles));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          children.push({ type: 'text', content: text });
        }
      }
    }

    return {
      type: 'element',
      tagName,
      attributes: isSvg ? extractSvgAttributes(el) : extractHtmlAttributes(el),
      children,
      styles,
      parentStyles,
      sizeInfo,
    };
  }

  return walk(element, undefined);
}
