import { describe, it, expect } from 'vitest';
import { generateHtml } from '../src/content/html-generator';
import type { OutputNode } from '../src/shared/types';

describe('generateHtml', () => {
  it('generates simple element with text', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'div',
      attributes: {},
      classList: ['flex', 'items-center'],
      style: {},
      children: [{ type: 'text', content: 'Hello' }],
    };

    const html = generateHtml(node);
    expect(html).toBe('<div class="flex items-center">Hello</div>');
  });

  it('generates element with no children', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'div',
      attributes: {},
      classList: [],
      style: {},
      children: [],
    };

    const html = generateHtml(node);
    expect(html).toBe('<div></div>');
  });

  it('generates element with inline style', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'div',
      attributes: {},
      classList: ['p-4'],
      style: { 'backdrop-filter': 'blur(10px)' },
      children: [],
    };

    const html = generateHtml(node);
    expect(html).toBe(
      '<div class="p-4" style="backdrop-filter: blur(10px)"></div>',
    );
  });

  it('generates nested elements with indentation', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'div',
      attributes: {},
      classList: ['flex'],
      style: {},
      children: [
        {
          type: 'element',
          tagName: 'span',
          attributes: {},
          classList: ['text-sm'],
          style: {},
          children: [{ type: 'text', content: 'Child' }],
        },
      ],
    };

    const html = generateHtml(node);
    expect(html).toContain('<div class="flex">');
    expect(html).toContain('  <span class="text-sm">Child</span>');
    expect(html).toContain('</div>');
  });

  it('generates self-closing tags', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'img',
      attributes: { src: 'test.png', alt: 'Test' },
      classList: ['w-full'],
      style: {},
      children: [],
    };

    const html = generateHtml(node);
    expect(html).toBe('<img class="w-full" src="test.png" alt="Test" />');
  });

  it('preserves safe attributes', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'a',
      attributes: { href: 'https://example.com', target: '_blank' },
      classList: ['text-[#0000ff]'],
      style: {},
      children: [{ type: 'text', content: 'Link' }],
    };

    const html = generateHtml(node);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
  });

  it('escapes HTML entities in text', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'span',
      attributes: {},
      classList: [],
      style: {},
      children: [{ type: 'text', content: '<script>alert("xss")</script>' }],
    };

    const html = generateHtml(node);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('preserves child node order (element before text)', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      classList: ['flex'],
      style: {},
      children: [
        {
          type: 'element',
          tagName: 'svg',
          attributes: {},
          classList: [],
          style: {},
          children: [],
        },
        { type: 'text', content: 'Click me' },
      ],
    };

    const html = generateHtml(node);
    const svgIndex = html.indexOf('<svg');
    const textIndex = html.indexOf('Click me');
    expect(svgIndex).toBeLessThan(textIndex);
  });

  it('preserves child node order (text before element)', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'button',
      attributes: {},
      classList: ['flex'],
      style: {},
      children: [
        { type: 'text', content: 'Click me' },
        {
          type: 'element',
          tagName: 'svg',
          attributes: {},
          classList: [],
          style: {},
          children: [],
        },
      ],
    };

    const html = generateHtml(node);
    const textIndex = html.indexOf('Click me');
    const svgIndex = html.indexOf('<svg');
    expect(textIndex).toBeLessThan(svgIndex);
  });

  it('handles mixed text and element children', () => {
    const node: OutputNode = {
      type: 'element',
      tagName: 'div',
      attributes: {},
      classList: [],
      style: {},
      children: [
        { type: 'text', content: 'Before' },
        {
          type: 'element',
          tagName: 'span',
          attributes: {},
          classList: [],
          style: {},
          children: [{ type: 'text', content: 'Middle' }],
        },
        { type: 'text', content: 'After' },
      ],
    };

    const html = generateHtml(node);
    const beforeIdx = html.indexOf('Before');
    const middleIdx = html.indexOf('Middle');
    const afterIdx = html.indexOf('After');
    expect(beforeIdx).toBeLessThan(middleIdx);
    expect(middleIdx).toBeLessThan(afterIdx);
  });
});
