import { describe, it, expect } from 'vitest';
import {
  parsePx,
  rgbToHex,
  mapStylesToTailwind,
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
});
