# 疑似クラススタイル対応 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `:hover`, `:active`, `:focus`, `:focus-visible`, `:focus-within` の疑似クラススタイルをCSSOMから抽出し、Tailwindプレフィックス付きクラスとして出力する。

**Architecture:** CSSOMルール走査で疑似クラスのスタイルを収集し、通常スタイルとの差分のみを `hover:bg-blue-500` のようなプレフィックス付きクラスに変換する。クラスはプロパティグループ単位で base → hover → active → focus → focus-visible → focus-within の順にソートする。

**Tech Stack:** TypeScript, Chrome Extension Manifest V3, Vitest

---

### Task 1: 型定義の追加

**Files:**
- Modify: `src/shared/types.ts:1-98`

- [ ] **Step 1: `PseudoClass` 型と `ExtractedNode.pseudoStyles` を追加**

`src/shared/types.ts` の `SizeInfo` 型の下（5行目の後）に `PseudoClass` 型を追加し、`ExtractedNode` に `pseudoStyles` フィールドを追加する:

```typescript
/** 対応する疑似クラス */
export type PseudoClass =
  | 'hover'
  | 'active'
  | 'focus'
  | 'focus-visible'
  | 'focus-within';

/** 疑似クラスごとのスタイル差分 */
export type PseudoStyleMap = Partial<
  Record<PseudoClass, Partial<NormalizedStyles>>
>;
```

`ExtractedNode` 型に追加:
```typescript
export type ExtractedNode = {
  type: 'element';
  tagName: string;
  attributes: Record<string, string>;
  children: ExtractedChild[];
  styles: NormalizedStyles;
  parentStyles?: NormalizedStyles;
  sizeInfo: SizeInfo;
  pseudoStyles?: PseudoStyleMap; // 追加
};
```

- [ ] **Step 2: 型チェックを実行**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx tsc --noEmit`
Expected: 成功（既存コードに影響なし）

- [ ] **Step 3: コミット**

```bash
git add src/shared/types.ts
git commit -m "feat: add PseudoClass type and pseudoStyles field to ExtractedNode"
```

---

### Task 2: CSSOMルール走査による疑似クラススタイル抽出

**Files:**
- Modify: `src/content/style-extractor.ts:1-149`
- Test: `tests/pseudo-style-extractor.test.ts`

- [ ] **Step 1: テストファイルを作成**

`tests/pseudo-style-extractor.test.ts` を作成:

```typescript
import { describe, it, expect } from 'vitest';
import {
  extractPseudoStylesFromRule,
  PSEUDO_CLASS_LIST,
} from '../src/content/style-extractor';
import type { NormalizedStyles } from '../src/shared/types';

describe('PSEUDO_CLASS_LIST', () => {
  it('contains all 5 pseudo-classes', () => {
    expect(PSEUDO_CLASS_LIST).toEqual([
      'hover',
      'active',
      'focus',
      'focus-visible',
      'focus-within',
    ]);
  });
});

describe('extractPseudoStylesFromRule', () => {
  it('extracts hover background-color from a CSSStyleRule', () => {
    const baseStyles: NormalizedStyles = {
      backgroundColor: 'rgb(255, 255, 255)',
    };
    // セレクタ ".btn:hover" で background-color が変わるルールをシミュレート
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(0, 0, 255)',
    };

    const result = extractPseudoStylesFromRule(
      '.btn:hover',
      ruleStyle,
      baseStyles,
    );

    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
    expect(result!.diffStyles.backgroundColor).toBe('rgb(0, 0, 255)');
  });

  it('extracts focus border-color', () => {
    const baseStyles: NormalizedStyles = {
      borderTop: '1px solid rgb(0, 0, 0)',
    };
    const ruleStyle: Record<string, string> = {
      'border-color': 'rgb(59, 130, 246)',
    };

    const result = extractPseudoStylesFromRule(
      '.input:focus',
      ruleStyle,
      baseStyles,
    );

    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus');
  });

  it('returns null for selector without pseudo-class', () => {
    const baseStyles: NormalizedStyles = {};
    const ruleStyle: Record<string, string> = {
      'background-color': 'red',
    };

    const result = extractPseudoStylesFromRule(
      '.btn',
      ruleStyle,
      baseStyles,
    );

    expect(result).toBeNull();
  });

  it('returns null for ancestor pseudo-class (.card:hover .btn)', () => {
    const baseStyles: NormalizedStyles = {};
    const ruleStyle: Record<string, string> = {
      color: 'red',
    };

    const result = extractPseudoStylesFromRule(
      '.card:hover .btn',
      ruleStyle,
      baseStyles,
    );

    expect(result).toBeNull();
  });

  it('extracts from compound selector like .btn.primary:hover', () => {
    const baseStyles: NormalizedStyles = {
      backgroundColor: 'rgb(255, 255, 255)',
    };
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(0, 128, 0)',
    };

    const result = extractPseudoStylesFromRule(
      '.btn.primary:hover',
      ruleStyle,
      baseStyles,
    );

    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
  });

  it('skips properties with same value as base styles', () => {
    const baseStyles: NormalizedStyles = {
      backgroundColor: 'rgb(0, 0, 255)',
    };
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(0, 0, 255)',
    };

    const result = extractPseudoStylesFromRule(
      '.btn:hover',
      ruleStyle,
      baseStyles,
    );

    // 差分なしなのでnull
    expect(result).toBeNull();
  });

  it('handles focus-visible pseudo-class', () => {
    const baseStyles: NormalizedStyles = {};
    const ruleStyle: Record<string, string> = {
      outline: '2px solid rgb(59, 130, 246)',
    };

    const result = extractPseudoStylesFromRule(
      '.btn:focus-visible',
      ruleStyle,
      baseStyles,
    );

    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus-visible');
  });

  it('handles focus-within pseudo-class', () => {
    const baseStyles: NormalizedStyles = {};
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(240, 240, 240)',
    };

    const result = extractPseudoStylesFromRule(
      '.container:focus-within',
      ruleStyle,
      baseStyles,
    );

    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus-within');
    expect(result!.diffStyles.backgroundColor).toBe('rgb(240, 240, 240)');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx vitest run tests/pseudo-style-extractor.test.ts`
Expected: FAIL（`extractPseudoStylesFromRule` と `PSEUDO_CLASS_LIST` が存在しない）

- [ ] **Step 3: 疑似クラス抽出ロジックを実装**

`src/content/style-extractor.ts` の末尾に以下を追加:

```typescript
import type { NormalizedStyles, PseudoClass, PseudoStyleMap } from '../shared/types';

/** 対応する疑似クラスの一覧（ソート順を兼ねる） */
export const PSEUDO_CLASS_LIST: PseudoClass[] = [
  'hover',
  'active',
  'focus',
  'focus-visible',
  'focus-within',
];

/** CSSプロパティ名 → NormalizedStyles キー名のマッピング */
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
};

/** 疑似クラスを検出するための正規表現 — セレクタの末尾の簡単セレクタ部分のみ */
const PSEUDO_CLASS_REGEX =
  /:(hover|active|focus-within|focus-visible|focus)(?=[^a-zA-Z-]|$)/;

/**
 * セレクタ文字列から疑似クラスを検出し、それが最後の簡単セレクタに
 * 付いているか判定する。祖先の疑似クラス（.card:hover .btn）は除外。
 *
 * @returns 検出された疑似クラスとベースセレクタ、または null
 */
export function parsePseudoSelector(
  selector: string,
): { pseudoClass: PseudoClass; baseSelector: string } | null {
  // セレクタを結合子（スペース, >, +, ~）で分割し、最後のセグメントを取得
  const segments = selector.split(/(?<=\S)\s*[>+~ ]\s*(?=\S)/);
  const lastSegment = segments[segments.length - 1];

  const match = lastSegment.match(PSEUDO_CLASS_REGEX);
  if (!match) return null;

  const pseudoClass = match[1] as PseudoClass;
  // セレクタ全体から疑似クラス部分を除去してベースセレクタを作成
  const baseSelector = selector.replace(
    new RegExp(`:${pseudoClass.replace('-', '\\-')}`, 'g'),
    '',
  );

  return { pseudoClass, baseSelector };
}

/**
 * CSSルールのセレクタとスタイルから疑似クラスの差分スタイルを抽出する。
 * テスト容易性のために、CSSStyleRuleではなくセレクタ文字列とスタイルを受け取る。
 *
 * @param selectorText ルールのセレクタ文字列
 * @param ruleStyle CSSプロパティ名→値のマップ（CSSStyleDeclaration相当）
 * @param baseStyles 通常状態のNormalizedStyles
 * @returns 疑似クラス名と差分スタイル、またはnull
 */
export function extractPseudoStylesFromRule(
  selectorText: string,
  ruleStyle: Record<string, string>,
  baseStyles: NormalizedStyles,
): { pseudoClass: PseudoClass; diffStyles: Partial<NormalizedStyles> } | null {
  const parsed = parsePseudoSelector(selectorText);
  if (!parsed) return null;

  const diffStyles: Partial<NormalizedStyles> = {};
  let hasDiff = false;

  for (const [cssProp, normalizedKey] of Object.entries(CSS_TO_NORMALIZED)) {
    const value = ruleStyle[cssProp];
    if (!value || value === '') continue;

    // 通常スタイルと同じ値ならスキップ
    const baseValue = baseStyles[normalizedKey];
    if (baseValue === value) continue;

    (diffStyles as Record<string, string>)[normalizedKey] = value;
    hasDiff = true;
  }

  if (!hasDiff) return null;

  return { pseudoClass: parsed.pseudoClass, diffStyles };
}

/**
 * CSSOM全体を走査して、指定要素の疑似クラススタイル差分を収集する。
 * クロスオリジンのスタイルシートは SecurityError をキャッチしてスキップ。
 *
 * @param element 対象要素
 * @param baseStyles 通常状態のスタイル
 * @returns 疑似クラスごとの差分スタイルマップ（差分がなければundefined）
 */
export function extractPseudoStyles(
  element: Element,
  baseStyles: NormalizedStyles,
): PseudoStyleMap | undefined {
  const result: PseudoStyleMap = {};
  let hasAny = false;

  for (const sheet of document.styleSheets) {
    let cssRules: CSSRuleList;
    try {
      cssRules = sheet.cssRules;
    } catch {
      continue;
    }
    collectPseudoRules(cssRules, element, baseStyles, result);
  }

  for (const pc of PSEUDO_CLASS_LIST) {
    if (result[pc] && Object.keys(result[pc]!).length > 0) {
      hasAny = true;
    }
  }

  return hasAny ? result : undefined;
}

function collectPseudoRules(
  ruleList: CSSRuleList,
  element: Element,
  baseStyles: NormalizedStyles,
  result: PseudoStyleMap,
): void {
  for (const rule of ruleList) {
    if (rule instanceof CSSStyleRule) {
      // セレクタにカンマがある場合、個別に処理
      const selectors = rule.selectorText.split(',').map((s) => s.trim());
      for (const selector of selectors) {
        const parsed = parsePseudoSelector(selector);
        if (!parsed) continue;

        // ベースセレクタで要素マッチ確認
        try {
          if (!element.matches(parsed.baseSelector)) continue;
        } catch {
          continue;
        }

        // ルールのスタイルを Record に変換
        const ruleStyle: Record<string, string> = {};
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          ruleStyle[prop] = rule.style.getPropertyValue(prop);
        }

        const extracted = extractPseudoStylesFromRule(
          selector,
          ruleStyle,
          baseStyles,
        );
        if (!extracted) continue;

        // 後勝ちでマージ
        const existing = result[extracted.pseudoClass] ?? {};
        result[extracted.pseudoClass] = { ...existing, ...extracted.diffStyles };
      }
    } else if (
      rule instanceof CSSMediaRule ||
      rule instanceof CSSSupportsRule
    ) {
      collectPseudoRules(rule.cssRules, element, baseStyles, result);
    }
  }
}
```

ファイル先頭の import 文を更新:
```typescript
import type { NormalizedStyles, PseudoClass, PseudoStyleMap } from '../shared/types';
```

- [ ] **Step 4: テストが成功することを確認**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx vitest run tests/pseudo-style-extractor.test.ts`
Expected: PASS

- [ ] **Step 5: 型チェックを実行**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx tsc --noEmit`
Expected: 成功

- [ ] **Step 6: コミット**

```bash
git add src/content/style-extractor.ts tests/pseudo-style-extractor.test.ts
git commit -m "feat: add CSSOM-based pseudo-class style extraction"
```

---

### Task 3: dom-extractor に疑似クラススタイル収集を統合

**Files:**
- Modify: `src/content/dom-extractor.ts:1-114`

- [ ] **Step 1: dom-extractor.ts を更新して疑似クラススタイルを収集**

`src/content/dom-extractor.ts` の import 文に `extractPseudoStyles` を追加:

```typescript
import { extractStyles, extractPseudoStyles } from './style-extractor';
```

`walk` 関数内で `extractStyles` の直後に疑似クラススタイル抽出を追加（`const styles = extractStyles(el);` の後）:

```typescript
const styles = extractStyles(el);
const pseudoStyles = isSvg ? undefined : extractPseudoStyles(el, styles);
```

return文に `pseudoStyles` を追加:

```typescript
return {
  type: 'element',
  tagName,
  attributes: isSvg ? extractSvgAttributes(el) : extractHtmlAttributes(el),
  children,
  styles,
  parentStyles,
  sizeInfo,
  pseudoStyles,
};
```

- [ ] **Step 2: 型チェック・テストを実行**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx tsc --noEmit && npx vitest run`
Expected: 全て成功

- [ ] **Step 3: コミット**

```bash
git add src/content/dom-extractor.ts
git commit -m "feat: collect pseudo-class styles during DOM extraction"
```

---

### Task 4: tailwind-mapper で疑似クラスプレフィックス付きクラスを生成

**Files:**
- Modify: `src/content/tailwind-mapper.ts:1-813`
- Test: `tests/tailwind-mapper.test.ts:1-496`

- [ ] **Step 1: テストを追加**

`tests/tailwind-mapper.test.ts` の末尾（最後の `});` の前）に以下のテストを追加:

```typescript
  // ─── Pseudo-class style tests ───

  it('generates hover: prefixed classes for pseudo styles', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      children: [],
      styles: { display: 'block', position: 'static', backgroundColor: 'rgb(255, 255, 255)' },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        hover: { backgroundColor: 'rgb(59, 130, 246)' },
      },
    };

    const output = convertToOutput(node);
    expect(output.classList).toContain('bg-white');
    expect(output.classList).toContain('hover:bg-[#3b82f6]');
  });

  it('generates multiple pseudo-class prefixes', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      children: [],
      styles: { display: 'block', position: 'static', backgroundColor: 'rgb(255, 255, 255)' },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        hover: { backgroundColor: 'rgb(59, 130, 246)' },
        active: { backgroundColor: 'rgb(29, 78, 216)' },
      },
    };

    const output = convertToOutput(node);
    expect(output.classList).toContain('bg-white');
    expect(output.classList).toContain('hover:bg-[#3b82f6]');
    expect(output.classList).toContain('active:bg-[#1d4ed8]');
  });

  it('groups pseudo classes by property (base → hover → active → ...)', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      children: [],
      styles: {
        display: 'block',
        position: 'static',
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(0, 0, 0)',
      },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        hover: { backgroundColor: 'rgb(59, 130, 246)', color: 'rgb(255, 255, 255)' },
        active: { backgroundColor: 'rgb(29, 78, 216)' },
      },
    };

    const output = convertToOutput(node);
    // bg-white → hover:bg-... → active:bg-... → text-black → hover:text-...
    const bgWhiteIdx = output.classList.indexOf('bg-white');
    const hoverBgIdx = output.classList.indexOf('hover:bg-[#3b82f6]');
    const activeBgIdx = output.classList.indexOf('active:bg-[#1d4ed8]');
    const textBlackIdx = output.classList.indexOf('text-black');
    const hoverTextIdx = output.classList.indexOf('hover:text-white');

    expect(bgWhiteIdx).toBeLessThan(hoverBgIdx);
    expect(hoverBgIdx).toBeLessThan(activeBgIdx);
    expect(activeBgIdx).toBeLessThan(textBlackIdx);
    expect(textBlackIdx).toBeLessThan(hoverTextIdx);
  });

  it('does not generate pseudo inline styles (no fallback for pseudo)', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      children: [],
      styles: { display: 'block', position: 'static' },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        hover: { backgroundColor: 'rgb(59, 130, 246)' },
      },
    };

    const output = convertToOutput(node);
    // inline style にはhover用のスタイルが含まれないこと
    expect(Object.keys(output.style)).toEqual([]);
  });

  it('skips pseudo styles for SVG elements', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'svg',
      attributes: {},
      children: [],
      styles: { display: 'inline', position: 'static' },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        hover: { color: 'rgb(255, 0, 0)' },
      },
    };

    const output = convertToOutput(node);
    expect(output.classList).toEqual([]);
  });

  it('handles focus-visible prefix', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'input',
      attributes: {},
      children: [],
      styles: { display: 'inline-block', position: 'static' },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        'focus-visible': { backgroundColor: 'rgb(240, 240, 255)' },
      },
    };

    const output = convertToOutput(node);
    expect(output.classList).toContain('focus-visible:bg-[#f0f0ff]');
  });

  it('handles focus-within prefix', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'div',
      attributes: {},
      children: [],
      styles: { display: 'block', position: 'static' },
      sizeInfo: { widthAuthored: false, heightAuthored: false },
      pseudoStyles: {
        'focus-within': { backgroundColor: 'rgb(240, 240, 240)' },
      },
    };

    const output = convertToOutput(node);
    expect(output.classList).toContain('focus-within:bg-[#f0f0f0]');
  });
```

テストファイルの import 文に `convertToOutput` を追加:
```typescript
import {
  parsePx,
  rgbToHex,
  mapStylesToTailwind,
  convertToOutput,
} from '../src/content/tailwind-mapper';
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx vitest run tests/tailwind-mapper.test.ts`
Expected: FAIL（疑似クラスの処理が未実装）

- [ ] **Step 3: `convertToOutput` を更新して疑似クラスクラスを生成**

`src/content/tailwind-mapper.ts` の import 文を更新:
```typescript
import type {
  ExtractedNode,
  ExtractedChild,
  NormalizedStyles,
  OutputNode,
  OutputChild,
  SizeInfo,
  PseudoClass,
} from '../shared/types';
```

ファイル先頭付近に `PSEUDO_CLASS_LIST` の import を追加:
```typescript
import { PSEUDO_CLASS_LIST } from './style-extractor';
```

`convertToOutput` 関数（796行目付近）を以下のように書き換え:

```typescript
export function convertToOutput(node: ExtractedNode): OutputNode {
  const { classes: baseClasses, inlineStyles } = mapStylesToTailwind(
    node.styles,
    node.tagName,
    node.parentStyles,
    node.sizeInfo,
  );

  // 疑似クラスの差分クラスを生成
  const pseudoClassMap = new Map<PseudoClass, string[]>();
  if (node.pseudoStyles && !SVG_ELEMENTS.has(node.tagName)) {
    for (const pc of PSEUDO_CLASS_LIST) {
      const pseudoStyle = node.pseudoStyles[pc];
      if (!pseudoStyle) continue;

      const { classes: pseudoClasses } = mapStylesToTailwind(
        pseudoStyle as NormalizedStyles,
        node.tagName,
      );
      if (pseudoClasses.length > 0) {
        pseudoClassMap.set(
          pc,
          pseudoClasses.map((cls) => `${pc}:${cls}`),
        );
      }
    }
  }

  // プロパティグループ単位でソート: base → hover → active → focus → ...
  const classList = interleaveWithPseudo(baseClasses, pseudoClassMap);

  return {
    type: 'element',
    tagName: node.tagName,
    attributes: node.attributes,
    classList,
    style: inlineStyles,
    children: node.children.map(convertChild),
  };
}
```

`convertToOutput` の直前に `interleaveWithPseudo` 関数を追加:

```typescript
/**
 * ベースクラスと疑似クラスのクラスをプロパティグループ単位でインターリーブする。
 *
 * 例: baseClasses = ['bg-white', 'text-black']
 *      pseudoClassMap = { hover: ['hover:bg-blue-500', 'hover:text-white'], active: ['active:bg-blue-700'] }
 * → ['bg-white', 'hover:bg-blue-500', 'active:bg-blue-700', 'text-black', 'hover:text-white']
 *
 * マッチングロジック: ベースクラスの「プロパティプレフィックス」を抽出し、
 * 疑似クラス側のクラスが同じプレフィックスを持つか判定する。
 */
function interleaveWithPseudo(
  baseClasses: string[],
  pseudoClassMap: Map<PseudoClass, string[]>,
): string[] {
  if (pseudoClassMap.size === 0) return baseClasses;

  const result: string[] = [];
  // 疑似クラスのクラスを消費済みかトラッキング
  const consumed = new Map<PseudoClass, Set<number>>();
  for (const [pc] of pseudoClassMap) {
    consumed.set(pc, new Set());
  }

  for (const baseClass of baseClasses) {
    result.push(baseClass);
    const basePrefix = extractClassPrefix(baseClass);

    // 各疑似クラスの同一プレフィックスクラスを追加（hover → active → focus → ...）
    for (const pc of PSEUDO_CLASS_LIST) {
      const pseudoClasses = pseudoClassMap.get(pc);
      if (!pseudoClasses) continue;

      for (let i = 0; i < pseudoClasses.length; i++) {
        if (consumed.get(pc)!.has(i)) continue;
        const pseudoClass = pseudoClasses[i];
        // "hover:bg-blue-500" → "bg-blue-500" → プレフィックス抽出
        const unprefixed = pseudoClass.replace(/^[a-z-]+:/, '');
        const pseudoPrefix = extractClassPrefix(unprefixed);
        if (pseudoPrefix === basePrefix) {
          result.push(pseudoClass);
          consumed.get(pc)!.add(i);
        }
      }
    }
  }

  // 残りの未消費疑似クラスを末尾に追加
  for (const pc of PSEUDO_CLASS_LIST) {
    const pseudoClasses = pseudoClassMap.get(pc);
    if (!pseudoClasses) continue;
    for (let i = 0; i < pseudoClasses.length; i++) {
      if (!consumed.get(pc)!.has(i)) {
        result.push(pseudoClasses[i]);
      }
    }
  }

  return result;
}

/**
 * Tailwindクラスからプロパティプレフィックスを抽出する。
 * 例: "bg-white" → "bg", "text-sm" → "text", "p-4" → "p",
 *     "rounded-lg" → "rounded", "font-bold" → "font"
 */
function extractClassPrefix(cls: string): string {
  // arbitrary value: "bg-[#fff]" → "bg"
  const arbMatch = cls.match(/^([a-z-]+?)-\[/);
  if (arbMatch) return arbMatch[1];

  // 既知のパターン
  const dashIdx = cls.indexOf('-');
  if (dashIdx === -1) return cls; // "flex", "hidden", "block" etc.
  return cls.substring(0, dashIdx);
}
```

- [ ] **Step 4: テストが成功することを確認**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx vitest run tests/tailwind-mapper.test.ts`
Expected: PASS

- [ ] **Step 5: 全テストと型チェックを実行**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npx tsc --noEmit && npx vitest run`
Expected: 全て成功

- [ ] **Step 6: コミット**

```bash
git add src/content/tailwind-mapper.ts tests/tailwind-mapper.test.ts
git commit -m "feat: generate pseudo-class prefixed Tailwind classes with property-grouped ordering"
```

---

### Task 5: リント・フォーマット・最終確認

**Files:** 全ファイル

- [ ] **Step 1: lint を実行**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npm run lint`
Expected: エラーなし（警告のみ許容）

- [ ] **Step 2: lint エラーがあれば修正**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npm run lint:fix`

- [ ] **Step 3: format を実行**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npm run format`

- [ ] **Step 4: 全テスト・型チェックの最終確認**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npm run typecheck && npm run test`
Expected: 全て成功

- [ ] **Step 5: ビルド確認**

Run: `cd /Users/tanakatakuto/Documents/GitHub/reversewind && npm run build`
Expected: ビルド成功

- [ ] **Step 6: format/lint修正分があればコミット**

```bash
git add -A
git commit -m "chore: lint and format fixes"
```
