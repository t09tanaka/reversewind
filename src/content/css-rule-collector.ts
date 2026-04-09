/**
 * document.styleSheets の CSSOM を走査するためのユーティリティ。
 * DOM・CSSOM を一切変更しない。
 *
 * 2 つのAPIを提供する:
 *  - collectCSSRules(): すべての CSSStyleRule をフラットに集める（@media 等の条件は無視）
 *  - collectAuthoredLonghandValues(): 要素に実際に適用されている authored longhand 値を取得する
 *    （@media は matchMedia で評価し、document 順の後勝ちで上書きする）
 */

/**
 * document.styleSheets からすべての CSSStyleRule を（@media 等を無視して）フラットに収集する。
 * クロスオリジンで読めないシートはスキップする。
 */
export function collectCSSRules(): CSSStyleRule[] {
  const rules: CSSStyleRule[] = [];
  for (const sheet of document.styleSheets) {
    let cssRules: CSSRuleList;
    try {
      cssRules = sheet.cssRules;
    } catch {
      continue;
    }
    collectAllStyleRules(cssRules, rules);
  }
  return rules;
}

function collectAllStyleRules(
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
      // @media / @supports / @layer / @container のネストを再帰
      collectAllStyleRules((rule as CSSGroupingRule).cssRules, out);
    }
  }
}

/**
 * 要素に実際にマッチするルールから、指定された longhand プロパティの authored 値を取得する。
 *
 * - @media はその時点の matchMedia で評価
 * - @supports / @layer / @container は常にネストを辿る（ブラウザが既に apply 判定済みのため）
 * - 同じプロパティを複数ルールが設定している場合、document 順で後に現れたものが勝つ
 *   （specificity は考慮しない — 近似）
 * - inline style は最後に上書きするので最優先
 *
 * 戻り値は Map<longhand-name, authored-value> で、設定されたプロパティだけが入っている。
 */
export function collectAuthoredLonghandValues(
  element: Element,
  longhands: readonly string[],
): Map<string, string> {
  const out = new Map<string, string>();

  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    walkAuthoredRules(rules, element, longhands, out);
  }

  // inline style が最優先
  if (element instanceof HTMLElement) {
    for (const prop of longhands) {
      const v = element.style.getPropertyValue(prop);
      if (v) out.set(prop, v);
    }
  }

  return out;
}

function walkAuthoredRules(
  rules: CSSRuleList,
  element: Element,
  longhands: readonly string[],
  out: Map<string, string>,
): void {
  for (const rule of rules) {
    // @media: matchMedia で評価
    if (rule instanceof CSSMediaRule) {
      let matches = false;
      try {
        matches = window.matchMedia(rule.conditionText).matches;
      } catch {
        matches = false;
      }
      if (matches) {
        walkAuthoredRules(rule.cssRules, element, longhands, out);
      }
      continue;
    }

    // @supports: CSS.supports() で評価。非対応ブラウザでは安全側に skip
    if (
      typeof CSSSupportsRule !== 'undefined' &&
      rule instanceof CSSSupportsRule
    ) {
      let supported = false;
      try {
        supported =
          typeof CSS !== 'undefined' && CSS.supports(rule.conditionText);
      } catch {
        supported = false;
      }
      if (supported) {
        walkAuthoredRules(rule.cssRules, element, longhands, out);
      }
      continue;
    }

    // @layer (CSSLayerBlockRule): layer は条件付きではないので常に再帰
    // クラス名で判定（CSSLayerBlockRule は全環境で定義されていない可能性あり）
    if (rule.constructor.name === 'CSSLayerBlockRule' && 'cssRules' in rule) {
      walkAuthoredRules(
        (rule as CSSGroupingRule).cssRules,
        element,
        longhands,
        out,
      );
      continue;
    }

    // @container など JS から条件を評価できない grouping rule は保守的に skip
    // （強引に再帰すると非アクティブな宣言まで authored に混ざる）
    if (
      'cssRules' in rule &&
      !(rule instanceof CSSStyleRule) &&
      (rule as CSSGroupingRule).cssRules.length > 0
    ) {
      continue;
    }

    if (rule instanceof CSSStyleRule) {
      let match = false;
      try {
        match = element.matches(rule.selectorText);
      } catch {
        continue;
      }
      if (!match) continue;

      for (const prop of longhands) {
        const v = rule.style.getPropertyValue(prop);
        if (v) out.set(prop, v);
      }
    }
  }
}
