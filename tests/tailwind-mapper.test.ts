import { describe, it, expect } from 'vitest';
import {
  parsePx,
  rgbToHex,
  mapStylesToTailwind,
} from '../src/content/tailwind-mapper';
import type { NormalizedStyles } from '../src/shared/types';

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

  it('maps position', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ position: 'absolute' }),
    );
    expect(classes).toContain('absolute');
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

  it('maps rounded-full', () => {
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

  it('maps text-align', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ textAlign: 'center' }),
    );
    expect(classes).toContain('text-center');
  });

  it('maps whitespace nowrap', () => {
    const { classes } = mapStylesToTailwind(
      makeStyles({ whiteSpace: 'nowrap' }),
    );
    expect(classes).toContain('whitespace-nowrap');
  });

  it('maps width to arbitrary value', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ width: '123px' }));
    expect(classes).toContain('w-[123px]');
  });

  it('maps width 100% to w-full', () => {
    const { classes } = mapStylesToTailwind(makeStyles({ width: '100%' }));
    expect(classes).toContain('w-full');
  });
});
