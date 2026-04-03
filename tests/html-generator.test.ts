import { describe, it, expect } from 'vitest';
import { generateHtml } from '../src/content/html-generator';
import type { OutputNode } from '../src/shared/types';

describe('generateHtml', () => {
  it('generates simple element', () => {
    const node: OutputNode = {
      tagName: 'div',
      attributes: {},
      classList: ['flex', 'items-center'],
      style: {},
      children: [],
      textContent: 'Hello',
    };

    const html = generateHtml(node);
    expect(html).toBe('<div class="flex items-center">Hello</div>');
  });

  it('generates element with no class or style', () => {
    const node: OutputNode = {
      tagName: 'div',
      attributes: {},
      classList: [],
      style: {},
      children: [],
      textContent: 'Text',
    };

    const html = generateHtml(node);
    expect(html).toBe('<div>Text</div>');
  });

  it('generates element with inline style', () => {
    const node: OutputNode = {
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
      tagName: 'div',
      attributes: {},
      classList: ['flex'],
      style: {},
      children: [
        {
          tagName: 'span',
          attributes: {},
          classList: ['text-sm'],
          style: {},
          children: [],
          textContent: 'Child',
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
      tagName: 'a',
      attributes: { href: 'https://example.com', target: '_blank' },
      classList: ['text-[#0000ff]'],
      style: {},
      children: [],
      textContent: 'Link',
    };

    const html = generateHtml(node);
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
  });

  it('escapes HTML entities in text', () => {
    const node: OutputNode = {
      tagName: 'span',
      attributes: {},
      classList: [],
      style: {},
      children: [],
      textContent: '<script>alert("xss")</script>',
    };

    const html = generateHtml(node);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
