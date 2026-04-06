import { describe, it, expect } from 'vitest';
import {
  extractPseudoStylesFromRule,
  PSEUDO_CLASS_LIST,
  parsePseudoSelector,
} from '../src/content/style-extractor';

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

describe('parsePseudoSelector', () => {
  it('parses .btn:hover', () => {
    const result = parsePseudoSelector('.btn:hover');
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
    expect(result!.baseSelector).toBe('.btn');
  });

  it('parses .btn.primary:hover', () => {
    const result = parsePseudoSelector('.btn.primary:hover');
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
    expect(result!.baseSelector).toBe('.btn.primary');
  });

  it('parses .btn:focus-visible', () => {
    const result = parsePseudoSelector('.btn:focus-visible');
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus-visible');
    expect(result!.baseSelector).toBe('.btn');
  });

  it('parses .container:focus-within', () => {
    const result = parsePseudoSelector('.container:focus-within');
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus-within');
    expect(result!.baseSelector).toBe('.container');
  });

  it('returns null for selector without pseudo-class', () => {
    expect(parsePseudoSelector('.btn')).toBeNull();
  });

  it('returns null for ancestor pseudo-class (.card:hover .btn)', () => {
    const result = parsePseudoSelector('.card:hover .btn');
    expect(result).toBeNull();
  });

  it('returns null for ancestor pseudo-class with > combinator', () => {
    const result = parsePseudoSelector('.card:hover > .btn');
    expect(result).toBeNull();
  });

  it('parses Tailwind escaped selector .hover\\:bg-blue:hover', () => {
    const result = parsePseudoSelector('.hover\\:bg-blue:hover');
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
    expect(result!.baseSelector).toBe('.hover\\:bg-blue');
  });
});

describe('extractPseudoStylesFromRule', () => {
  it('extracts hover background-color', () => {
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(0, 0, 255)',
    };

    const result = extractPseudoStylesFromRule('.btn:hover', ruleStyle);
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
    expect(result!.diffStyles.backgroundColor).toBe('rgb(0, 0, 255)');
  });

  it('extracts focus-visible styles', () => {
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(240, 240, 255)',
    };

    const result = extractPseudoStylesFromRule('.btn:focus-visible', ruleStyle);
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus-visible');
  });

  it('extracts focus-within styles', () => {
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(240, 240, 240)',
    };

    const result = extractPseudoStylesFromRule(
      '.container:focus-within',
      ruleStyle,
    );
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus-within');
    expect(result!.diffStyles.backgroundColor).toBe('rgb(240, 240, 240)');
  });

  it('returns null for selector without pseudo-class', () => {
    const result = extractPseudoStylesFromRule('.btn', {
      'background-color': 'red',
    });
    expect(result).toBeNull();
  });

  it('returns null for ancestor pseudo-class', () => {
    const result = extractPseudoStylesFromRule('.card:hover .btn', {
      color: 'red',
    });
    expect(result).toBeNull();
  });

  it('extracts properties even when same as computed style', () => {
    // 右クリック時は hover 適用済みの computed style が返されるため、
    // CSSOMルールの値はそのまま採用する（差分チェックしない）
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(0, 0, 255)',
    };

    const result = extractPseudoStylesFromRule('.btn:hover', ruleStyle);
    expect(result).not.toBeNull();
    expect(result!.diffStyles.backgroundColor).toBe('rgb(0, 0, 255)');
  });

  it('extracts multiple properties at once', () => {
    const ruleStyle: Record<string, string> = {
      'background-color': 'rgb(0, 0, 255)',
      color: 'rgb(255, 255, 255)',
    };

    const result = extractPseudoStylesFromRule('.btn:hover', ruleStyle);
    expect(result).not.toBeNull();
    expect(result!.diffStyles.backgroundColor).toBe('rgb(0, 0, 255)');
    expect(result!.diffStyles.color).toBe('rgb(255, 255, 255)');
  });

  it('extracts border-top/bottom on hover', () => {
    const ruleStyle: Record<string, string> = {
      'border-top': '2px solid rgb(0, 0, 255)',
      'border-bottom': '2px solid rgb(0, 0, 255)',
    };

    const result = extractPseudoStylesFromRule('.btn:hover', ruleStyle);
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('hover');
    expect(result!.diffStyles.borderTop).toBe('2px solid rgb(0, 0, 255)');
    expect(result!.diffStyles.borderBottom).toBe('2px solid rgb(0, 0, 255)');
    expect(result!.diffStyles.borderRight).toBeUndefined();
    expect(result!.diffStyles.borderLeft).toBeUndefined();
  });

  it('extracts margin-top/padding-left on focus', () => {
    const ruleStyle: Record<string, string> = {
      'margin-top': '4px',
      'padding-left': '24px',
    };

    const result = extractPseudoStylesFromRule('.btn:focus', ruleStyle);
    expect(result).not.toBeNull();
    expect(result!.pseudoClass).toBe('focus');
    expect(result!.diffStyles.margin?.top).toBe('4px');
    expect(result!.diffStyles.padding?.left).toBe('24px');
  });

  it('returns null for empty rule style', () => {
    const result = extractPseudoStylesFromRule('.btn:hover', {});
    expect(result).toBeNull();
  });
});
