import type { NormalizedStyles } from '../shared/types';

/** フォールバック対象プロパティ（Tailwind変換未対応） */
const FALLBACK_PROPERTIES = [
  'backdrop-filter',
  'filter',
  'clip-path',
  'mask',
  'mix-blend-mode',
  'isolation',
  'object-fit',
  'object-position',
  'cursor',
  'user-select',
  'pointer-events',
  'resize',
  'appearance',
  'outline',
  'outline-offset',
  'scroll-behavior',
  'scroll-snap-type',
  'scroll-snap-align',
  'will-change',
  'contain',
  'content-visibility',
];

/**
 * 要素のcomputedStyleから正規化スタイルを抽出する
 */
export function extractStyles(element: Element): NormalizedStyles {
  const cs = window.getComputedStyle(element);

  const fallback: Record<string, string> = {};
  for (const prop of FALLBACK_PROPERTIES) {
    const value = cs.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
      fallback[prop] = value;
    }
  }

  return {
    display: cs.display,
    position: cs.position,
    width: cs.width,
    height: cs.height,
    minWidth: cs.minWidth,
    minHeight: cs.minHeight,
    maxWidth: cs.maxWidth,
    maxHeight: cs.maxHeight,
    margin: {
      top: cs.marginTop,
      right: cs.marginRight,
      bottom: cs.marginBottom,
      left: cs.marginLeft,
    },
    padding: {
      top: cs.paddingTop,
      right: cs.paddingRight,
      bottom: cs.paddingBottom,
      left: cs.paddingLeft,
    },
    color: cs.color,
    backgroundColor: cs.backgroundColor,
    backgroundImage: cs.backgroundImage,
    borderRadius: cs.borderRadius,
    borderTop: cs.borderTop,
    borderRight: cs.borderRight,
    borderBottom: cs.borderBottom,
    borderLeft: cs.borderLeft,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontFamily: cs.fontFamily,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textAlign: cs.textAlign,
    textTransform: cs.textTransform,
    textDecoration: cs.textDecoration,
    whiteSpace: cs.whiteSpace,
    boxShadow: cs.boxShadow,
    opacity: cs.opacity,
    zIndex: cs.zIndex,
    overflow: cs.overflow,
    boxSizing: cs.boxSizing,
    top: cs.top,
    right: cs.right,
    bottom: cs.bottom,
    left: cs.left,
    gap: cs.gap,
    rowGap: cs.rowGap,
    columnGap: cs.columnGap,
    flexDirection: cs.flexDirection,
    flexWrap: cs.flexWrap,
    justifyContent: cs.justifyContent,
    alignItems: cs.alignItems,
    alignContent: cs.alignContent,
    alignSelf: cs.alignSelf,
    flexGrow: cs.flexGrow,
    flexShrink: cs.flexShrink,
    gridTemplateColumns: cs.gridTemplateColumns,
    gridTemplateRows: cs.gridTemplateRows,
    gridColumn: cs.gridColumn,
    gridRow: cs.gridRow,
    fallback: Object.keys(fallback).length > 0 ? fallback : undefined,
  };
}
