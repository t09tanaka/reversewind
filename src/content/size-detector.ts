/**
 * CSSOM を走査して要素に明示的なサイズ指定があるかを判定する。
 * DOM を一切変更しない。
 */

import type { SizeInfo } from '../shared/types';

/** サイズ制約に関連するCSSプロパティ */
const SIZE_PROPERTIES_WIDTH = [
  'width',
  'min-width',
  'max-width',
  'inline-size',
  'min-inline-size',
  'max-inline-size',
  'flex-basis',
];

const SIZE_PROPERTIES_HEIGHT = [
  'height',
  'min-height',
  'max-height',
  'block-size',
  'min-block-size',
  'max-block-size',
];

/** intrinsic size を持つ置換要素 */
const REPLACED_ELEMENTS = new Set([
  'img',
  'video',
  'canvas',
  'svg',
  'iframe',
  'embed',
  'object',
  'input',
  'textarea',
  'select',
]);

/**
 * document.styleSheets からCSSルールを安全に読み取る。
 * クロスオリジンのスタイルシートは SecurityError を投げるのでスキップする。
 */
function collectCSSRules(): CSSStyleRule[] {
  const rules: CSSStyleRule[] = [];
  for (const sheet of document.styleSheets) {
    let cssRules: CSSRuleList;
    try {
      cssRules = sheet.cssRules;
    } catch {
      // クロスオリジンのスタイルシートはスキップ
      continue;
    }
    collectRulesFromList(cssRules, rules);
  }
  return rules;
}

function collectRulesFromList(
  ruleList: CSSRuleList,
  out: CSSStyleRule[],
): void {
  for (const rule of ruleList) {
    if (rule instanceof CSSStyleRule) {
      out.push(rule);
    } else if (
      'cssRules' in rule &&
      (rule as CSSGroupingRule).cssRules.length > 0
    ) {
      // CSSMediaRule, CSSSupportsRule, CSSLayerBlockRule 等のネストルールを再帰走査
      collectRulesFromList((rule as CSSGroupingRule).cssRules, out);
    }
  }
}

/**
 * CSSルール群から要素にマッチするサイズ指定を検索する
 */
function hasAuthoredProperty(
  element: Element,
  rules: CSSStyleRule[],
  properties: string[],
): boolean {
  // 1. inline style チェック
  if (element instanceof HTMLElement && element.style) {
    for (const prop of properties) {
      const value = element.style.getPropertyValue(prop);
      if (value && value !== 'auto' && value !== 'none') {
        return true;
      }
    }
  }

  // 2. HTML属性 (img width/height 等)
  if (element instanceof HTMLElement) {
    if (properties.includes('width') && element.hasAttribute('width')) {
      return true;
    }
    if (properties.includes('height') && element.hasAttribute('height')) {
      return true;
    }
  }

  // 3. CSSルール走査
  for (const rule of rules) {
    try {
      if (!element.matches(rule.selectorText)) continue;
    } catch {
      // 無効なセレクタはスキップ
      continue;
    }

    for (const prop of properties) {
      const value = rule.style.getPropertyValue(prop);
      if (value && value !== 'auto' && value !== 'none' && value !== '') {
        return true;
      }
    }
  }

  return false;
}

/**
 * 要素のサイズが author によって明示指定されているかを判定する。
 *
 * - inline style, HTML属性, CSSルールのいずれかで指定されていればtrue
 * - クロスオリジンCSSで読めない場合はヒューリスティックにフォールバック
 * - display:inline の非置換要素では width/height は無意味なので常にfalse
 */
export function detectAuthoredSize(element: Element): SizeInfo {
  const tagName = element.tagName.toLowerCase();
  const cs = window.getComputedStyle(element);

  // display:inline の非置換要素ではwidth/heightは効かない
  if (cs.display === 'inline' && !REPLACED_ELEMENTS.has(tagName)) {
    return { widthAuthored: false, heightAuthored: false };
  }

  // 置換要素は intrinsic size を持つのでサイズを出力する意味がある
  // ただし HTML属性やCSS指定がある場合のみ authored とする
  const rules = collectCSSRules();

  const widthAuthored = hasAuthoredProperty(
    element,
    rules,
    SIZE_PROPERTIES_WIDTH,
  );
  const heightAuthored = hasAuthoredProperty(
    element,
    rules,
    SIZE_PROPERTIES_HEIGHT,
  );

  // ヒューリスティック: CSSルールが少なすぎる場合（クロスオリジン多数）
  // → 整数pxかつblock/flex/grid要素なら固定指定の可能性が高い
  if (!widthAuthored && !heightAuthored && rules.length === 0) {
    return heuristicDetect(element, cs);
  }

  return { widthAuthored, heightAuthored };
}

/**
 * CSSOMが読めない場合のフォールバックヒューリスティック
 */
function heuristicDetect(element: Element, cs: CSSStyleDeclaration): SizeInfo {
  let widthAuthored = false;
  let heightAuthored = false;

  // inline style があれば authored
  if (element instanceof HTMLElement && element.style) {
    if (element.style.width && element.style.width !== 'auto') {
      widthAuthored = true;
    }
    if (element.style.height && element.style.height !== 'auto') {
      heightAuthored = true;
    }
  }

  // 整数pxで、特定サイズ（キリの良い数値）なら固定の可能性
  if (!widthAuthored) {
    const w = parseFloat(cs.width);
    if (!isNaN(w) && w === Math.round(w) && w % 1 === 0) {
      // 100, 200, 300, 50 等のキリの良い値は固定の可能性が高い
      // ただし確実ではないので保守的に false のまま
    }
  }

  return { widthAuthored, heightAuthored };
}
