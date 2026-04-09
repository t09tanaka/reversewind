import type {
  NormalizedStyles,
  PseudoClass,
  PseudoStyleMap,
} from '../shared/types';

import { collectAuthoredLonghandValues } from './css-rule-collector';

/**
 * authored 判定のために参照する longhand プロパティ一覧。
 * 物理 longhand に加え、logical longhand（inset-*, margin-block-*, margin-inline-*,
 * inline-size, block-size）も拾う。logical longhand はページが RTL や縦書きで
 * 位置や margin を指定しているケースで使われるため、writingMode / direction で
 * 物理側にマップする。
 */
const AUTHORED_OFFSET_AND_MARGIN_PROPS = [
  'top',
  'right',
  'bottom',
  'left',
  'inset-block-start',
  'inset-block-end',
  'inset-inline-start',
  'inset-inline-end',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  // width/height とその logical longhand
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'inline-size',
  'block-size',
  'min-inline-size',
  'min-block-size',
  'max-inline-size',
  'max-block-size',
] as const;

/**
 * author が書いた width/height 系の値がキーワード（%, auto, min-content 等）なら
 * そのまま採用し、px/em/rem 等の数値単位なら computed 値を採用するための判定。
 * Tailwind のサイズ utility はキーワード値からマップできる（w-full, w-auto, w-min 等）が、
 * 数値単位は computed の方がブラウザ解決済みで扱いやすい。
 */
const SIZE_KEYWORD_REGEX =
  /^(auto|none|min-content|max-content|fit-content|stretch|fill|inherit|initial|unset|revert|[\d.]+%)$/;

function effectiveSize(
  authoredValue: string | undefined,
  computed: string,
): string {
  if (authoredValue && SIZE_KEYWORD_REGEX.test(authoredValue)) {
    return authoredValue;
  }
  return computed;
}

/**
 * writingMode / direction から logical longhand を物理 longhand に変換する関数を返す。
 * 現状は horizontal-tb（水平書字）のみ詳細にサポート。それ以外の writingMode では
 * logical → 物理の厳密マッピングを諦め、すべての物理方向を「unknown」と扱えるよう
 * null を返す（呼び出し側が保守的にフォールバックする想定）。
 */
function buildLogicalPhysicalResolver(
  writingMode: string,
  direction: string,
): ((logical: string) => string | null) | null {
  if (writingMode !== 'horizontal-tb') {
    // 縦書き系は複雑なので呼び出し側で「logical が authored なら computed を信用」フォールバック
    return null;
  }
  const ltr = direction !== 'rtl';
  return (logical: string): string | null => {
    switch (logical) {
      case 'inset-block-start':
      case 'margin-block-start':
        return logical.startsWith('margin') ? 'margin-top' : 'top';
      case 'inset-block-end':
      case 'margin-block-end':
        return logical.startsWith('margin') ? 'margin-bottom' : 'bottom';
      case 'inset-inline-start':
      case 'margin-inline-start':
        return logical.startsWith('margin')
          ? ltr
            ? 'margin-left'
            : 'margin-right'
          : ltr
            ? 'left'
            : 'right';
      case 'inset-inline-end':
      case 'margin-inline-end':
        return logical.startsWith('margin')
          ? ltr
            ? 'margin-right'
            : 'margin-left'
          : ltr
            ? 'right'
            : 'left';
      // size 系: horizontal-tb では inline = width, block = height
      case 'inline-size':
        return 'width';
      case 'block-size':
        return 'height';
      case 'min-inline-size':
        return 'min-width';
      case 'min-block-size':
        return 'min-height';
      case 'max-inline-size':
        return 'max-width';
      case 'max-block-size':
        return 'max-height';
      default:
        return null;
    }
  };
}

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

  // position offset / margin の「author が実際に書いた値」を収集し、
  // computed 値（常にピクセル化される）と突き合わせて auto 判定を復元する。
  // 例: author が `absolute bottom-10 left-10` と書いた要素では computed top は
  // 実際の位置（例: `650px`）が返るが、authored map には top が存在しないので auto と判断できる。
  // 例: author が `mx-auto` と書いた中央寄せコンテナは computed marginLeft が `0px` でも
  // authored map では `auto` が保存されているので mapper 側で mx-auto を出力できる。
  const rawAuthored = collectAuthoredLonghandValues(
    element,
    AUTHORED_OFFSET_AND_MARGIN_PROPS,
  );

  // logical longhand を物理 longhand にマージ
  // （horizontal-tb 以外の writingMode では logical → 物理 の解決を諦め、
  //  該当要素では computed 値を素直に使うフォールバック動作に切り替える）
  const resolver = buildLogicalPhysicalResolver(cs.writingMode, cs.direction);
  const authored = new Map(rawAuthored);
  let unresolvedLogical = false;
  const LOGICAL_LONGHANDS = new Set([
    'inset-block-start',
    'inset-block-end',
    'inset-inline-start',
    'inset-inline-end',
    'margin-block-start',
    'margin-block-end',
    'margin-inline-start',
    'margin-inline-end',
    'inline-size',
    'block-size',
    'min-inline-size',
    'min-block-size',
    'max-inline-size',
    'max-block-size',
  ]);
  for (const [key, value] of rawAuthored) {
    // physical longhand はそのまま
    if (!LOGICAL_LONGHANDS.has(key)) continue;
    // logical longhand → 物理にマップ
    if (!resolver) {
      // 縦書き系: 解決不能。フォールバック判定フラグを立てる
      unresolvedLogical = true;
      continue;
    }
    const mapped = resolver(key);
    if (!mapped) continue;
    // 既に physical longhand で authored 値があればそちらを優先（cascade の具体性近似）
    if (!authored.has(mapped)) {
      authored.set(mapped, value);
    }
  }

  const effectiveOffset = (
    prop: 'top' | 'right' | 'bottom' | 'left',
    computed: string,
  ): string => {
    // writingMode が非水平で logical inset が使われている場合は安全に computed を採用
    if (unresolvedLogical) return computed;
    const a = authored.get(prop);
    if (a === undefined) return 'auto';
    if (a === 'auto') return 'auto';
    return computed;
  };
  const effectiveMargin = (
    prop: 'margin-top' | 'margin-right' | 'margin-bottom' | 'margin-left',
    computed: string,
  ): string => {
    // `auto` 指定は cascade を通って computed ではピクセル化されるので、authored を優先
    if (authored.get(prop) === 'auto') return 'auto';
    return computed;
  };

  return {
    display: cs.display,
    position: cs.position,
    // width/height/min-*/max-* は author が書いたキーワード値
    // （100%, auto, min-content 等）を保持する。数値単位は computed を採用。
    // これによって `w-full` や `h-full` が `w-[580px]` に化けるのを防ぐ。
    width: effectiveSize(authored.get('width'), cs.width),
    height: effectiveSize(authored.get('height'), cs.height),
    minWidth: effectiveSize(authored.get('min-width'), cs.minWidth),
    minHeight: effectiveSize(authored.get('min-height'), cs.minHeight),
    maxWidth: effectiveSize(authored.get('max-width'), cs.maxWidth),
    maxHeight: effectiveSize(authored.get('max-height'), cs.maxHeight),
    margin: {
      top: effectiveMargin('margin-top', cs.marginTop),
      right: effectiveMargin('margin-right', cs.marginRight),
      bottom: effectiveMargin('margin-bottom', cs.marginBottom),
      left: effectiveMargin('margin-left', cs.marginLeft),
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
    top: effectiveOffset('top', cs.top),
    right: effectiveOffset('right', cs.right),
    bottom: effectiveOffset('bottom', cs.bottom),
    left: effectiveOffset('left', cs.left),
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
    aspectRatio: cs.aspectRatio,
    scale: cs.getPropertyValue('scale'),
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
  scale: 'scale',
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
