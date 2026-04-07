import { describe, it, expect } from 'vitest';
import {
  extractBaseStyles,
  HIDDEN_BODY_CHILDREN,
} from '../src/content/page-extractor';

describe('HIDDEN_BODY_CHILDREN', () => {
  it('contains script, noscript, style', () => {
    expect(HIDDEN_BODY_CHILDREN.has('SCRIPT')).toBe(true);
    expect(HIDDEN_BODY_CHILDREN.has('NOSCRIPT')).toBe(true);
    expect(HIDDEN_BODY_CHILDREN.has('STYLE')).toBe(true);
  });
});

describe('extractBaseStyles', () => {
  it('extracts background-color', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'Arial',
    });
    expect(result).toContain('bg-white');
  });

  it('extracts text color', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(10, 10, 10)',
      fontFamily: 'Arial',
    });
    expect(result).toContain('text-[#0a0a0a]');
  });

  it('maps system font stack to font-sans', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
    expect(result).toContain('font-sans');
  });

  it('maps serif font to font-serif', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'ui-serif, Georgia, serif',
    });
    expect(result).toContain('font-serif');
  });

  it('maps mono font to font-mono', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'ui-monospace, monospace',
    });
    expect(result).toContain('font-mono');
  });

  it('skips font-family when not matching standard families', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'CustomFont, Helvetica',
    });
    expect(result).not.toContain('font-');
  });

  it('skips transparent background', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'Arial',
    });
    expect(result).not.toContain('bg-');
  });

  it('skips default black text color', () => {
    const result = extractBaseStyles({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      color: 'rgb(0, 0, 0)',
      fontFamily: 'Arial',
    });
    expect(result).not.toContain('text-');
  });
});
