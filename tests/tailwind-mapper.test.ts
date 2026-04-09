import { describe, it, expect } from 'vitest';
import {
  parsePx,
  rgbToHex,
  normalizeColor,
  mapStylesToTailwind,
  convertToOutput,
} from '../src/content/tailwind-mapper';
import type { NormalizedStyles, SizeInfo } from '../src/shared/types';

describe('parsePx', () => {
  it('parses valid px values', () => {
    expect(parsePx('16px')).toBe(16);
    expect(parsePx('0px')).toBe(0);
    expect(parsePx('1.5px')).toBe(1.5);
  });

  it('returns null for non-px values', () => {
    expect(parsePx('auto')).toBeNull();
    expect(parsePx('100%')).toBeNull();
    expect(parsePx(undefined)).toBeNull();
    expect(parsePx('')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('converts rgb to hex', () => {
    expect(rgbToHex('rgb(255, 255, 255)')).toBe('#ffffff');
    expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
    expect(rgbToHex('rgb(17, 24, 39)')).toBe('#111827');
  });

  it('handles transparent', () => {
    expect(rgbToHex('rgba(0, 0, 0, 0)')).toBe('transparent');
    expect(rgbToHex('transparent')).toBe('transparent');
  });

  it('handles rgba with alpha', () => {
    expect(rgbToHex('rgba(255, 255, 255, 0.7)')).toBe('rgba(255,255,255,0.7)');
  });

  it('returns original string for non-rgb colors in non-browser env', () => {
    // Canvas APIが使えないNode.js環境では元の文字列がそのまま返る
    expect(rgbToHex('oklch(0.982 0.018 155.826)')).toBe(
      'oklch(0.982 0.018 155.826)',
    );
    expect(rgbToHex('oklab(0.5 0.1 -0.1)')).toBe('oklab(0.5 0.1 -0.1)');
  });

  it('handles hex strings returned by Canvas API (via normalizeColor)', () => {
    // Canvas APIが "#rrggbb" を返した場合のパスを直接テスト
    expect(rgbToHex('#f0fdf4')).toBe('#f0fdf4');
    expect(rgbToHex('#bbf7d0')).toBe('#bbf7d0');
  });
});

describe('normalizeColor', () => {
  it('returns original string in non-browser environment', () => {
    // Node.js環境ではdocumentが存在しないため元の文字列を返す
    expect(normalizeColor('oklch(0.982 0.018 155.826)')).toBe(
      'oklch(0.982 0.018 155.826)',
    );
  });
});

describe('mapStylesToTailwind', () => {
  function makeStyles(overrides: Partial<NormalizedStyles>): NormalizedStyles {
    return {
      display: 'block',
      position: 'static',
      ...overrides,
    };
  }

  it('maps display: flex', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ display: 'flex' }));
    expect(classes).toContain('flex');
  });

  it('maps display: none to hidden', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ display: 'none' }));
    expect(classes).toContain('hidden');
  });

  it('skips default display for tag', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'block' }),
      'div',
    );
    expect(classes).not.toContain('block');
  });

  it('outputs non-default display for tag', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'block' }),
      'span',
    );
    expect(classes).toContain('block');
  });

  it('maps position', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ position: 'absolute' }),
    );
    expect(classes).toContain('absolute');
  });

  it('skips position: static', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ position: 'static' }));
    expect(classes).not.toContain('static');
  });

  it('maps padding', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        padding: {
          top: '16px',
          right: '16px',
          bottom: '16px',
          left: '16px',
        },
      }),
    );
    expect(classes).toContain('p-4');
  });

  it('maps padding x/y', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        padding: {
          top: '8px',
          right: '16px',
          bottom: '8px',
          left: '16px',
        },
      }),
    );
    expect(classes).toContain('py-2');
    expect(classes).toContain('px-4');
  });

  it('maps font-size to standard utility', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ fontSize: '14px' }));
    expect(classes).toContain('text-sm');
  });

  it('maps font-size to arbitrary value', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ fontSize: '13px' }));
    expect(classes).toContain('text-[13px]');
  });

  it('maps font-weight', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ fontWeight: '500' }));
    expect(classes).toContain('font-medium');
  });

  it('skips font-weight 400 (normal/default)', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ fontWeight: '400' }));
    expect(classes).not.toContain('font-normal');
  });

  it('maps border-radius to standard utility', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '8px' }),
    );
    expect(classes).toContain('rounded-lg');
  });

  it('maps border-radius to arbitrary value', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '10px' }),
    );
    expect(classes).toContain('rounded-[10px]');
  });

  it('maps 9999px to rounded-full', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '9999px' }),
    );
    expect(classes).toContain('rounded-full');
  });

  it('maps 999px to rounded-full', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '999px' }),
    );
    expect(classes).toContain('rounded-full');
  });

  it('maps 50% to rounded-full', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '50%' }),
    );
    expect(classes).toContain('rounded-full');
  });

  it('detects rounded-full via size heuristic (br >= min(w,h)/2)', () => {
    // 32x32 with br 16px → 円
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '16px', width: '32px', height: '32px' }),
    );
    expect(classes).toContain('rounded-full');
    expect(classes).not.toContain('rounded-2xl');
  });

  it('detects rounded-full via size heuristic on pill shape', () => {
    // 80x32 with br 16px → ピル形状（短辺32の半分16に等しい）
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '16px', width: '80px', height: '32px' }),
    );
    expect(classes).toContain('rounded-full');
  });

  it('does not mark as rounded-full when br smaller than half of min side', () => {
    // 32x32 with br 12px → 12 < 16 なので rounded-xl のまま
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '12px', width: '32px', height: '32px' }),
    );
    expect(classes).toContain('rounded-xl');
    expect(classes).not.toContain('rounded-full');
  });

  it('falls back to >=999 heuristic when size is unknown', () => {
    // サイズ情報なしでは視覚判定不可 → 999px フォールバック
    const { classes } = mapStylesToTailwind(
      makeStyles({ borderRadius: '9999px' }),
    );
    expect(classes).toContain('rounded-full');
  });

  it('maps background color', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ backgroundColor: 'rgb(255, 255, 255)' }),
    );
    expect(classes).toContain('bg-white');
  });

  it('skips transparent background', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ backgroundColor: 'rgba(0, 0, 0, 0)' }),
    );
    expect(classes).not.toContain('bg-transparent');
  });

  it('maps text color to hex arbitrary', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ color: 'rgb(17, 24, 39)' }),
    );
    expect(classes).toContain('text-[#111827]');
  });

  it('maps gap', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'flex', gap: '8px' }),
    );
    expect(classes).toContain('gap-2');
  });

  it('maps flex-direction column', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'flex', flexDirection: 'column' }),
    );
    expect(classes).toContain('flex');
    expect(classes).toContain('flex-col');
  });

  it('maps justify-content and align-items', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }),
    );
    expect(classes).toContain('justify-center');
    expect(classes).toContain('items-center');
  });

  it('skips default justify-content and align-items', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'flex',
        justifyContent: 'normal',
        alignItems: 'normal',
      }),
    );
    expect(classes).not.toContain('justify-normal');
    expect(classes).not.toContain('items-stretch');
  });

  it('maps opacity', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ opacity: '0.5' }));
    expect(classes).toContain('opacity-50');
  });

  it('maps overflow hidden', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ overflow: 'hidden' }));
    expect(classes).toContain('overflow-hidden');
  });

  it('passes fallback styles through', () => {
    const { inlineStyles } = mapStylesToTailwind(
      makeStyles({
        fallback: { 'backdrop-filter': 'blur(10px)' },
      }),
    );
    expect(inlineStyles['backdrop-filter']).toBe('blur(10px)');
  });

  it('maps text-align center', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ textAlign: 'center' }),
    );
    expect(classes).toContain('text-center');
  });

  it('skips text-align start (default)', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ textAlign: 'start' }));
    expect(classes).not.toContain('text-start');
    expect(classes).not.toContain('text-left');
  });

  it('maps whitespace nowrap', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ whiteSpace: 'nowrap' }),
    );
    expect(classes).toContain('whitespace-nowrap');
  });

  it('maps width when sizeInfo not provided', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ width: '123px' }));
    expect(classes).toContain('w-[123px]');
  });

  it('maps width 100% to w-full', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ width: '100%' }));
    expect(classes).toContain('w-full');
  });

  it('skips min-w-0 and min-h-0 (defaults)', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ minWidth: '0px', minHeight: '0px' }),
    );
    expect(classes).not.toContain('min-w-0');
    expect(classes).not.toContain('min-h-0');
  });

  // ─── box-shadow: 元の値を維持 ───

  it('keeps box-shadow as inline style', () => {
    const { classes, inlineStyles } = mapStylesToTailwind(
      makeStyles({ boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 8px 0px' }),
    );
    expect(inlineStyles['box-shadow']).toBe(
      'rgba(0, 0, 0, 0.08) 0px 2px 8px 0px',
    );
    expect(classes).not.toContain('shadow-sm');
    expect(classes).not.toContain('shadow');
  });

  // ─── Inherited property tests ───

  it('skips inherited color from parent', () => {
    const parentStyles: NormalizedStyles = { color: 'rgb(17, 24, 39)' };
    const { classes } = mapStylesToTailwind(
      makeStyles({ color: 'rgb(17, 24, 39)' }),
      'span',
      parentStyles,
    );
    expect(classes).not.toContain('text-[#111827]');
  });

  it('outputs color when different from parent', () => {
    const parentStyles: NormalizedStyles = { color: 'rgb(17, 24, 39)' };
    const { classes } = mapStylesToTailwind(
      makeStyles({ color: 'rgb(255, 0, 0)' }),
      'span',
      parentStyles,
    );
    expect(classes).toContain('text-[#ff0000]');
  });

  it('skips inherited font-size from parent', () => {
    const parentStyles: NormalizedStyles = { fontSize: '14px' };
    const { classes } = mapStylesToTailwind(
      makeStyles({ fontSize: '14px' }),
      'span',
      parentStyles,
    );
    expect(classes).not.toContain('text-sm');
  });

  it('skips inherited font-weight from parent', () => {
    const parentStyles: NormalizedStyles = { fontWeight: '600' };
    const { classes } = mapStylesToTailwind(
      makeStyles({ fontWeight: '600' }),
      'span',
      parentStyles,
    );
    expect(classes).not.toContain('font-semibold');
  });

  it('skips inherited line-height from parent', () => {
    const parentStyles: NormalizedStyles = { lineHeight: '21.7px' };
    const { classes } = mapStylesToTailwind(
      makeStyles({ lineHeight: '21.7px' }),
      'span',
      parentStyles,
    );
    expect(classes).not.toContain('leading-[21.7px]');
  });

  // ─── Line height tests ───

  it('outputs leading-none when line-height equals font-size', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ fontSize: '14px', lineHeight: '14px' }),
    );
    expect(classes).toContain('leading-none');
  });

  it('does not output leading for normal line-heights', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ lineHeight: '21.7px' }),
    );
    const leadingClasses = classes.filter((c) => c.startsWith('leading-'));
    expect(leadingClasses).toEqual([]);
  });

  it('does not output leading for standard line-heights', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ lineHeight: '24px' }));
    const leadingClasses = classes.filter((c) => c.startsWith('leading-'));
    expect(leadingClasses).toEqual([]);
  });

  it('skips inherited text-align from parent', () => {
    const parentStyles: NormalizedStyles = { textAlign: 'center' };
    const { classes } = mapStylesToTailwind(
      makeStyles({ textAlign: 'center' }),
      'span',
      parentStyles,
    );
    expect(classes).not.toContain('text-center');
  });

  it('outputs color when no parent', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ color: 'rgb(17, 24, 39)' }),
      'button',
    );
    expect(classes).toContain('text-[#111827]');
  });

  // ─── Gap normalization tests ───

  it('outputs only gap when row-gap and column-gap match', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'flex',
        gap: '8px',
        rowGap: '8px',
        columnGap: '8px',
      }),
    );
    expect(classes).toContain('gap-2');
    expect(classes).not.toContain('gap-y-2');
    expect(classes).not.toContain('gap-x-2');
  });

  it('outputs individual gaps when no gap shorthand', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'flex',
        gap: '0px',
        rowGap: '8px',
        columnGap: '16px',
      }),
    );
    expect(classes).toContain('gap-y-2');
    expect(classes).toContain('gap-x-4');
    expect(classes).not.toContain('gap-0');
  });

  // ─── Size authored tests ───

  it('skips width/height when sizeInfo says not authored', () => {
    const sizeInfo: SizeInfo = {
      widthAuthored: false,
      heightAuthored: false,
    };
    const { classes } = mapStylesToTailwind(
      makeStyles({ width: '188.859px', height: '45.6875px' }),
      'button',
      undefined,
      sizeInfo,
    );
    expect(classes).not.toContain('w-[188.859px]');
    expect(classes).not.toContain('h-[45.6875px]');
  });

  it('outputs width when sizeInfo says authored', () => {
    const sizeInfo: SizeInfo = {
      widthAuthored: true,
      heightAuthored: false,
    };
    const { classes } = mapStylesToTailwind(
      makeStyles({ width: '300px', height: '45.6875px' }),
      'button',
      undefined,
      sizeInfo,
    );
    expect(classes).toContain('w-[300px]');
    expect(classes).not.toContain('h-[45.6875px]');
  });

  it('outputs both when sizeInfo says both authored', () => {
    const sizeInfo: SizeInfo = {
      widthAuthored: true,
      heightAuthored: true,
    };
    const { classes } = mapStylesToTailwind(
      makeStyles({ width: '300px', height: '200px' }),
      'div',
      undefined,
      sizeInfo,
    );
    expect(classes).toContain('w-[300px]');
    expect(classes).toContain('h-[200px]');
  });

  // ─── SVG skip tests ───

  it('returns empty classes for svg elements', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'inline',
        color: 'rgb(0, 0, 0)',
        fontSize: '14px',
      }),
      'svg',
    );
    expect(classes).toEqual([]);
  });

  it('returns empty classes for path elements', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'inline',
        color: 'rgb(0, 0, 0)',
      }),
      'path',
    );
    expect(classes).toEqual([]);
  });

  // ─── Pseudo-class style tests ───

  it('generates hover: prefixed classes for pseudo styles', () => {
    const node: import('../src/shared/types').ExtractedNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      children: [],
      styles: {
        display: 'block',
        position: 'static',
        backgroundColor: 'rgb(255, 255, 255)',
      },
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
      styles: {
        display: 'block',
        position: 'static',
        backgroundColor: 'rgb(255, 255, 255)',
      },
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
        hover: {
          backgroundColor: 'rgb(59, 130, 246)',
          color: 'rgb(255, 255, 255)',
        },
        active: { backgroundColor: 'rgb(29, 78, 216)' },
      },
    };

    const output = convertToOutput(node);
    const bgWhiteIdx = output.classList.indexOf('bg-white');
    const hoverBgIdx = output.classList.indexOf('hover:bg-[#3b82f6]');
    const activeBgIdx = output.classList.indexOf('active:bg-[#1d4ed8]');
    const textBlackIdx = output.classList.indexOf('text-black');
    const hoverTextIdx = output.classList.indexOf('hover:text-white');

    expect(bgWhiteIdx).toBeGreaterThanOrEqual(0);
    expect(hoverBgIdx).toBeGreaterThanOrEqual(0);
    expect(activeBgIdx).toBeGreaterThanOrEqual(0);
    expect(textBlackIdx).toBeGreaterThanOrEqual(0);
    expect(hoverTextIdx).toBeGreaterThanOrEqual(0);

    expect(bgWhiteIdx).toBeLessThan(hoverBgIdx);
    expect(hoverBgIdx).toBeLessThan(activeBgIdx);
    expect(activeBgIdx).toBeLessThan(textBlackIdx);
    expect(textBlackIdx).toBeLessThan(hoverTextIdx);
  });

  it('does not generate pseudo inline styles', () => {
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

  // ─── individual border side tests ───

  it('outputs border-t for top-only border', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        borderTop: '1px solid rgb(0, 0, 0)',
        borderRight: '0px solid rgb(0, 0, 0)',
        borderBottom: '0px solid rgb(0, 0, 0)',
        borderLeft: '0px solid rgb(0, 0, 0)',
      }),
    );
    expect(classes).toContain('border-t');
    expect(classes).not.toContain('border');
    expect(classes).not.toContain('border-r');
  });

  it('outputs border-b-2 for bottom-only 2px border', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        borderTop: '0px solid rgb(0, 0, 0)',
        borderRight: '0px solid rgb(0, 0, 0)',
        borderBottom: '2px solid rgb(0, 0, 0)',
        borderLeft: '0px solid rgb(0, 0, 0)',
      }),
    );
    expect(classes).toContain('border-b-2');
    expect(classes).not.toContain('border');
  });

  it('outputs border color for single-side border', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        borderTop: '1px solid rgb(200, 200, 200)',
        borderRight: '0px solid rgb(0, 0, 0)',
        borderBottom: '0px solid rgb(0, 0, 0)',
        borderLeft: '0px solid rgb(0, 0, 0)',
      }),
    );
    expect(classes).toContain('border-t');
    expect(classes).toContain('border-[#c8c8c8]');
  });

  // ─── background-image (gradient) tests ───

  it('converts linear-gradient to Tailwind gradient classes', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        backgroundImage:
          'linear-gradient(to right bottom, rgb(254, 252, 232) 0%, rgb(255, 247, 237) 100%)',
      }),
    );
    expect(classes).toContain('bg-gradient-to-br');
    expect(classes).toContain('from-[#fefce8]');
    expect(classes).toContain('to-[#fff7ed]');
  });

  it('converts linear-gradient to-right to bg-gradient-to-r', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        backgroundImage:
          'linear-gradient(to right, rgb(240, 253, 244) 0%, rgb(236, 254, 255) 100%)',
      }),
    );
    expect(classes).toContain('bg-gradient-to-r');
    expect(classes).toContain('from-[#f0fdf4]');
    expect(classes).toContain('to-[#ecfeff]');
  });

  it('falls back to inline style for non-standard gradients', () => {
    const { inlineStyles } = mapStylesToTailwind(
      makeStyles({
        backgroundImage:
          'linear-gradient(135deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)',
      }),
    );
    expect(inlineStyles['background-image']).toBeDefined();
  });

  it('skips backgroundImage when none', () => {
    const { classes, inlineStyles } = mapStylesToTailwind(
      makeStyles({
        backgroundImage: 'none',
      }),
    );
    expect(classes).not.toContain('bg-gradient-to-br');
    expect(inlineStyles['background-image']).toBeUndefined();
  });

  // ─── per-side border color tests ───

  it('outputs per-side border colors when sides differ', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        borderTop: '1px solid rgb(200, 200, 200)',
        borderRight: '1px solid rgb(200, 200, 200)',
        borderBottom: '1px solid rgb(200, 200, 200)',
        borderLeft: '4px solid rgb(34, 197, 94)',
      }),
    );
    expect(classes).toContain('border-t');
    expect(classes).toContain('border-r');
    expect(classes).toContain('border-b');
    expect(classes).toContain('border-l-4');
    // 最頻色がベース、異なる辺が個別指定
    expect(classes).toContain('border-[#c8c8c8]');
    expect(classes).toContain('border-l-[#22c55e]');
  });

  // ─── grid template tests ───

  it('converts equal-width columns to grid-cols-N', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: '167px 167px',
      }),
    );
    expect(classes).toContain('grid-cols-2');
  });

  it('converts 3 equal-width columns to grid-cols-3', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: '100px 100px 100px',
      }),
    );
    expect(classes).toContain('grid-cols-3');
  });

  it('converts 4 equal-width columns to grid-cols-4', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: '250px 250px 250px 250px',
      }),
    );
    expect(classes).toContain('grid-cols-4');
  });

  it('keeps arbitrary value for unequal columns', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: '100px 200px',
      }),
    );
    expect(classes).toContain('grid-cols-[100px_200px]');
  });

  it('converts 1fr 1fr to grid-cols-2', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }),
    );
    expect(classes).toContain('grid-cols-2');
  });

  it('converts repeat format to grid-cols-N', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      }),
    );
    expect(classes).toContain('grid-cols-3');
  });

  it('converts equal-height rows to grid-rows-N', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '48px 48px',
      }),
    );
    expect(classes).toContain('grid-rows-2');
  });

  // ─── grid item span tests ───

  it('maps gridColumn "span 2 / span 2" to col-span-2', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ gridColumn: 'span 2 / span 2' }),
    );
    expect(classes).toContain('col-span-2');
  });

  it('maps gridRow "span 3 / span 3" to row-span-3', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ gridRow: 'span 3 / span 3' }),
    );
    expect(classes).toContain('row-span-3');
  });

  it('skips gridColumn "auto"', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ gridColumn: 'auto' }));
    expect(classes.some((c) => c.startsWith('col-'))).toBe(false);
  });

  it('skips gridRow "auto / auto"', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ gridRow: 'auto / auto' }),
    );
    expect(classes.some((c) => c.startsWith('row-'))).toBe(false);
  });

  it('maps "1 / span 2" to col-start-1 col-span-2', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ gridColumn: '1 / span 2' }),
    );
    expect(classes).toContain('col-start-1');
    expect(classes).toContain('col-span-2');
  });

  it('maps "2 / 4" to col-start-2 col-end-4', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ gridColumn: '2 / 4' }),
    );
    expect(classes).toContain('col-start-2');
    expect(classes).toContain('col-end-4');
  });

  it('emits col-span-* even when parent is not a grid (grid item inherits style)', () => {
    // grid item は親が grid。display はこの要素自身の display であり grid でない
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'block', gridColumn: 'span 2 / span 2' }),
    );
    expect(classes).toContain('col-span-2');
  });

  it('maps "1 / -1" to col-start-1 col-end-[-1] using arbitrary for negative line', () => {
    // 末尾基準の負の grid line は Tailwind 標準 utility に無いので arbitrary にフォールバック
    const { classes } = mapStylesToTailwind(
      makeStyles({ gridColumn: '1 / -1' }),
    );
    expect(classes).toContain('col-start-1');
    expect(classes).toContain('col-end-[-1]');
    // 無効な `col-end--1` を生成していないこと
    expect(classes).not.toContain('col-end--1');
  });

  it('maps "-2 / -1" to col-start-[-2] col-end-[-1]', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ gridRow: '-2 / -1' }));
    expect(classes).toContain('row-start-[-2]');
    expect(classes).toContain('row-end-[-1]');
    expect(
      classes.some((c) => c === 'row-start--2' || c === 'row-end--1'),
    ).toBe(false);
  });

  it('skips grid-template when value is none', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        display: 'grid',
        gridTemplateColumns: 'none',
      }),
    );
    expect(classes).not.toContain('grid-cols-none');
  });

  // ─── margin auto tests (mx-auto / ml-auto etc.) ───

  it('maps margin auto on both sides to mx-auto', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: '0px', right: 'auto', bottom: '0px', left: 'auto' },
      }),
    );
    expect(classes).toContain('mx-auto');
    expect(
      classes.some((c) => c.startsWith('m-[') || c.startsWith('mx-[')),
    ).toBe(false);
  });

  it('maps margin auto on vertical sides to my-auto', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: 'auto', right: '0px', bottom: 'auto', left: '0px' },
      }),
    );
    expect(classes).toContain('my-auto');
  });

  it('maps margin auto on single side to ml-auto', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: '0px', right: '0px', bottom: '0px', left: 'auto' },
      }),
    );
    expect(classes).toContain('ml-auto');
  });

  it('maps margin auto on all sides to m-auto', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' },
      }),
    );
    expect(classes).toContain('m-auto');
  });

  it('mixes mx-auto with numeric vertical margin', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: '16px', right: 'auto', bottom: '16px', left: 'auto' },
      }),
    );
    expect(classes).toContain('mx-auto');
    expect(classes).toContain('mt-4');
    expect(classes).toContain('mb-4');
  });

  it('does not treat padding "auto" as meaningful', () => {
    // padding に auto は存在しないので値は無視される
    const { classes } = mapStylesToTailwind(
      makeStyles({
        padding: { top: 'auto', right: '0px', bottom: 'auto', left: '0px' },
      }),
    );
    expect(classes).not.toContain('py-auto');
    expect(classes).not.toContain('p-auto');
  });

  // ─── negative margin tests ───

  it('maps negative left margin to -ml-2', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: '0px', right: '0px', bottom: '0px', left: '-8px' },
      }),
    );
    expect(classes).toContain('-ml-2');
  });

  it('maps uniform negative margin to -m-4', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: {
          top: '-16px',
          right: '-16px',
          bottom: '-16px',
          left: '-16px',
        },
      }),
    );
    expect(classes).toContain('-m-4');
  });

  it('maps negative x-axis margin to -mx-3', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: {
          top: '0px',
          right: '-12px',
          bottom: '0px',
          left: '-12px',
        },
      }),
    );
    expect(classes).toContain('-mx-3');
  });

  it('maps negative margin arbitrary value with leading minus', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        margin: { top: '0px', right: '0px', bottom: '0px', left: '-5px' },
      }),
    );
    expect(classes).toContain('-ml-[5px]');
  });

  // ─── size keyword tests ───

  it('maps width 100% to w-full', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ width: '100%' }));
    expect(classes).toContain('w-full');
  });

  it('maps height 100% to h-full', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ height: '100%' }));
    expect(classes).toContain('h-full');
  });

  it('maps width min-content to w-min', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ width: 'min-content' }),
    );
    expect(classes).toContain('w-min');
  });

  it('maps width max-content to w-max', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ width: 'max-content' }),
    );
    expect(classes).toContain('w-max');
  });

  it('maps width fit-content to w-fit', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ width: 'fit-content' }),
    );
    expect(classes).toContain('w-fit');
  });

  it('maps arbitrary percentage width to w-[50%]', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ width: '50%' }));
    expect(classes).toContain('w-[50%]');
  });

  // ─── aspect-ratio tests ───

  it('maps aspect-ratio 1 / 1 to aspect-square', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ aspectRatio: '1 / 1' }),
    );
    expect(classes).toContain('aspect-square');
  });

  it('maps aspect-ratio 16 / 9 to aspect-video', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ aspectRatio: '16 / 9' }),
    );
    expect(classes).toContain('aspect-video');
  });

  it('maps aspect-ratio 4 / 5 to arbitrary aspect-[4/5]', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ aspectRatio: '4 / 5' }),
    );
    expect(classes).toContain('aspect-[4/5]');
  });

  it('skips aspect-ratio auto', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ aspectRatio: 'auto' }),
    );
    expect(classes.some((c) => c.startsWith('aspect-'))).toBe(false);
  });

  // ─── grid alignment tests ───

  it('emits items-center on grid container', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'grid', alignItems: 'center' }),
    );
    expect(classes).toContain('items-center');
  });

  it('emits justify-center on grid container', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'grid', justifyContent: 'center' }),
    );
    expect(classes).toContain('justify-center');
  });

  it('does not emit items-center for non-flex/grid containers', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ display: 'block', alignItems: 'center' }),
    );
    expect(classes).not.toContain('items-center');
  });

  // ─── font-style (italic) tests ───

  it('maps font-style italic to italic', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ fontStyle: 'italic' }),
    );
    expect(classes).toContain('italic');
  });

  it('maps font-style oblique to italic', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ fontStyle: 'oblique' }),
    );
    expect(classes).toContain('italic');
  });

  it('skips font-style normal', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ fontStyle: 'normal' }),
    );
    expect(classes).not.toContain('italic');
  });

  // ─── line-height tests ───

  it('maps unitless line-height 1.5 to leading-normal', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ lineHeight: '1.5', fontSize: '16px' }),
    );
    expect(classes).toContain('leading-normal');
  });

  it('maps unitless line-height 1.625 to leading-relaxed', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ lineHeight: '1.625' }),
    );
    expect(classes).toContain('leading-relaxed');
  });

  it('maps unitless line-height 1.1 to arbitrary leading-[1.1]', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ lineHeight: '1.1' }));
    expect(classes).toContain('leading-[1.1]');
  });

  it('maps px line-height matching font-size to leading-none', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ lineHeight: '72px', fontSize: '72px' }),
    );
    expect(classes).toContain('leading-none');
  });

  it('maps px line-height ratio matching known leading to named utility', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ lineHeight: '26px', fontSize: '16px' }),
    );
    // 26 / 16 = 1.625 → leading-relaxed
    expect(classes).toContain('leading-relaxed');
  });

  // ─── borderColor tests ───

  it('outputs border color from borderColor field', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        borderTop: '1px solid rgb(0, 0, 0)',
        borderRight: '1px solid rgb(0, 0, 0)',
        borderBottom: '1px solid rgb(0, 0, 0)',
        borderLeft: '1px solid rgb(0, 0, 0)',
        borderColor: 'rgb(216, 225, 234)',
      }),
    );
    expect(classes).toContain('border');
    expect(classes).toContain('border-[#d8e1ea]');
  });

  it('borderColor overrides shorthand border color', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({
        borderTop: '1px solid rgb(255, 0, 0)',
        borderRight: '1px solid rgb(255, 0, 0)',
        borderBottom: '1px solid rgb(255, 0, 0)',
        borderLeft: '1px solid rgb(255, 0, 0)',
        borderColor: 'rgb(0, 0, 255)',
      }),
    );
    expect(classes).toContain('border');
    expect(classes).toContain('border-[#0000ff]');
    expect(classes).not.toContain('border-[#ff0000]');
  });

  // ─── scale property tests ───

  it('maps CSS scale property', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ scale: '0.98' }));
    expect(classes).toContain('scale-[0.98]');
  });

  it('maps known CSS scale property', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ scale: '0.95' }));
    expect(classes).toContain('scale-95');
  });

  it('skips scale none', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ scale: 'none' }));
    expect(classes.filter((c) => c.includes('scale'))).toEqual([]);
  });

  it('skips scale 1', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ scale: '1' }));
    expect(classes.filter((c) => c.includes('scale'))).toEqual([]);
  });

  // ─── transform tests ───

  it('maps transform scale', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ transform: 'matrix(0.98, 0, 0, 0.98, 0, 0)' }),
    );
    expect(classes).toContain('scale-[0.98]');
  });

  it('maps known transform scale', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ transform: 'matrix(0.95, 0, 0, 0.95, 0, 0)' }),
    );
    expect(classes).toContain('scale-95');
  });

  it('skips transform none', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ transform: 'none' }));
    expect(
      classes.filter((c) => c.includes('scale') || c.includes('transform')),
    ).toEqual([]);
  });

  it('falls back non-scale transform to inline style', () => {
    const { inlineStyles } = mapStylesToTailwind(
      makeStyles({ transform: 'rotate(45deg)' }),
    );
    expect(inlineStyles['transform']).toBe('rotate(45deg)');
  });

  // ─── transition tests ───

  it('maps transition-all', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ transition: 'all 0.15s ease 0s' }),
    );
    expect(classes).toContain('transition-all');
  });

  it('maps transition with custom duration', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ transition: 'all 0.3s ease 0s' }),
    );
    expect(classes).toContain('transition-all');
    expect(classes).toContain('duration-300');
  });

  it('skips transition none', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ transition: 'all 0s ease 0s' }),
    );
    expect(classes.filter((c) => c.includes('transition'))).toEqual([]);
  });
});
