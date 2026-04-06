import type {
  NormalizedStyles,
  PseudoClass,
  PseudoStyleMap,
} from '../shared/types';

/** フォールバック対象プロパティ（Tailwind変換未対応） */
const FALLBACK_PROPERTIES = [
  'backdrop-filter',
  'filter',
  'clip-path',
  'mask',
  'mix-blend-mode',
  'isolation',
  'object-fit',
  'object-position',
  'cursor',
  'user-select',
  'pointer-events',
  'resize',
  'appearance',
  'outline',
  'outline-offset',
  'scroll-behavior',
  'scroll-snap-type',
  'scroll-snap-align',
  'will-change',
  'contain',
  'content-visibility',
];

/**
 * フォールバックプロパティのデフォルト値
 * これらはブラウザデフォルトなので出力しない
 */
const FALLBACK_DEFAULTS: Record<string, Set<string>> = {
  'object-fit': new Set(['fill']),
  'object-position': new Set(['50% 50%']),
  cursor: new Set(['default', 'auto']),
  'user-select': new Set(['auto']),
  'pointer-events': new Set(['auto']),
  resize: new Set(['none']),
  appearance: new Set(['none', 'auto', 'button', 'menulist-button']),
  outline: new Set(['none']),
  'outline-offset': new Set(['0px']),
  'scroll-behavior': new Set(['auto']),
  isolation: new Set(['auto']),
  'will-change': new Set(['auto']),
  contain: new Set(['none']),
  'content-visibility': new Set(['visible']),
};

/**
 * outline値がデフォルト（none 0px）かどうかを判定
 */
function isDefaultOutline(value: string): boolean {
  return (
    value === 'none' ||
    value.includes(' none ') ||
    value.endsWith(' none 0px') ||
    value.endsWith(' 0px')
  );
}

/**
 * 要素のcomputedStyleから正規化スタイルを抽出する
 */
export function extractStyles(element: Element): NormalizedStyles {
  const cs = window.getComputedStyle(element);

  const fallback: Record<string, string> = {};
  for (const prop of FALLBACK_PROPERTIES) {
    const value = cs.getPropertyValue(prop);
    if (!value || value === 'none' || value === 'auto' || value === 'normal') {
      continue;
    }

    // デフォルト値チェック
    const defaults = FALLBACK_DEFAULTS[prop];
    if (defaults && defaults.has(value)) continue;

    // outline特殊処理
    if (prop === 'outline' && isDefaultOutline(value)) continue;
    if (prop === 'outline-offset' && value === '0px') continue;

    fallback[prop] = value;
  }

  return {
    display: cs.display,
    position: cs.position,
    width: cs.width,
    height: cs.height,
    minWidth: cs.minWidth,
    minHeight: cs.minHeight,
    maxWidth: cs.maxWidth,
    maxHeight: cs.maxHeight,
    margin: {
      top: cs.marginTop,
      right: cs.marginRight,
      bottom: cs.marginBottom,
      left: cs.marginLeft,
    },
    padding: {
      top: cs.paddingTop,
      right: cs.paddingRight,
      bottom: cs.paddingBottom,
      left: cs.paddingLeft,
    },
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    backgroundImage: cs.backgroundImage,
    borderRadius: cs.borderRadius,
    borderTop: cs.borderTop,
    borderRight: cs.borderRight,
    borderBottom: cs.borderBottom,
    borderLeft: cs.borderLeft,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontFamily: cs.fontFamily,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textAlign: cs.textAlign,
    textTransform: cs.textTransform,
    textDecoration: cs.textDecoration,
    whiteSpace: cs.whiteSpace,
    boxShadow: cs.boxShadow,
    opacity: cs.opacity,
    zIndex: cs.zIndex,
    overflow: cs.overflow,
    boxSizing: cs.boxSizing,
    top: cs.top,
    right: cs.right,
    bottom: cs.bottom,
    left: cs.left,
    gap: cs.gap,
    rowGap: cs.rowGap,
    columnGap: cs.columnGap,
    flexDirection: cs.flexDirection,
    flexWrap: cs.flexWrap,
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    alignContent: cs.alignContent,
    alignSelf: cs.alignSelf,
    flexGrow: cs.flexGrow,
    flexShrink: cs.flexShrink,
    gridTemplateColumns: cs.gridTemplateColumns,
    gridTemplateRows: cs.gridTemplateRows,
    gridColumn: cs.gridColumn,
    gridRow: cs.gridRow,
    transform: cs.transform,
    transition: cs.transition,
    fallback: Object.keys(fallback).length > 0 ? fallback : undefined,
  };
}

/** 対応する疑似クラスの一覧 */
export const PSEUDO_CLASS_LIST: PseudoClass[] = [
  'hover',
  'active',
  'focus',
  'focus-visible',
  'focus-within',
];

/** CSSプロパティ名 → NormalizedStyles キーのマッピング */
const CSS_TO_NORMALIZED: Record<string, keyof NormalizedStyles> = {
  display: 'display',
  position: 'position',
  width: 'width',
  height: 'height',
  'min-width': 'minWidth',
  'min-height': 'minHeight',
  'max-width': 'maxWidth',
  'max-height': 'maxHeight',
  color: 'color',
  'background-color': 'backgroundColor',
  'background-image': 'backgroundImage',
  'border-radius': 'borderRadius',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'font-family': 'fontFamily',
  'line-height': 'lineHeight',
  'letter-spacing': 'letterSpacing',
  'text-align': 'textAlign',
  'text-transform': 'textTransform',
  'text-decoration': 'textDecoration',
  'white-space': 'whiteSpace',
  'box-shadow': 'boxShadow',
  opacity: 'opacity',
  'z-index': 'zIndex',
  overflow: 'overflow',
  'box-sizing': 'boxSizing',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  gap: 'gap',
  'row-gap': 'rowGap',
  'column-gap': 'columnGap',
  'flex-direction': 'flexDirection',
  'flex-wrap': 'flexWrap',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'align-content': 'alignContent',
  'align-self': 'alignSelf',
  'flex-grow': 'flexGrow',
  'flex-shrink': 'flexShrink',
  'grid-template-columns': 'gridTemplateColumns',
  'grid-template-rows': 'gridTemplateRows',
  'grid-column': 'gridColumn',
  'grid-row': 'gridRow',
  'border-top': 'borderTop',
  'border-right': 'borderRight',
  'border-bottom': 'borderBottom',
  'border-left': 'borderLeft',
  'border-color': 'borderColor',
  transform: 'transform',
  transition: 'transition',
};

/** parsePseudoSelector の戻り値 */
type ParsedPseudoSelector = {
  pseudoClass: PseudoClass;
  baseSelector: string;
};

/**
 * セレクタ文字列を解析して疑似クラスと基底セレクタを返す。
 * 祖先疑似クラス（.card:hover .btn など）はnullを返す。
 */
export function parsePseudoSelector(
  selector: string,
): ParsedPseudoSelector | null {
  // コンビネータで分割して最後のセグメントだけを見る
  // コンビネータ: 空白、>、+、~
  const segments = selector.split(/\s*[\s>+~]\s*/);
  const lastSegment = segments[segments.length - 1];

  // focus-within, focus-visible を先にチェック（focus より先にマッチさせる）
  const pseudoRegex = /:(hover|active|focus-within|focus-visible|focus)/;
  const match = lastSegment.match(pseudoRegex);
  if (!match) return null;

  const pseudoClass = match[1] as PseudoClass;

  // セレクタ全体から最後のセグメントの疑似クラス部分を取り除いて基底セレクタを作る
  // セレクタ全体の末尾にある ":pseudoClass" を除去する
  const baseSelector = selector.replace(
    new RegExp(':' + pseudoClass.replace('-', '\\-') + '$'),
    '',
  );

  return { pseudoClass, baseSelector };
}

/** extractPseudoStylesFromRule の戻り値 */
type PseudoRuleResult = {
  pseudoClass: PseudoClass;
  diffStyles: Partial<NormalizedStyles>;
};

/**
 * CSSルールのセレクタ・スタイルから疑似クラスのスタイルを抽出する。
 *
 * CSSOMルールに明示的に記述されたプロパティをそのまま採用する。
 * getComputedStyle() は右クリック時に :hover 適用済みの値を返すため、
 * computed style との差分チェックでは hover スタイルを検出できない。
 */
export function extractPseudoStylesFromRule(
  selector: string,
  ruleStyle: Record<string, string>,
): PseudoRuleResult | null {
  const parsed = parsePseudoSelector(selector);
  if (!parsed) return null;

  const { pseudoClass } = parsed;
  const diffStyles: Partial<NormalizedStyles> = {};

  for (const [cssProp, value] of Object.entries(ruleStyle)) {
    if (!value) continue;
    const normalizedKey = CSS_TO_NORMALIZED[cssProp];
    if (!normalizedKey) continue;

    (diffStyles as Record<string, string>)[normalizedKey] = value;
  }

  // margin/padding の個別プロパティ特殊処理（ネストオブジェクトなのでCSS_TO_NORMALIZEDでは対応できない）
  const marginSides = ['top', 'right', 'bottom', 'left'] as const;
  const marginDiff: Partial<{
    top: string;
    right: string;
    bottom: string;
    left: string;
  }> = {};
  for (const side of marginSides) {
    const value = ruleStyle[`margin-${side}`];
    if (!value) continue;
    marginDiff[side] = value;
  }
  if (Object.keys(marginDiff).length > 0) {
    diffStyles.margin = marginDiff;
  }

  const paddingDiff: Partial<{
    top: string;
    right: string;
    bottom: string;
    left: string;
  }> = {};
  for (const side of marginSides) {
    const value = ruleStyle[`padding-${side}`];
    if (!value) continue;
    paddingDiff[side] = value;
  }
  if (Object.keys(paddingDiff).length > 0) {
    diffStyles.padding = paddingDiff;
  }

  // border-*-color の特殊処理
  // CSSの border-color はブラウザにより border-top-color 等に展開される。
  // 全辺同じ色なら borderColor に統合する。
  const borderColorSides = ['top', 'right', 'bottom', 'left'] as const;
  const borderColors: string[] = [];
  for (const side of borderColorSides) {
    const value = ruleStyle[`border-${side}-color`];
    if (value) borderColors.push(value);
  }
  if (
    borderColors.length > 0 &&
    borderColors.every((c) => c === borderColors[0])
  ) {
    diffStyles.borderColor = borderColors[0];
  }

  if (Object.keys(diffStyles).length === 0) return null;

  return { pseudoClass, diffStyles };
}

/**
 * cssText から CSS 変数名を抽出する。
 * 例: "border-color: var(--ds-gray-500);" → "--ds-gray-500"
 * 複数の var() がある場合は最初の1つを返す（通常は同じ変数を使う）。
 */
export function extractCssVarName(cssText: string): string | null {
  const match = cssText.match(/var\((--[^)]+)\)/);
  return match ? match[1] : null;
}

/**
 * CSSルールのスタイルプロパティをRecord<string, string>に変換する。
 * CSS変数（var(--xxx)）が使われている場合、変数名を解決して実際の値を取得する。
 */
function extractRuleStyle(
  style: CSSStyleDeclaration,
  computedStyle: CSSStyleDeclaration,
): Record<string, string> {
  const ruleStyle: Record<string, string> = {};
  const cssText = style.cssText;

  // CSS変数が使われている場合、変数名を直接解決する
  // computedStyle.getPropertyValue(prop) はhover汚染されている可能性があるため、
  // CSS変数名を抽出して getPropertyValue('--var-name') で解決する
  let resolvedVarValue: string | null = null;
  if (cssText.includes('var(')) {
    const varName = extractCssVarName(cssText);
    if (varName) {
      resolvedVarValue = computedStyle.getPropertyValue(varName).trim();
    }
  }

  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    let value = style.getPropertyValue(prop);

    // CSS変数で展開されたプロパティは空文字になるので、解決済みの変数値を使う
    if (!value && resolvedVarValue) {
      value = resolvedVarValue;
    }

    if (value) {
      ruleStyle[prop] = value;
    }
  }

  return ruleStyle;
}

/** CSSOM走査の中間結果 */
type PseudoScanResult = {
  pseudoMap: PseudoStyleMap;
  /** 疑似クラスルールが変更するCSSプロパティ名のセット */
  pseudoProps: Set<string>;
  /** 通常ルールで要素にマッチするプロパティの値（後勝ち） */
  normalProps: Record<string, string>;
};

/**
 * CSSRuleListを再帰的に走査して疑似クラスルールと通常ルールを収集する。
 */
function collectRulesForPseudo(
  rules: CSSRuleList,
  element: Element,
  computedStyle: CSSStyleDeclaration,
  result: PseudoScanResult,
): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      const selectors = rule.selectorText.split(',').map((s) => s.trim());
      for (const selector of selectors) {
        const parsed = parsePseudoSelector(selector);

        if (parsed) {
          // 疑似クラスルール
          try {
            if (!element.matches(parsed.baseSelector)) continue;
          } catch {
            continue;
          }

          const ruleStyle = extractRuleStyle(rule.style, computedStyle);

          // 疑似クラスが変更するプロパティを記録
          for (const prop of Object.keys(ruleStyle)) {
            result.pseudoProps.add(prop);
          }

          const extracted = extractPseudoStylesFromRule(selector, ruleStyle);
          if (!extracted) continue;

          result.pseudoMap[parsed.pseudoClass] = {
            ...(result.pseudoMap[parsed.pseudoClass] ?? {}),
            ...extracted.diffStyles,
          };
        } else {
          // 通常ルール — プロパティを収集（base補正用）
          try {
            if (!element.matches(selector)) continue;
          } catch {
            continue;
          }

          const ruleStyle = extractRuleStyle(rule.style, computedStyle);
          for (const [prop, value] of Object.entries(ruleStyle)) {
            result.normalProps[prop] = value;
          }
        }
      }
    } else if (
      'cssRules' in rule &&
      (rule as CSSGroupingRule).cssRules.length > 0
    ) {
      collectRulesForPseudo(
        (rule as CSSGroupingRule).cssRules,
        element,
        computedStyle,
        result,
      );
    }
  }
}

/** extractPseudoStyles の戻り値 */
export type PseudoExtractResult = {
  pseudoStyles: PseudoStyleMap;
  /** 疑似クラスが変更するプロパティについて、通常ルールの値で補正するマップ */
  baseCorrections: Partial<NormalizedStyles>;
};

/**
 * document.styleSheets を走査して要素の疑似クラススタイルを抽出する。
 *
 * CSS変数（var(--xxx)）はcomputedStyleで解決する。
 * 疑似クラスが変更するプロパティについて、通常ルールの値で base style を補正する。
 */
export function extractPseudoStyles(
  element: Element,
): PseudoExtractResult | undefined {
  const computedStyle = window.getComputedStyle(element);
  const result: PseudoScanResult = {
    pseudoMap: {},
    pseudoProps: new Set(),
    normalProps: {},
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    collectRulesForPseudo(rules, element, computedStyle, result);
  }

  const hasPseudo = PSEUDO_CLASS_LIST.some(
    (pc) =>
      result.pseudoMap[pc] && Object.keys(result.pseudoMap[pc]!).length > 0,
  );
  if (!hasPseudo) return undefined;

  // 疑似クラスが変更するプロパティについて、通常ルールの値でbase補正マップを作成
  const baseCorrections: Partial<NormalizedStyles> = {};
  for (const cssProp of result.pseudoProps) {
    const normalValue = result.normalProps[cssProp];
    if (!normalValue) continue;

    const normalizedKey = CSS_TO_NORMALIZED[cssProp];
    if (normalizedKey) {
      (baseCorrections as Record<string, string>)[normalizedKey] = normalValue;
    }
  }

  // border-*-color の base 補正
  if (result.pseudoProps.has('border-top-color')) {
    const sides = ['top', 'right', 'bottom', 'left'] as const;
    const normalColors = sides
      .map((s) => result.normalProps[`border-${s}-color`])
      .filter(Boolean);
    if (
      normalColors.length > 0 &&
      normalColors.every((c) => c === normalColors[0])
    ) {
      baseCorrections.borderColor = normalColors[0];
    }
  }

  return {
    pseudoStyles: result.pseudoMap,
    baseCorrections,
  };
}
