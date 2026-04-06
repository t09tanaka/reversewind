import { describe, it, expect } from 'vitest';
import { findMeaningfulAncestor } from '../src/content/bubble-up';

/**
 * getBoundingClientRect のモックを持つ要素を作成する
 */
function mockElement(
  rect: { x: number; y: number; width: number; height: number },
  parent?: ReturnType<typeof mockElement>,
  tag = 'DIV',
): Element {
  const el = {
    tagName: tag,
    parentElement: parent ?? null,
    getBoundingClientRect: () => ({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.y,
      left: rect.x,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      toJSON: () => ({}),
    }),
  } as unknown as Element;
  return el;
}

describe('findMeaningfulAncestor', () => {
  it('returns the element itself when no parent', () => {
    const el = mockElement({ x: 0, y: 0, width: 300, height: 100 });
    expect(findMeaningfulAncestor(el)).toBe(el);
  });

  it('bubbles up to parent when same size', () => {
    const parent = mockElement(
      { x: 0, y: 0, width: 300, height: 100 },
      undefined,
      'BUTTON',
    );
    const child = mockElement({ x: 0, y: 0, width: 300, height: 100 }, parent);
    expect(findMeaningfulAncestor(child)).toBe(parent);
  });

  it('bubbles up when parent is only slightly larger (padding)', () => {
    const parent = mockElement(
      { x: 0, y: 0, width: 316, height: 116 },
      undefined,
      'BUTTON',
    );
    // child has 8px padding on each side → 300x100 vs 316x116
    const child = mockElement({ x: 8, y: 8, width: 300, height: 100 }, parent);
    // 300*100 / 316*116 = 30000/36656 ≈ 0.818 → below 0.90 threshold → should NOT bubble
    expect(findMeaningfulAncestor(child)).toBe(child);
  });

  it('bubbles up when child area is 95% of parent', () => {
    const parent = mockElement(
      { x: 0, y: 0, width: 300, height: 100 },
      undefined,
      'A',
    );
    // child is 295x98 → 28910 / 30000 ≈ 0.964 → above threshold → should bubble
    const child = mockElement({ x: 2, y: 1, width: 295, height: 98 }, parent);
    expect(findMeaningfulAncestor(child)).toBe(parent);
  });

  it('bubbles up through multiple same-size ancestors', () => {
    const grandparent = mockElement(
      { x: 0, y: 0, width: 300, height: 100 },
      undefined,
      'LI',
    );
    const parent = mockElement(
      { x: 0, y: 0, width: 300, height: 100 },
      grandparent,
      'A',
    );
    const child = mockElement({ x: 0, y: 0, width: 300, height: 100 }, parent);
    expect(findMeaningfulAncestor(child)).toBe(grandparent);
  });

  it('stops at body element', () => {
    const body = mockElement(
      { x: 0, y: 0, width: 1200, height: 5000 },
      undefined,
      'BODY',
    );
    const main = mockElement(
      { x: 0, y: 0, width: 1200, height: 5000 },
      body,
      'MAIN',
    );
    const child = mockElement({ x: 0, y: 0, width: 1200, height: 5000 }, main);
    // Should stop at main, not bubble to body
    expect(findMeaningfulAncestor(child)).toBe(main);
  });

  it('stops at html element', () => {
    const html = mockElement(
      { x: 0, y: 0, width: 1200, height: 5000 },
      undefined,
      'HTML',
    );
    const child = mockElement({ x: 0, y: 0, width: 1200, height: 5000 }, html);
    expect(findMeaningfulAncestor(child)).toBe(child);
  });

  it('stops when parent is significantly larger', () => {
    const parent = mockElement({ x: 0, y: 0, width: 800, height: 600 });
    const child = mockElement(
      { x: 50, y: 50, width: 300, height: 100 },
      parent,
    );
    // 30000 / 480000 ≈ 0.0625 → way below threshold
    expect(findMeaningfulAncestor(child)).toBe(child);
  });

  it('handles zero-size elements gracefully', () => {
    const parent = mockElement({ x: 0, y: 0, width: 0, height: 0 });
    const child = mockElement({ x: 0, y: 0, width: 0, height: 0 }, parent);
    expect(findMeaningfulAncestor(child)).toBe(child);
  });
});
