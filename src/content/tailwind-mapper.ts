import type {
  ExtractedNode,
  NormalizedStyles,
  OutputNode,
} from '../shared/types';

// ─── Spacing scale (px → Tailwind) ───
const SPACING_MAP: Record<number, string> = {
  0: '0',
  1: 'px',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  56: '14',
  64: '16',
  80: '20',
  96: '24',
  112: '28',
  128: '32',
  144: '36',
  160: '40',
  176: '44',
  192: '48',
  208: '52',
  224: '56',
  240: '60',
  256: '64',
  288: '72',
  320: '80',
  384: '96',
};

// ─── Border radius ───
const RADIUS_MAP: Record<number, string> = {
  0: 'rounded-none',
  2: 'rounded-sm',
  4: 'rounded',
  6: 'rounded-md',
  8: 'rounded-lg',
  12: 'rounded-xl',
  16: 'rounded-2xl',
  24: 'rounded-3xl',
};

// ─── Font size ───
const FONT_SIZE_MAP: Record<number, string> = {
  12: 'text-xs',
  14: 'text-sm',
  16: 'text-base',
  18: 'text-lg',
  20: 'text-xl',
  24: 'text-2xl',
  30: 'text-3xl',
  36: 'text-4xl',
  48: 'text-5xl',
  60: 'text-6xl',
  72: 'text-7xl',
  96: 'text-8xl',
  128: 'text-9xl',
};

// ─── Font weight ───
const FONT_WEIGHT_MAP: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
};

// ─── Display ───
const DISPLAY_MAP: Record<string, string> = {
  block: 'block',
  'inline-block': 'inline-block',
  inline: 'inline',
  flex: 'flex',
  'inline-flex': 'inline-flex',
  grid: 'grid',
  'inline-grid': 'inline-grid',
  none: 'hidden',
  table: 'table',
  'table-row': 'table-row',
  'table-cell': 'table-cell',
};

// ─── Position ───
const POSITION_MAP: Record<string, string> = {
  static: 'static',
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
};

// ─── Justify Content ───
const JUSTIFY_MAP: Record<string, string> = {
  'flex-start': 'justify-start',
  'flex-end': 'justify-end',
  center: 'justify-center',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
  normal: 'justify-normal',
  stretch: 'justify-stretch',
};

// ─── Align Items ───
const ALIGN_ITEMS_MAP: Record<string, string> = {
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
  normal: 'items-stretch',
};

// ─── Text Align ───
const TEXT_ALIGN_MAP: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
  start: 'text-start',
  end: 'text-end',
};

// ─── Text Transform ───
const TEXT_TRANSFORM_MAP: Record<string, string> = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  none: 'normal-case',
};

// ─── Helpers ───

/**
 * "16px" → 16, それ以外はnull
 */
export function parsePx(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^([\d.]+)px$/);
  if (!match) return null;
  return parseFloat(match[1]);
}

/**
 * spacing値をTailwind表記に変換
 */
function spacingClass(px: number): string {
  if (px in SPACING_MAP) return SPACING_MAP[px];
  return `[${px}px]`;
}

/**
 * rgb/rgba文字列をhexに変換
 */
export function rgbToHex(color: string): string {
  // transparent
  if (
    color === 'transparent' ||
    color === 'rgba(0, 0, 0, 0)' ||
    color === 'rgba(0,0,0,0)'
  )
    return 'transparent';

  const rgbaMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/,
  );
  if (!rgbaMatch) return color;

  const r = parseInt(rgbaMatch[1]);
  const g = parseInt(rgbaMatch[2]);
  const b = parseInt(rgbaMatch[3]);
  const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

  const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;

  if (a < 1) {
    return `rgba(${r},${g},${b},${a})`;
  }
  return hex;
}

/**
 * NormalizedStylesからTailwind classリストとfallback styleを生成する
 */
export function mapStylesToTailwind(styles: NormalizedStyles): {
  classes: string[];
  inlineStyles: Record<string, string>;
} {
  const classes: string[] = [];
  const inlineStyles: Record<string, string> = {};

  // Display
  if (styles.display && styles.display !== 'block') {
    const cls = DISPLAY_MAP[styles.display];
    if (cls) classes.push(cls);
  }

  // Position
  if (styles.position && styles.position !== 'static') {
    const cls = POSITION_MAP[styles.position];
    if (cls) classes.push(cls);
  }

  // Position offsets (top/right/bottom/left)
  mapPositionOffset(styles.top, 'top', classes);
  mapPositionOffset(styles.right, 'right', classes);
  mapPositionOffset(styles.bottom, 'bottom', classes);
  mapPositionOffset(styles.left, 'left', classes);

  // Z-index
  if (styles.zIndex && styles.zIndex !== 'auto') {
    const z = parseInt(styles.zIndex);
    if (!isNaN(z)) {
      const knownZ = [0, 10, 20, 30, 40, 50];
      if (knownZ.includes(z)) {
        classes.push(`z-${z}`);
      } else {
        classes.push(`z-[${z}]`);
      }
    }
  }

  // Overflow
  if (styles.overflow && styles.overflow !== 'visible') {
    if (styles.overflow === 'hidden') classes.push('overflow-hidden');
    else if (styles.overflow === 'auto') classes.push('overflow-auto');
    else if (styles.overflow === 'scroll') classes.push('overflow-scroll');
  }

  // Width
  mapSize(styles.width, 'w', classes);
  mapSize(styles.minWidth, 'min-w', classes);
  mapSize(styles.maxWidth, 'max-w', classes);

  // Height
  mapSize(styles.height, 'h', classes);
  mapSize(styles.minHeight, 'min-h', classes);
  mapSize(styles.maxHeight, 'max-h', classes);

  // Margin
  mapSpacing(styles.margin, 'm', classes);

  // Padding
  mapSpacing(styles.padding, 'p', classes);

  // Gap
  mapGap(styles.gap, 'gap', classes);
  mapGap(styles.rowGap, 'gap-y', classes);
  mapGap(styles.columnGap, 'gap-x', classes);

  // Flex
  if (styles.display === 'flex' || styles.display === 'inline-flex') {
    if (styles.flexDirection === 'column') classes.push('flex-col');
    if (styles.flexDirection === 'column-reverse')
      classes.push('flex-col-reverse');
    if (styles.flexDirection === 'row-reverse')
      classes.push('flex-row-reverse');
    if (styles.flexWrap === 'wrap') classes.push('flex-wrap');
    if (styles.flexWrap === 'wrap-reverse') classes.push('flex-wrap-reverse');

    if (styles.justifyContent) {
      const cls = JUSTIFY_MAP[styles.justifyContent];
      if (cls) classes.push(cls);
    }
    if (styles.alignItems) {
      const cls = ALIGN_ITEMS_MAP[styles.alignItems];
      if (cls) classes.push(cls);
    }
  }

  // Grid
  if (styles.display === 'grid' || styles.display === 'inline-grid') {
    mapGridTemplate(styles.gridTemplateColumns, 'grid-cols', classes);
    mapGridTemplate(styles.gridTemplateRows, 'grid-rows', classes);
  }

  // Background color
  mapColor(styles.backgroundColor, 'bg', classes);

  // Text color
  mapColor(styles.color, 'text', classes);

  // Opacity
  if (styles.opacity && styles.opacity !== '1') {
    const op = parseFloat(styles.opacity);
    const percent = Math.round(op * 100);
    const knownOpacity = [
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
      95, 100,
    ];
    if (knownOpacity.includes(percent)) {
      classes.push(`opacity-${percent}`);
    } else {
      classes.push(`opacity-[${op}]`);
    }
  }

  // Border radius
  if (styles.borderRadius) {
    if (styles.borderRadius === '9999px' || styles.borderRadius === '50%') {
      classes.push('rounded-full');
    } else {
      const px = parsePx(styles.borderRadius);
      if (px !== null && px > 0) {
        if (px in RADIUS_MAP) {
          classes.push(RADIUS_MAP[px]);
        } else {
          classes.push(`rounded-[${px}px]`);
        }
      }
    }
  }

  // Border
  mapBorder(styles, classes);

  // Box shadow
  mapBoxShadow(styles.boxShadow, classes, inlineStyles);

  // Font size
  if (styles.fontSize) {
    const px = parsePx(styles.fontSize);
    if (px !== null) {
      if (px in FONT_SIZE_MAP) {
        classes.push(FONT_SIZE_MAP[px]);
      } else {
        classes.push(`text-[${px}px]`);
      }
    }
  }

  // Font weight
  if (styles.fontWeight) {
    const cls = FONT_WEIGHT_MAP[styles.fontWeight];
    if (cls) classes.push(cls);
  }

  // Line height
  if (styles.lineHeight && styles.lineHeight !== 'normal') {
    const px = parsePx(styles.lineHeight);
    if (px !== null) {
      classes.push(`leading-[${px}px]`);
    }
  }

  // Letter spacing
  if (styles.letterSpacing && styles.letterSpacing !== 'normal') {
    const px = parsePx(styles.letterSpacing);
    if (px !== null && px !== 0) {
      classes.push(`tracking-[${px}px]`);
    }
  }

  // Text align
  if (styles.textAlign) {
    const cls = TEXT_ALIGN_MAP[styles.textAlign];
    if (cls) classes.push(cls);
  }

  // Text transform
  if (styles.textTransform && styles.textTransform !== 'none') {
    const cls = TEXT_TRANSFORM_MAP[styles.textTransform];
    if (cls) classes.push(cls);
  }

  // Text decoration
  if (styles.textDecoration) {
    if (styles.textDecoration.includes('underline')) classes.push('underline');
    else if (styles.textDecoration.includes('line-through'))
      classes.push('line-through');
    else if (styles.textDecoration.includes('overline'))
      classes.push('overline');
  }

  // White space
  if (styles.whiteSpace && styles.whiteSpace !== 'normal') {
    if (styles.whiteSpace === 'nowrap') classes.push('whitespace-nowrap');
    else if (styles.whiteSpace === 'pre') classes.push('whitespace-pre');
    else if (styles.whiteSpace === 'pre-wrap')
      classes.push('whitespace-pre-wrap');
    else if (styles.whiteSpace === 'pre-line')
      classes.push('whitespace-pre-line');
    else if (styles.whiteSpace === 'break-spaces')
      classes.push('whitespace-break-spaces');
  }

  // Fallback styles
  if (styles.fallback) {
    for (const [prop, value] of Object.entries(styles.fallback)) {
      inlineStyles[prop] = value;
    }
  }

  return { classes, inlineStyles };
}

function mapPositionOffset(
  value: string | undefined,
  prefix: string,
  classes: string[],
) {
  if (!value || value === 'auto') return;
  const px = parsePx(value);
  if (px === null) return;
  if (px === 0) {
    classes.push(`${prefix}-0`);
    return;
  }
  const abs = Math.abs(px);
  const neg = px < 0 ? '-' : '';
  classes.push(`${neg}${prefix}-${spacingClass(abs)}`);
}

function mapSize(value: string | undefined, prefix: string, classes: string[]) {
  if (!value || value === 'auto' || value === 'none') return;
  if (value === '100%') {
    classes.push(`${prefix}-full`);
    return;
  }
  if (value === '100vw') {
    classes.push(`${prefix}-screen`);
    return;
  }
  if (value === '100vh') {
    classes.push(`${prefix}-screen`);
    return;
  }
  const px = parsePx(value);
  if (px === null) return;
  if (px in SPACING_MAP) {
    classes.push(`${prefix}-${SPACING_MAP[px]}`);
  } else {
    classes.push(`${prefix}-[${px}px]`);
  }
}

function mapSpacing(
  sides:
    | { top?: string; right?: string; bottom?: string; left?: string }
    | undefined,
  prefix: string,
  classes: string[],
) {
  if (!sides) return;

  const top = parsePx(sides.top) ?? 0;
  const right = parsePx(sides.right) ?? 0;
  const bottom = parsePx(sides.bottom) ?? 0;
  const left = parsePx(sides.left) ?? 0;

  // すべて0ならスキップ
  if (top === 0 && right === 0 && bottom === 0 && left === 0) return;

  // 全方向同じ
  if (top === right && right === bottom && bottom === left) {
    classes.push(`${prefix}-${spacingClass(top)}`);
    return;
  }

  // X軸・Y軸が同じ
  if (top === bottom && left === right) {
    if (top !== 0) classes.push(`${prefix}y-${spacingClass(top)}`);
    if (left !== 0) classes.push(`${prefix}x-${spacingClass(left)}`);
    return;
  }

  // 個別
  if (top !== 0) classes.push(`${prefix}t-${spacingClass(top)}`);
  if (right !== 0) classes.push(`${prefix}r-${spacingClass(right)}`);
  if (bottom !== 0) classes.push(`${prefix}b-${spacingClass(bottom)}`);
  if (left !== 0) classes.push(`${prefix}l-${spacingClass(left)}`);
}

function mapGap(value: string | undefined, prefix: string, classes: string[]) {
  if (!value || value === 'normal') return;
  const px = parsePx(value);
  if (px === null || px === 0) return;
  classes.push(`${prefix}-${spacingClass(px)}`);
}

function mapColor(
  value: string | undefined,
  prefix: string,
  classes: string[],
) {
  if (!value) return;
  const hex = rgbToHex(value);
  if (hex === 'transparent') {
    classes.push(`${prefix}-transparent`);
    return;
  }
  // 既知の色
  if (hex === '#ffffff') {
    classes.push(`${prefix}-white`);
    return;
  }
  if (hex === '#000000') {
    classes.push(`${prefix}-black`);
    return;
  }
  // Arbitrary hex
  if (hex.startsWith('#')) {
    classes.push(`${prefix}-[${hex}]`);
    return;
  }
  // rgba等
  if (hex.startsWith('rgba')) {
    classes.push(`${prefix}-[${hex}]`);
    return;
  }
}

function mapBorder(styles: NormalizedStyles, classes: string[]) {
  // 簡易実装: border-widthだけチェック
  // computedStyleのborderは "1px solid rgb(...)" 形式
  const borders = [
    styles.borderTop,
    styles.borderRight,
    styles.borderBottom,
    styles.borderLeft,
  ];
  const widths = borders.map((b) => {
    if (!b) return 0;
    const match = b.match(/^([\d.]+)px/);
    return match ? parseFloat(match[1]) : 0;
  });

  const allSame = widths.every((w) => w === widths[0]);
  if (allSame && widths[0] > 0) {
    if (widths[0] === 1) classes.push('border');
    else if (widths[0] === 2) classes.push('border-2');
    else if (widths[0] === 4) classes.push('border-4');
    else if (widths[0] === 8) classes.push('border-8');
    else classes.push(`border-[${widths[0]}px]`);

    // Border color from first border
    const colorMatch = borders[0]?.match(
      /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/,
    );
    if (colorMatch) {
      const hex = rgbToHex(colorMatch[0]);
      if (hex !== '#000000') {
        classes.push(`border-[${hex}]`);
      }
    }
  }
}

function mapBoxShadow(
  value: string | undefined,
  classes: string[],
  inlineStyles: Record<string, string>,
) {
  if (!value || value === 'none') return;
  // 簡易: よく使われるシャドウパターンに近似
  // 複雑なものはfallback
  if (value.includes('0px 1px 2px') || value.includes('0 1px 2px')) {
    classes.push('shadow-sm');
  } else if (value.includes('0px 1px 3px') || value.includes('0 1px 3px')) {
    classes.push('shadow');
  } else if (value.includes('0px 4px 6px') || value.includes('0 4px 6px')) {
    classes.push('shadow-md');
  } else if (value.includes('0px 10px 15px') || value.includes('0 10px 15px')) {
    classes.push('shadow-lg');
  } else if (value.includes('0px 20px 25px') || value.includes('0 20px 25px')) {
    classes.push('shadow-xl');
  } else if (value.includes('0px 25px 50px') || value.includes('0 25px 50px')) {
    classes.push('shadow-2xl');
  } else {
    inlineStyles['box-shadow'] = value;
  }
}

function mapGridTemplate(
  value: string | undefined,
  prefix: string,
  classes: string[],
) {
  if (!value || value === 'none') return;
  // repeat(N, minmax(0, 1fr)) パターンを検出
  const repeatMatch = value.match(
    /^repeat\((\d+),\s*minmax\(0(?:px)?,\s*1fr\)\)$/,
  );
  if (repeatMatch) {
    classes.push(`${prefix}-${repeatMatch[1]}`);
    return;
  }
  // 単純な 1fr 繰り返し
  const frParts = value.trim().split(/\s+/);
  if (frParts.every((p) => p === '1fr')) {
    classes.push(`${prefix}-${frParts.length}`);
    return;
  }
  // fallback
  classes.push(`${prefix}-[${value.replace(/\s+/g, '_')}]`);
}

/**
 * ExtractedNodeをOutputNodeに変換する（再帰）
 */
export function convertToOutput(node: ExtractedNode): OutputNode {
  const { classes, inlineStyles } = mapStylesToTailwind(node.styles);

  return {
    tagName: node.tagName,
    attributes: node.attributes,
    classList: classes,
    style: inlineStyles,
    children: node.children.map(convertToOutput),
    textContent: node.textContent,
  };
}
