import { SVG_ELEMENTS } from '../shared/constants';
import type {
  ExtractedNode,
  ExtractedChild,
  NormalizedStyles,
  OutputNode,
  OutputChild,
  SizeInfo,
  PseudoClass,
} from '../shared/types';

import { PSEUDO_CLASS_LIST } from './style-extractor';

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

// ─── Max-width rem scale (Tailwind default) ───
const MAX_WIDTH_REM_MAP: Record<number, string> = {
  320: 'max-w-xs', // 20rem
  384: 'max-w-sm', // 24rem
  448: 'max-w-md', // 28rem
  512: 'max-w-lg', // 32rem
  576: 'max-w-xl', // 36rem
  672: 'max-w-2xl', // 42rem
  768: 'max-w-3xl', // 48rem
  896: 'max-w-4xl', // 56rem
  1024: 'max-w-5xl', // 64rem
  1152: 'max-w-6xl', // 72rem
  1280: 'max-w-7xl', // 80rem
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
};

// ─── Align Items ───
const ALIGN_ITEMS_MAP: Record<string, string> = {
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

// ─── Align Self ───
const ALIGN_SELF_MAP: Record<string, string> = {
  auto: 'self-auto',
  'flex-start': 'self-start',
  'flex-end': 'self-end',
  center: 'self-center',
  stretch: 'self-stretch',
  baseline: 'self-baseline',
};

// ─── Align Content ───
const ALIGN_CONTENT_MAP: Record<string, string> = {
  'flex-start': 'content-start',
  'flex-end': 'content-end',
  center: 'content-center',
  stretch: 'content-stretch',
  'space-between': 'content-between',
  'space-around': 'content-around',
  'space-evenly': 'content-evenly',
  baseline: 'content-baseline',
};

// ─── Text Align ───
const TEXT_ALIGN_MAP: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

// ─── Text Transform ───
const TEXT_TRANSFORM_MAP: Record<string, string> = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
};

// ─── Background size ───
const BG_SIZE_MAP: Record<string, string> = {
  cover: 'bg-cover',
  contain: 'bg-contain',
  // auto is default
};

// ─── Background position (% keyword combinations) ───
const BG_POSITION_MAP: Record<string, string> = {
  '0% 0%': 'bg-left-top',
  '50% 0%': 'bg-top',
  '100% 0%': 'bg-right-top',
  '0% 50%': 'bg-left',
  '50% 50%': 'bg-center',
  '100% 50%': 'bg-right',
  '0% 100%': 'bg-left-bottom',
  '50% 100%': 'bg-bottom',
  '100% 100%': 'bg-right-bottom',
};

// ─── Background repeat ───
const BG_REPEAT_MAP: Record<string, string> = {
  'no-repeat': 'bg-no-repeat',
  'repeat-x': 'bg-repeat-x',
  'repeat-y': 'bg-repeat-y',
  space: 'bg-repeat-space',
  round: 'bg-repeat-round',
  // repeat is default
};

// ─── Border style ───
const BORDER_STYLE_MAP: Record<string, string> = {
  dashed: 'border-dashed',
  dotted: 'border-dotted',
  double: 'border-double',
  // solid is default
};

// ─── Word break ───
const WORD_BREAK_MAP: Record<string, string> = {
  'break-all': 'break-all',
  'keep-all': 'break-keep',
  // normal is default
};

// ─── Vertical align ───
const VERTICAL_ALIGN_MAP: Record<string, string> = {
  top: 'align-top',
  middle: 'align-middle',
  bottom: 'align-bottom',
  'text-top': 'align-text-top',
  'text-bottom': 'align-text-bottom',
  sub: 'align-sub',
  super: 'align-super',
  // baseline is default
};

// ─── Hyphens ───
const HYPHENS_MAP: Record<string, string> = {
  manual: 'hyphens-manual',
  auto: 'hyphens-auto',
  // none is default
};

// ─── Object fit ───
const OBJECT_FIT_MAP: Record<string, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  none: 'object-none',
  'scale-down': 'object-scale-down',
  // fill is default
};

// ─── Object position ───
// Tailwind の object-position utility は 9 方向を持つ。computedStyle は
// `0% 0%`, `50% 50%` 等で返る。キーワード (center, top, left) が指定された場合、
// ブラウザは percent に正規化して返す。
const OBJECT_POSITION_MAP: Record<string, string> = {
  '0% 0%': 'object-left-top',
  '50% 0%': 'object-top',
  '100% 0%': 'object-right-top',
  '0% 50%': 'object-left',
  // '50% 50%': default, skip
  '100% 50%': 'object-right',
  '0% 100%': 'object-left-bottom',
  '50% 100%': 'object-bottom',
  '100% 100%': 'object-right-bottom',
};

// ─── Filter function → Tailwind class ───
// blur の px 値を Tailwind の blur-* utility にマップする
const BLUR_PX_MAP: Record<string, string> = {
  '0': 'blur-none',
  '4': 'blur-sm',
  '8': 'blur',
  '12': 'blur-md',
  '16': 'blur-lg',
  '24': 'blur-xl',
  '40': 'blur-2xl',
  '64': 'blur-3xl',
};

// brightness/contrast/saturate: 1.0 を基準に % 化
const PERCENT_FILTER_VALUES: Record<string, number[]> = {
  brightness: [0, 0.5, 0.75, 0.9, 0.95, 1, 1.05, 1.1, 1.25, 1.5, 2],
  contrast: [0, 0.5, 0.75, 1, 1.25, 1.5, 2],
  saturate: [0, 0.5, 1, 1.5, 2],
};

// grayscale/invert/sepia: 0..1 を 0 / 100% の二値に近似
const BINARY_FILTER_VALUES = ['grayscale', 'invert', 'sepia'];

// hue-rotate: deg 値から Tailwind の hue-rotate-* を求める
const HUE_ROTATE_DEGREES = [0, 15, 30, 60, 90, 180];

/**
 * filter / backdrop-filter 関数文字列を解析し、Tailwind class の配列を返す。
 * prefix: '' for filter, 'backdrop-' for backdrop-filter
 */
function parseFilterFunctions(
  value: string,
  prefix: '' | 'backdrop-',
): string[] {
  const classes: string[] = [];
  // `fn(arg)` をトップレベルで抽出（arg 内にカッコがない前提で簡略化）
  const fnRegex = /([a-z-]+)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = fnRegex.exec(value)) !== null) {
    const fn = match[1];
    const arg = match[2].trim();
    const cls = mapFilterFunction(fn, arg, prefix);
    if (cls) classes.push(cls);
  }
  return classes;
}

function mapFilterFunction(
  fn: string,
  arg: string,
  prefix: '' | 'backdrop-',
): string | null {
  // blur(Npx)
  if (fn === 'blur') {
    const match = arg.match(/^([\d.]+)px$/);
    if (!match) return null;
    const px = match[1];
    const named = BLUR_PX_MAP[px];
    if (named) return prefix + named;
    return `${prefix}blur-[${px}px]`;
  }

  // brightness/contrast/saturate: numeric multiplier
  if (fn in PERCENT_FILTER_VALUES) {
    const num = parseFloat(arg);
    if (isNaN(num)) return null;
    const known = PERCENT_FILTER_VALUES[fn];
    if (known.includes(num)) {
      const percent = Math.round(num * 100);
      return `${prefix}${fn}-${percent}`;
    }
    return `${prefix}${fn}-[${num}]`;
  }

  // grayscale/invert/sepia: 0..1
  if (BINARY_FILTER_VALUES.includes(fn)) {
    const num = parseFloat(arg);
    if (isNaN(num)) return null;
    if (num === 0) return `${prefix}${fn}-0`;
    if (num === 1) return `${prefix}${fn}`;
    // Tailwind arbitrary: grayscale-[0.5]
    return `${prefix}${fn}-[${num}]`;
  }

  // hue-rotate(deg)
  if (fn === 'hue-rotate') {
    const match = arg.match(/^(-?[\d.]+)deg$/);
    if (!match) return null;
    const deg = parseFloat(match[1]);
    const abs = Math.abs(deg);
    const neg = deg < 0 ? '-' : '';
    if (HUE_ROTATE_DEGREES.includes(abs)) {
      return `${neg}${prefix}hue-rotate-${abs}`;
    }
    return `${neg}${prefix}hue-rotate-[${abs}deg]`;
  }

  // drop-shadow: arbitrary value (Tailwind's named drop-shadows are rare)
  if (fn === 'drop-shadow') {
    return `${prefix}drop-shadow-[${arg.replace(/\s+/g, '_')}]`;
  }

  return null;
}

// ─── Cursor ───
// Tailwind v3 標準 cursor utility に寄せる。標準外の値（url() 等）は
// inline style フォールバックに流す。
const CURSOR_MAP: Record<string, string> = {
  auto: 'cursor-auto',
  default: 'cursor-default',
  pointer: 'cursor-pointer',
  wait: 'cursor-wait',
  text: 'cursor-text',
  move: 'cursor-move',
  help: 'cursor-help',
  'not-allowed': 'cursor-not-allowed',
  none: 'cursor-none',
  'context-menu': 'cursor-context-menu',
  progress: 'cursor-progress',
  cell: 'cursor-cell',
  crosshair: 'cursor-crosshair',
  'vertical-text': 'cursor-vertical-text',
  alias: 'cursor-alias',
  copy: 'cursor-copy',
  'no-drop': 'cursor-no-drop',
  grab: 'cursor-grab',
  grabbing: 'cursor-grabbing',
  'all-scroll': 'cursor-all-scroll',
  'col-resize': 'cursor-col-resize',
  'row-resize': 'cursor-row-resize',
  'n-resize': 'cursor-n-resize',
  'e-resize': 'cursor-e-resize',
  's-resize': 'cursor-s-resize',
  'w-resize': 'cursor-w-resize',
  'ne-resize': 'cursor-ne-resize',
  'nw-resize': 'cursor-nw-resize',
  'se-resize': 'cursor-se-resize',
  'sw-resize': 'cursor-sw-resize',
  'ew-resize': 'cursor-ew-resize',
  'ns-resize': 'cursor-ns-resize',
  'nesw-resize': 'cursor-nesw-resize',
  'nwse-resize': 'cursor-nwse-resize',
  'zoom-in': 'cursor-zoom-in',
  'zoom-out': 'cursor-zoom-out',
};

// ─── タグごとのデフォルト display 値 ───
const TAG_DEFAULT_DISPLAY: Record<string, string> = {
  div: 'block',
  section: 'block',
  article: 'block',
  main: 'block',
  header: 'block',
  footer: 'block',
  nav: 'block',
  aside: 'block',
  p: 'block',
  h1: 'block',
  h2: 'block',
  h3: 'block',
  h4: 'block',
  h5: 'block',
  h6: 'block',
  ul: 'block',
  ol: 'block',
  li: 'list-item',
  form: 'block',
  fieldset: 'block',
  hr: 'block',
  pre: 'block',
  blockquote: 'block',
  address: 'block',
  figure: 'block',
  figcaption: 'block',
  details: 'block',
  summary: 'block',
  span: 'inline',
  a: 'inline',
  strong: 'inline',
  em: 'inline',
  b: 'inline',
  i: 'inline',
  u: 'inline',
  s: 'inline',
  small: 'inline',
  sub: 'inline',
  sup: 'inline',
  code: 'inline',
  kbd: 'inline',
  var: 'inline',
  abbr: 'inline',
  cite: 'inline',
  mark: 'inline',
  time: 'inline',
  label: 'inline',
  br: 'inline',
  img: 'inline',
  input: 'inline-block',
  button: 'inline-block',
  select: 'inline-block',
  textarea: 'inline-block',
  table: 'table',
  thead: 'table-header-group',
  tbody: 'table-row-group',
  tfoot: 'table-footer-group',
  tr: 'table-row',
  td: 'table-cell',
  th: 'table-cell',
  svg: 'inline',
  path: 'inline',
  circle: 'inline',
  rect: 'inline',
  line: 'inline',
  polygon: 'inline',
  polyline: 'inline',
  g: 'inline',
};

/**
 * CSS継承プロパティ一覧
 * 親と同じ値なら子では出力しない
 */
const INHERITED_PROPERTIES: (keyof NormalizedStyles)[] = [
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textTransform',
  'whiteSpace',
  'cursor',
];

// ─── Helpers ───

/**
 * Font family stack から Tailwind の font-sans / font-serif / font-mono を推測する。
 * キーワード (monospace, serif, sans-serif, ui-monospace, ui-serif, ui-sans-serif) を
 * 含むかで判定する。どれにも該当しなければ null を返す（= 出力なし）。
 */
function detectFontFamilyClass(fontFamily: string): string | null {
  const lower = fontFamily.toLowerCase();
  if (/\b(ui-monospace|monospace)\b/.test(lower)) return 'font-mono';
  if (/\b(ui-serif|serif)\b/.test(lower) && !lower.includes('sans-serif')) {
    return 'font-serif';
  }
  if (/\b(ui-sans-serif|sans-serif|system-ui)\b/.test(lower))
    return 'font-sans';
  return null;
}

/**
 * "16px" → 16, それ以外はnull
 */
export function parsePx(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^(-?[\d.]+)px$/);
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
 * 符号付きのspacing utility class名を生成する。
 * 負値は既知値/任意値どちらも先頭に `-` を付与する（mapPositionOffset と同じ表記）。
 * 例: -8 → `-ml-2`、-5 → `-ml-[5px]`
 */
function formatSpacingClass(prefix: string, side: string, px: number): string {
  const abs = Math.abs(px);
  const neg = px < 0 ? '-' : '';
  if (abs in SPACING_MAP) {
    return `${neg}${prefix}${side}-${SPACING_MAP[abs]}`;
  }
  return `${neg}${prefix}${side}-[${abs}px]`;
}

/**
 * Canvas getImageDataを使って任意のCSS色文字列を "#rrggbb" または "rgba(r,g,b,a)" に正規化する。
 * oklch/oklab等の新しい色形式にも対応。ブラウザ環境でのみ動作し、非ブラウザ環境では元の文字列を返す。
 */
export function normalizeColor(color: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
    if (!ctx) return color;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return 'transparent';
    if (a < 255) {
      const alpha = Math.round((a / 255) * 100) / 100;
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  } catch {
    return color;
  }
}

/**
 * CSS色文字列をhexに変換。rgb/rgbaは直接パース、oklch/oklab等はCanvas API経由で正規化。
 */
export function rgbToHex(color: string): string {
  if (
    color === 'transparent' ||
    color === 'rgba(0, 0, 0, 0)' ||
    color === 'rgba(0,0,0,0)'
  )
    return 'transparent';

  // oklch/oklab等の非rgb色をCanvas APIでrgb/hexに正規化
  let target = color;
  if (!color.match(/^rgba?\(/)) {
    target = normalizeColor(color);
  }

  // Canvas APIが "#rrggbb" を直接返した場合
  if (target.startsWith('#')) return target;

  const rgbaMatch = target.match(
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
export function mapStylesToTailwind(
  styles: NormalizedStyles,
  tagName?: string,
  parentStyles?: NormalizedStyles,
  sizeInfo?: SizeInfo,
): {
  classes: string[];
  inlineStyles: Record<string, string>;
} {
  const classes: string[] = [];
  const inlineStyles: Record<string, string> = {};

  // SVG内部要素はTailwind変換をスキップ
  if (tagName && SVG_ELEMENTS.has(tagName)) {
    return { classes, inlineStyles };
  }

  const defaultDisplay = tagName
    ? (TAG_DEFAULT_DISPLAY[tagName] ?? 'inline')
    : 'block';

  // Display — デフォルト値なら省略
  if (styles.display && styles.display !== defaultDisplay) {
    const cls = DISPLAY_MAP[styles.display];
    if (cls) classes.push(cls);
  }

  // Position — static はデフォルトなので省略
  if (styles.position && styles.position !== 'static') {
    const cls = POSITION_MAP[styles.position];
    if (cls) classes.push(cls);
  }

  // Position offsets (top/right/bottom/left) — positionがstatic以外のみ
  if (styles.position && styles.position !== 'static') {
    mapPositionOffset(styles.top, 'top', classes);
    mapPositionOffset(styles.right, 'right', classes);
    mapPositionOffset(styles.bottom, 'bottom', classes);
    mapPositionOffset(styles.left, 'left', classes);
  }

  // Z-index — positioned element でないと効かないので、position: static では出力しない。
  // pseudo styles の diff では position が undefined の場合もあり、その場合は
  // 「position に変化なし」を意味するので既存の動作どおり出力する。
  if (
    styles.zIndex &&
    styles.zIndex !== 'auto' &&
    styles.position !== 'static'
  ) {
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

  // Overflow — visible はデフォルト
  if (styles.overflow && styles.overflow !== 'visible') {
    if (styles.overflow === 'hidden') classes.push('overflow-hidden');
    else if (styles.overflow === 'auto') classes.push('overflow-auto');
    else if (styles.overflow === 'scroll') classes.push('overflow-scroll');
  }

  // Width — sizeInfo.widthAuthored が true の場合のみ出力
  if (!sizeInfo || sizeInfo.widthAuthored) {
    mapSize(styles.width, 'w', classes);
    mapSize(styles.minWidth, 'min-w', classes);
    mapSize(styles.maxWidth, 'max-w', classes);
  }

  // Height — sizeInfo.heightAuthored が true の場合のみ出力
  if (!sizeInfo || sizeInfo.heightAuthored) {
    mapSize(styles.height, 'h', classes);
    mapSize(styles.minHeight, 'min-h', classes);
    mapSize(styles.maxHeight, 'max-h', classes);
  }

  // Margin
  mapSpacing(styles.margin, 'm', classes);

  // Padding
  mapSpacing(styles.padding, 'p', classes);

  // Gap — 正規化: gap設定済みなら row-gap/column-gap は省略
  const gapPx = parsePx(styles.gap);
  const rowGapPx = parsePx(styles.rowGap);
  const colGapPx = parsePx(styles.columnGap);

  if (gapPx !== null && gapPx > 0) {
    // row-gap/column-gapが同じ値ならgapだけ出力
    if (rowGapPx === gapPx && colGapPx === gapPx) {
      mapGap(styles.gap, 'gap', classes);
    } else {
      // 異なる場合は個別出力
      mapGap(styles.gap, 'gap', classes);
    }
  } else {
    // gapがない場合のみ個別gap出力
    if (rowGapPx !== null && rowGapPx > 0) {
      mapGap(styles.rowGap, 'gap-y', classes);
    }
    if (colGapPx !== null && colGapPx > 0) {
      mapGap(styles.columnGap, 'gap-x', classes);
    }
  }

  // Flex-specific
  if (styles.display === 'flex' || styles.display === 'inline-flex') {
    if (styles.flexDirection === 'column') classes.push('flex-col');
    if (styles.flexDirection === 'column-reverse')
      classes.push('flex-col-reverse');
    if (styles.flexDirection === 'row-reverse')
      classes.push('flex-row-reverse');
    // row はデフォルトなので省略
    if (styles.flexWrap === 'wrap') classes.push('flex-wrap');
    if (styles.flexWrap === 'wrap-reverse') classes.push('flex-wrap-reverse');
  }

  // Grid container
  if (styles.display === 'grid' || styles.display === 'inline-grid') {
    mapGridTemplate(styles.gridTemplateColumns, 'grid-cols', classes);
    mapGridTemplate(styles.gridTemplateRows, 'grid-rows', classes);
  }

  // justify-content / align-items は flex と grid の両方に効く
  if (
    styles.display === 'flex' ||
    styles.display === 'inline-flex' ||
    styles.display === 'grid' ||
    styles.display === 'inline-grid'
  ) {
    // justify-content: normal/stretch/flex-start はデフォルト
    if (
      styles.justifyContent &&
      styles.justifyContent !== 'normal' &&
      styles.justifyContent !== 'flex-start'
    ) {
      const cls = JUSTIFY_MAP[styles.justifyContent];
      if (cls) classes.push(cls);
    }
    // align-items: normal/stretch はデフォルト
    if (
      styles.alignItems &&
      styles.alignItems !== 'normal' &&
      styles.alignItems !== 'stretch'
    ) {
      const cls = ALIGN_ITEMS_MAP[styles.alignItems];
      if (cls) classes.push(cls);
    }
    // align-content: normal はデフォルト。flex/grid コンテナでのみ効果がある
    if (styles.alignContent && styles.alignContent !== 'normal') {
      const cls = ALIGN_CONTENT_MAP[styles.alignContent];
      if (cls) classes.push(cls);
    }
  }

  // align-self — auto はデフォルト（親の align-items を継承）
  if (styles.alignSelf && styles.alignSelf !== 'auto') {
    const cls = ALIGN_SELF_MAP[styles.alignSelf];
    if (cls) classes.push(cls);
  }

  // flex-grow — 0 はデフォルト
  if (styles.flexGrow && styles.flexGrow !== '0') {
    if (styles.flexGrow === '1') {
      classes.push('grow');
    } else {
      classes.push(`grow-[${styles.flexGrow}]`);
    }
  }

  // flex-shrink — 1 はデフォルト
  if (styles.flexShrink && styles.flexShrink !== '1') {
    if (styles.flexShrink === '0') {
      classes.push('shrink-0');
    } else {
      classes.push(`shrink-[${styles.flexShrink}]`);
    }
  }

  // box-sizing — border-box は Tailwind preflight のデフォルト
  if (styles.boxSizing && styles.boxSizing !== 'border-box') {
    if (styles.boxSizing === 'content-box') {
      classes.push('box-content');
    }
  }

  // Grid item (col-span / row-span 等)
  // display に依存せず常に評価する。auto はデフォルトなので省略
  mapGridItem(styles.gridColumn, 'col', classes);
  mapGridItem(styles.gridRow, 'row', classes);

  // aspect-ratio
  mapAspectRatio(styles.aspectRatio, classes);

  // Background image (gradient等)
  if (styles.backgroundImage && styles.backgroundImage !== 'none') {
    mapBackgroundImage(styles.backgroundImage, classes, inlineStyles);
  }

  // Background color — transparent はデフォルト
  if (
    styles.backgroundColor &&
    styles.backgroundColor !== 'transparent' &&
    styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
  ) {
    mapColor(styles.backgroundColor, 'bg', classes);
  }

  // Text color — 継承チェック
  if (styles.color && !isInherited('color', styles, parentStyles)) {
    mapColor(styles.color, 'text', classes);
  }

  // Opacity — 1 はデフォルト
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

  // Border radius — 0 はデフォルト
  if (styles.borderRadius) {
    if (styles.borderRadius === '50%') {
      classes.push('rounded-full');
    } else {
      const px = parsePx(styles.borderRadius);
      if (px !== null && px > 0) {
        // 要素サイズの半分以上の半径なら視覚的に円/ピル形状 → rounded-full
        // （ページ側がカスタムTailwind configで rounded-full を小さい値にしていても、
        //   実サイズと比較することで誤検知しない）
        const w = parsePx(styles.width);
        const h = parsePx(styles.height);
        const minSide =
          w !== null && h !== null
            ? Math.min(w, h)
            : w !== null
              ? w
              : h !== null
                ? h
                : null;
        if (minSide !== null && minSide > 0 && px >= minSide / 2) {
          classes.push('rounded-full');
        } else if (px >= 999) {
          // サイズが取れないケース向けフォールバック（9999px等の明示的な円指定）
          classes.push('rounded-full');
        } else if (px in RADIUS_MAP) {
          classes.push(RADIUS_MAP[px]);
        } else {
          classes.push(`rounded-[${px}px]`);
        }
      }
    }
  }

  // Border (width + color)
  mapBorder(styles, classes);

  // Box shadow
  mapBoxShadow(styles.boxShadow, classes, inlineStyles);

  // Font family — 継承チェック。フォントスタック内のキーワードから推測する
  if (styles.fontFamily && !isInherited('fontFamily', styles, parentStyles)) {
    const cls = detectFontFamilyClass(styles.fontFamily);
    if (cls) classes.push(cls);
  }

  // Font size — 継承チェック
  if (styles.fontSize && !isInherited('fontSize', styles, parentStyles)) {
    const px = parsePx(styles.fontSize);
    if (px !== null) {
      if (px in FONT_SIZE_MAP) {
        classes.push(FONT_SIZE_MAP[px]);
      } else {
        classes.push(`text-[${px}px]`);
      }
    }
  }

  // Font weight — 継承チェック。400はデフォルト
  if (
    styles.fontWeight &&
    styles.fontWeight !== '400' &&
    !isInherited('fontWeight', styles, parentStyles)
  ) {
    const cls = FONT_WEIGHT_MAP[styles.fontWeight];
    if (cls) classes.push(cls);
  }

  // Line height — 継承チェック
  if (
    styles.lineHeight &&
    styles.lineHeight !== 'normal' &&
    !isInherited('lineHeight', styles, parentStyles)
  ) {
    mapLineHeight(styles.lineHeight, styles.fontSize, classes);
  }

  // Font style (italic)
  if (
    styles.fontStyle &&
    styles.fontStyle !== 'normal' &&
    !isInherited('fontStyle', styles, parentStyles)
  ) {
    if (styles.fontStyle === 'italic' || styles.fontStyle === 'oblique') {
      classes.push('italic');
    }
  }

  // Letter spacing — 継承チェック
  if (
    styles.letterSpacing &&
    styles.letterSpacing !== 'normal' &&
    !isInherited('letterSpacing', styles, parentStyles)
  ) {
    mapLetterSpacing(styles.letterSpacing, styles.fontSize, classes);
  }

  // Text align — 継承チェック。start/leftはデフォルト
  if (
    styles.textAlign &&
    styles.textAlign !== 'start' &&
    styles.textAlign !== 'left' &&
    !isInherited('textAlign', styles, parentStyles)
  ) {
    const cls = TEXT_ALIGN_MAP[styles.textAlign];
    if (cls) classes.push(cls);
  }

  // Text transform — 継承チェック。noneはデフォルト
  if (
    styles.textTransform &&
    styles.textTransform !== 'none' &&
    !isInherited('textTransform', styles, parentStyles)
  ) {
    const cls = TEXT_TRANSFORM_MAP[styles.textTransform];
    if (cls) classes.push(cls);
  }

  // Text decoration — noneはデフォルト
  if (styles.textDecoration) {
    if (styles.textDecoration.includes('underline')) classes.push('underline');
    else if (styles.textDecoration.includes('line-through'))
      classes.push('line-through');
    else if (styles.textDecoration.includes('overline'))
      classes.push('overline');
  }

  // White space — 継承チェック。normalはデフォルト
  if (
    styles.whiteSpace &&
    styles.whiteSpace !== 'normal' &&
    !isInherited('whiteSpace', styles, parentStyles)
  ) {
    if (styles.whiteSpace === 'nowrap') classes.push('whitespace-nowrap');
    else if (styles.whiteSpace === 'pre') classes.push('whitespace-pre');
    else if (styles.whiteSpace === 'pre-wrap')
      classes.push('whitespace-pre-wrap');
    else if (styles.whiteSpace === 'pre-line')
      classes.push('whitespace-pre-line');
    else if (styles.whiteSpace === 'break-spaces')
      classes.push('whitespace-break-spaces');
  }

  // Scale — CSS scale プロパティ（Tailwind v4 で使用）
  if (styles.scale && styles.scale !== 'none' && styles.scale !== '1') {
    mapScale(styles.scale, classes);
  }

  // Transform — none はデフォルト。computed は常に matrix(a,b,c,d,tx,ty) 形式
  if (styles.transform && styles.transform !== 'none') {
    const decomposed = decomposeTransformMatrix(styles.transform);
    if (decomposed && decomposed.length > 0) {
      classes.push(...decomposed);
    } else if (decomposed === null) {
      // 解析できない複雑な transform → inline style にフォールバック
      inlineStyles['transform'] = styles.transform;
    }
    // decomposed === [] は identity matrix（出力なしで OK）
  }

  // Transition — duration 0s はデフォルト（Tailwind v4 リセット）なのでスキップ
  if (styles.transition && styles.transition !== 'none') {
    // "all 0s ease 0s" や duration 0s はリセット値 → スキップ
    const durationMatch = styles.transition.match(/([\d.]+)s/);
    const ms = durationMatch
      ? Math.round(parseFloat(durationMatch[1]) * 1000)
      : 0;
    if (ms > 0) {
      // Tailwind transition utilities
      if (styles.transition.startsWith('all ')) {
        classes.push('transition-all');
      } else if (
        styles.transition.startsWith('color') ||
        styles.transition.startsWith('background-color')
      ) {
        classes.push('transition-colors');
      } else if (styles.transition.startsWith('opacity')) {
        classes.push('transition-opacity');
      } else if (styles.transition.startsWith('box-shadow')) {
        classes.push('transition-shadow');
      } else if (styles.transition.startsWith('transform')) {
        classes.push('transition-transform');
      } else {
        classes.push('transition');
      }

      // Duration — 150ms はデフォルトなのでスキップ
      const knownDurations = [75, 100, 150, 200, 300, 500, 700, 1000];
      if (ms !== 150 && knownDurations.includes(ms)) {
        classes.push(`duration-${ms}`);
      } else if (ms !== 150) {
        classes.push(`duration-[${ms}ms]`);
      }
    }
  }

  // Visibility — visible はデフォルト
  if (styles.visibility && styles.visibility !== 'visible') {
    if (styles.visibility === 'hidden') classes.push('invisible');
    else if (styles.visibility === 'collapse') classes.push('collapse');
  }

  // Isolation — auto はデフォルト
  if (styles.isolation && styles.isolation === 'isolate') {
    classes.push('isolate');
  }

  // Object fit — fill はデフォルト
  if (styles.objectFit && styles.objectFit !== 'fill') {
    const cls = OBJECT_FIT_MAP[styles.objectFit];
    if (cls) classes.push(cls);
  }

  // Object position — "50% 50%" はデフォルト
  if (styles.objectPosition && styles.objectPosition !== '50% 50%') {
    const cls = OBJECT_POSITION_MAP[styles.objectPosition];
    if (cls) {
      classes.push(cls);
    } else {
      // 非標準値 → arbitrary value
      classes.push(`object-[${styles.objectPosition.replace(/\s+/g, '_')}]`);
    }
  }

  // Filter — none はデフォルト
  if (styles.filter && styles.filter !== 'none') {
    const filterClasses = parseFilterFunctions(styles.filter, '');
    if (filterClasses.length > 0) {
      classes.push(...filterClasses);
    } else {
      // 解析失敗 → inline style フォールバック
      inlineStyles['filter'] = styles.filter;
    }
  }

  // Backdrop filter — none はデフォルト
  if (styles.backdropFilter && styles.backdropFilter !== 'none') {
    const filterClasses = parseFilterFunctions(
      styles.backdropFilter,
      'backdrop-',
    );
    if (filterClasses.length > 0) {
      classes.push(...filterClasses);
    } else {
      inlineStyles['backdrop-filter'] = styles.backdropFilter;
    }
  }

  // Background size — auto はデフォルト
  if (styles.backgroundSize && styles.backgroundSize !== 'auto') {
    const cls = BG_SIZE_MAP[styles.backgroundSize];
    if (cls) classes.push(cls);
  }

  // Background position — キーワード組み合わせを Tailwind utility にマップ
  if (styles.backgroundPosition) {
    const cls = BG_POSITION_MAP[styles.backgroundPosition];
    if (cls) classes.push(cls);
  }

  // Background repeat — repeat はデフォルト
  if (styles.backgroundRepeat && styles.backgroundRepeat !== 'repeat') {
    const cls = BG_REPEAT_MAP[styles.backgroundRepeat];
    if (cls) classes.push(cls);
  }

  // Text overflow — clip はデフォルト
  if (styles.textOverflow && styles.textOverflow === 'ellipsis') {
    classes.push('text-ellipsis');
  }

  // Word break — normal はデフォルト
  if (styles.wordBreak && styles.wordBreak !== 'normal') {
    const cls = WORD_BREAK_MAP[styles.wordBreak];
    if (cls) classes.push(cls);
  }

  // Overflow wrap — normal はデフォルト
  if (styles.overflowWrap && styles.overflowWrap === 'break-word') {
    classes.push('break-words');
  }

  // Hyphens — none/manual はブラウザデフォルトが曖昧なので auto/manual のみ出力
  if (styles.hyphens && styles.hyphens !== 'none' && styles.hyphens !== '') {
    const cls = HYPHENS_MAP[styles.hyphens];
    if (cls) classes.push(cls);
  }

  // Vertical align — baseline はデフォルト
  if (styles.verticalAlign && styles.verticalAlign !== 'baseline') {
    const cls = VERTICAL_ALIGN_MAP[styles.verticalAlign];
    if (cls) classes.push(cls);
  }

  // Font smoothing — auto はデフォルト
  if (
    styles.webkitFontSmoothing &&
    styles.webkitFontSmoothing !== 'auto' &&
    styles.webkitFontSmoothing !== ''
  ) {
    if (styles.webkitFontSmoothing === 'antialiased') {
      classes.push('antialiased');
    } else if (styles.webkitFontSmoothing === 'subpixel-antialiased') {
      classes.push('subpixel-antialiased');
    }
  }

  // Cursor — 継承チェック。auto/default はデフォルトなのでスキップ。
  // Tailwind 標準値にマップできなければ inline style フォールバック。
  if (
    styles.cursor &&
    styles.cursor !== 'auto' &&
    styles.cursor !== 'default' &&
    !isInherited('cursor', styles, parentStyles)
  ) {
    const cls = CURSOR_MAP[styles.cursor];
    if (cls) {
      classes.push(cls);
    } else {
      inlineStyles['cursor'] = styles.cursor;
    }
  }

  // Fallback styles
  if (styles.fallback) {
    for (const [prop, value] of Object.entries(styles.fallback)) {
      inlineStyles[prop] = value;
    }
  }

  return { classes, inlineStyles };
}

/**
 * 継承プロパティが親と同じ値かチェック
 * 親と同じなら出力不要（trueを返す）
 */
function isInherited(
  prop: keyof NormalizedStyles,
  styles: NormalizedStyles,
  parentStyles?: NormalizedStyles,
): boolean {
  if (!parentStyles) return false;
  if (!INHERITED_PROPERTIES.includes(prop)) return false;
  return styles[prop] === parentStyles[prop];
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
  if (value === 'min-content') {
    classes.push(`${prefix}-min`);
    return;
  }
  if (value === 'max-content') {
    classes.push(`${prefix}-max`);
    return;
  }
  if (value === 'fit-content') {
    classes.push(`${prefix}-fit`);
    return;
  }
  // 任意パーセンテージ（50%, 33.333% 等）は arbitrary value として出力
  if (/^[\d.]+%$/.test(value)) {
    classes.push(`${prefix}-[${value}]`);
    return;
  }
  // 0pxはデフォルト値としてスキップ（min-w, min-h）
  if (prefix.startsWith('min-') && value === '0px') return;
  const px = parsePx(value);
  if (px === null) return;
  // max-w は Tailwind 独自の rem スケール（max-w-xs..max-w-7xl）を優先
  if (prefix === 'max-w' && px in MAX_WIDTH_REM_MAP) {
    classes.push(MAX_WIDTH_REM_MAP[px]);
    return;
  }
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

  // margin のみ auto をサポート（padding には auto は存在しない）
  const isMargin = prefix === 'm';
  const isAuto = (v: string | undefined) => isMargin && v === 'auto';

  // auto を先に分離して Tailwind の auto utility として出力
  const autoTop = isAuto(sides.top);
  const autoRight = isAuto(sides.right);
  const autoBottom = isAuto(sides.bottom);
  const autoLeft = isAuto(sides.left);

  if (isMargin) {
    // 上下左右すべて auto
    if (autoTop && autoRight && autoBottom && autoLeft) {
      classes.push('m-auto');
    }
    // X軸のみ auto（mx-auto：中央寄せの最頻出ケース）
    else if (autoLeft && autoRight && !autoTop && !autoBottom) {
      classes.push('mx-auto');
    }
    // Y軸のみ auto
    else if (autoTop && autoBottom && !autoLeft && !autoRight) {
      classes.push('my-auto');
    }
    // 片側のみ
    else {
      if (autoTop) classes.push('mt-auto');
      if (autoRight) classes.push('mr-auto');
      if (autoBottom) classes.push('mb-auto');
      if (autoLeft) classes.push('ml-auto');
    }
  }

  // 残りの数値side を処理（auto は対象外）
  const top = autoTop ? null : (parsePx(sides.top) ?? 0);
  const right = autoRight ? null : (parsePx(sides.right) ?? 0);
  const bottom = autoBottom ? null : (parsePx(sides.bottom) ?? 0);
  const left = autoLeft ? null : (parsePx(sides.left) ?? 0);

  // 数値値がすべて存在して 0 ならスキップ
  const hasAnyNumeric =
    top !== null || right !== null || bottom !== null || left !== null;
  if (!hasAnyNumeric) return;

  const allZero =
    (top === null || top === 0) &&
    (right === null || right === 0) &&
    (bottom === null || bottom === 0) &&
    (left === null || left === 0);
  if (allZero) return;

  // auto と数値が混在している場合、まとめ出力は諦めて個別出力
  const hasAutoMix = autoTop || autoRight || autoBottom || autoLeft;

  if (!hasAutoMix) {
    // 全方向同じ
    if (top === right && right === bottom && bottom === left) {
      classes.push(formatSpacingClass(prefix, '', top as number));
      return;
    }

    // X軸・Y軸が同じ
    if (top === bottom && left === right) {
      if (top !== 0)
        classes.push(formatSpacingClass(prefix, 'y', top as number));
      if (left !== 0)
        classes.push(formatSpacingClass(prefix, 'x', left as number));
      return;
    }
  }

  // 個別
  if (top !== null && top !== 0)
    classes.push(formatSpacingClass(prefix, 't', top));
  if (right !== null && right !== 0)
    classes.push(formatSpacingClass(prefix, 'r', right));
  if (bottom !== null && bottom !== 0)
    classes.push(formatSpacingClass(prefix, 'b', bottom));
  if (left !== null && left !== 0)
    classes.push(formatSpacingClass(prefix, 'l', left));
}

function mapGap(value: string | undefined, prefix: string, classes: string[]) {
  if (!value || value === 'normal') return;
  const px = parsePx(value);
  if (px === null || px === 0) return;
  classes.push(`${prefix}-${spacingClass(px)}`);
}

/**
 * 2D transform matrix を decompose して Tailwind class のリストを返す。
 *
 * computed transform は常に `matrix(a, b, c, d, tx, ty)` または
 * `matrix3d(...)` 形式で返る（matrix3d は未対応 → null）。
 *
 * 対応ケース (bare変換のみ):
 *   - identity: matrix(1,0,0,1,0,0) → []
 *   - pure translate: matrix(1,0,0,1,tx,ty)
 *   - pure scale: matrix(sx,0,0,sy,0,0)
 *   - pure rotate: matrix(cos,sin,-sin,cos,0,0)
 *
 * 複合変換は decomposition が曖昧なので null を返し、inline style に
 * フォールバックさせる。
 */
function decomposeTransformMatrix(value: string): string[] | null {
  const match = value.match(/^matrix\(([^)]+)\)$/);
  if (!match) return null; // matrix3d 等
  const nums = match[1].split(',').map((s) => parseFloat(s.trim()));
  if (nums.length !== 6 || nums.some((n) => isNaN(n))) return null;
  const [a, b, c, d, tx, ty] = nums;
  const EPS = 1e-6;
  const near = (x: number, y: number) => Math.abs(x - y) < EPS;

  // Identity
  if (
    near(a, 1) &&
    near(b, 0) &&
    near(c, 0) &&
    near(d, 1) &&
    near(tx, 0) &&
    near(ty, 0)
  ) {
    return [];
  }

  // Pure translate: a=1, b=0, c=0, d=1
  if (near(a, 1) && near(b, 0) && near(c, 0) && near(d, 1)) {
    const out: string[] = [];
    if (!near(tx, 0)) out.push(formatTranslate('x', tx));
    if (!near(ty, 0)) out.push(formatTranslate('y', ty));
    return out;
  }

  // Pure scale: b=0, c=0, tx=0, ty=0
  if (near(b, 0) && near(c, 0) && near(tx, 0) && near(ty, 0)) {
    if (near(a, d)) {
      const out: string[] = [];
      mapScale(String(a), out);
      return out;
    }
    const out: string[] = [];
    if (!near(a, 1)) out.push(`scale-x-[${a}]`);
    if (!near(d, 1)) out.push(`scale-y-[${d}]`);
    return out;
  }

  // Pure rotate: a=d=cos(θ), b=-c=sin(θ), tx=ty=0, a²+b²=1
  if (
    near(tx, 0) &&
    near(ty, 0) &&
    near(a, d) &&
    near(b, -c) &&
    near(a * a + b * b, 1)
  ) {
    const rad = Math.atan2(b, a);
    const deg = (rad * 180) / Math.PI;
    return [formatRotate(deg)];
  }

  // 複合変換（scale+rotate, translate+rotate 等）は decomposition が曖昧
  return null;
}

/** translate を Tailwind spacing scale or arbitrary value に変換 */
function formatTranslate(axis: 'x' | 'y', px: number): string {
  const abs = Math.abs(px);
  const neg = px < 0 ? '-' : '';
  if (abs in SPACING_MAP) {
    return `${neg}translate-${axis}-${SPACING_MAP[abs]}`;
  }
  return `${neg}translate-${axis}-[${abs}px]`;
}

/** rotate の deg を Tailwind 標準値 or arbitrary value に変換 */
function formatRotate(deg: number): string {
  const rounded = Math.round(deg * 100) / 100;
  const abs = Math.abs(rounded);
  const neg = rounded < 0 ? '-' : '';
  const knownDegrees = [0, 1, 2, 3, 6, 12, 45, 90, 180];
  if (knownDegrees.includes(abs)) {
    return `${neg}rotate-${abs}`;
  }
  return `${neg}rotate-[${abs}deg]`;
}

function mapScale(value: string, classes: string[]) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 1) return;
  const knownScales = [0, 0.5, 0.75, 0.9, 0.95, 1.05, 1.1, 1.25, 1.5];
  if (knownScales.includes(num)) {
    classes.push(`scale-${Math.round(num * 100)}`);
  } else {
    classes.push(`scale-[${value}]`);
  }
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
  if (hex === '#ffffff') {
    classes.push(`${prefix}-white`);
    return;
  }
  if (hex === '#000000') {
    classes.push(`${prefix}-black`);
    return;
  }
  if (hex.startsWith('#')) {
    classes.push(`${prefix}-[${hex}]`);
    return;
  }
  if (hex.startsWith('rgba')) {
    classes.push(`${prefix}-[${hex}]`);
    return;
  }
}

function pushBorderWidth(width: number, prefix: string, classes: string[]) {
  if (width === 1) classes.push(prefix);
  else if (width === 2) classes.push(`${prefix}-2`);
  else if (width === 4) classes.push(`${prefix}-4`);
  else if (width === 8) classes.push(`${prefix}-8`);
  else classes.push(`${prefix}-[${width}px]`);
}

/**
 * border color class を名前付き utility 優先で push する。
 * 例: '#000000' → border-black, 'transparent' → border-transparent, '#1d9bf0' → border-[#1d9bf0]
 */
function pushBorderColorClass(
  prefix: string,
  color: string,
  classes: string[],
) {
  if (color === 'transparent') {
    classes.push(`${prefix}-transparent`);
    return;
  }
  if (color === '#ffffff') {
    classes.push(`${prefix}-white`);
    return;
  }
  if (color === '#000000') {
    classes.push(`${prefix}-black`);
    return;
  }
  classes.push(`${prefix}-[${color}]`);
}

function mapBorder(styles: NormalizedStyles, classes: string[]) {
  const borders = [
    styles.borderTop,
    styles.borderRight,
    styles.borderBottom,
    styles.borderLeft,
  ];
  // border-style が none / hidden の辺は視覚的に描画されないため幅を 0 扱いにする
  const widths = borders.map((b) => {
    if (!b) return 0;
    const match = b.match(/^([\d.]+)px\s+(\S+)/);
    if (!match) return 0;
    const style = match[2];
    if (style === 'none' || style === 'hidden') return 0;
    return parseFloat(match[1]);
  });

  const [top, right, bottom, left] = widths;
  const allSame = widths.every((w) => w === top);

  if (allSame && top > 0) {
    // 4辺すべて同じ
    pushBorderWidth(top, 'border', classes);
  } else if (!allSame) {
    // 片側・2辺ボーダー
    const sides: [number, string][] = [
      [top, 'border-t'],
      [right, 'border-r'],
      [bottom, 'border-b'],
      [left, 'border-l'],
    ];
    for (const [w, prefix] of sides) {
      if (w > 0) pushBorderWidth(w, prefix, classes);
    }
  }

  // Border color（辺ごとに異なる色に対応）
  const hasBorder = widths.some((w) => w > 0);
  if (hasBorder && !styles.borderColor) {
    const sideNames = ['border-t', 'border-r', 'border-b', 'border-l'];
    // transparent も明示的な値として扱う（hover で色が変わるケース用）
    const colors = borders.map((b, i) => {
      if (widths[i] === 0 || !b) return null;
      const colorPart = b.replace(/^[\d.]+px\s+\S+\s+/, '').trim();
      if (!colorPart) return null;
      const hex = rgbToHex(colorPart);
      // rgbToHex が正規化に失敗した場合（元の値が返る）はスキップ
      if (hex === colorPart && !hex.startsWith('#')) return null;
      return hex;
    });

    const validColors = colors.filter((c): c is string => c !== null);
    const uniqueColors = [...new Set(validColors)];

    if (uniqueColors.length === 1) {
      // 全辺同じ色 — 名前付き utility に寄せる
      pushBorderColorClass('border', uniqueColors[0], classes);
    } else if (uniqueColors.length > 1) {
      // 最頻色をベースに、異なる辺を個別指定
      const colorCounts = new Map<string, number>();
      for (const c of validColors) {
        colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
      }
      const baseColor = [...colorCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0][0];
      pushBorderColorClass('border', baseColor, classes);
      for (let i = 0; i < 4; i++) {
        if (colors[i] && colors[i] !== baseColor) {
          pushBorderColorClass(sideNames[i], colors[i] as string, classes);
        }
      }
    }
  }

  // Border color (独立指定 — base補正やpseudo-classのborder-color変更用)
  if (styles.borderColor) {
    mapColor(styles.borderColor, 'border', classes);
  }

  // Border style — solid (default) 以外の style を出力。全辺同じ style のみ対応
  if (hasBorder) {
    const styles2 = borders.map((b) => {
      if (!b) return null;
      const match = b.match(/^[\d.]+px\s+(\S+)/);
      return match ? match[1] : null;
    });
    // 幅がある辺だけ見て style を集計
    const relevantStyles = styles2.filter(
      (s, i) => widths[i] > 0 && s !== null,
    ) as string[];
    const uniqueStyles = [...new Set(relevantStyles)];
    if (uniqueStyles.length === 1 && uniqueStyles[0] !== 'solid') {
      const cls = BORDER_STYLE_MAP[uniqueStyles[0]];
      if (cls) classes.push(cls);
    }
  }
}

const GRADIENT_DIRECTION_MAP: Record<string, string> = {
  'to top': 'bg-gradient-to-t',
  'to top right': 'bg-gradient-to-tr',
  'to right': 'bg-gradient-to-r',
  'to right bottom': 'bg-gradient-to-br',
  'to bottom right': 'bg-gradient-to-br',
  'to bottom': 'bg-gradient-to-b',
  'to bottom left': 'bg-gradient-to-bl',
  'to left': 'bg-gradient-to-l',
  'to top left': 'bg-gradient-to-tl',
  'to left top': 'bg-gradient-to-tl',
};

function mapBackgroundImage(
  value: string,
  classes: string[],
  inlineStyles: Record<string, string>,
) {
  // linear-gradient のパース — 括弧内のカンマを考慮してトップレベルのカンマで分割
  const lgPrefix = 'linear-gradient(';
  if (value.startsWith(lgPrefix) && value.endsWith(')')) {
    const inner = value.slice(lgPrefix.length, -1);
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of inner) {
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    parts.push(current.trim());

    if (parts.length >= 3) {
      const direction = parts[0];
      const twDirection = GRADIENT_DIRECTION_MAP[direction];
      if (twDirection) {
        const stops = parts.slice(1);
        const colors = stops.map((stop) => {
          const colorPart = stop.replace(/\s+\d+%$/, '').trim();
          return rgbToHex(colorPart);
        });

        if (
          colors.length >= 2 &&
          colors.every(
            (c) =>
              c !== 'transparent' &&
              !c.includes('oklch') &&
              !c.includes('oklab'),
          )
        ) {
          classes.push(twDirection);
          classes.push(`from-[${colors[0]}]`);
          if (colors.length === 3) {
            classes.push(`via-[${colors[1]}]`);
            classes.push(`to-[${colors[2]}]`);
          } else {
            classes.push(`to-[${colors[colors.length - 1]}]`);
          }
          return;
        }
      }
    }
  }

  // フォールバック: oklch/oklab色をhexに変換してinline style
  const converted = value.replace(/oklch?\([^)]+\)|oklab?\([^)]+\)/g, (match) =>
    normalizeColor(match),
  );
  inlineStyles['background-image'] = converted;
}

function mapBoxShadow(
  value: string | undefined,
  _classes: string[],
  inlineStyles: Record<string, string>,
) {
  if (!value || value === 'none') return;
  // box-shadow は元の値をそのまま維持する（近似変換による情報損失を避ける）
  inlineStyles['box-shadow'] = value;
}

function mapGridTemplate(
  value: string | undefined,
  prefix: string,
  classes: string[],
) {
  if (!value || value === 'none') return;
  const repeatMatch = value.match(
    /^repeat\((\d+),\s*minmax\(0(?:px)?,\s*1fr\)\)$/,
  );
  if (repeatMatch) {
    classes.push(`${prefix}-${repeatMatch[1]}`);
    return;
  }
  const parts = value.trim().split(/\s+/);
  if (parts.every((p) => p === '1fr')) {
    classes.push(`${prefix}-${parts.length}`);
    return;
  }
  // 全パーツが同じ値（例: "167px 167px"）→ 均等分割と見なす
  if (parts.length > 1 && parts.every((p) => p === parts[0])) {
    classes.push(`${prefix}-${parts.length}`);
    return;
  }
  classes.push(`${prefix}-[${value.replace(/\s+/g, '_')}]`);
}

/**
 * letter-spacing の computed 値を Tailwind tracking-* utility にマップする。
 * letter-spacing の既知比率（em ベース）に近ければ名前付き utility を使い、
 * そうでなければ px 任意値で出力する。
 */
function mapLetterSpacing(
  value: string,
  fontSize: string | undefined,
  classes: string[],
): void {
  const px = parsePx(value);
  if (px === null || px === 0) return;
  const fsPx = parsePx(fontSize);
  if (fsPx !== null && fsPx > 0) {
    const ratio = px / fsPx;
    const known: Record<string, string> = {
      '-0.05': 'tracking-tighter',
      '-0.025': 'tracking-tight',
      '0.025': 'tracking-wide',
      '0.05': 'tracking-wider',
      '0.1': 'tracking-widest',
    };
    for (const [r, cls] of Object.entries(known)) {
      if (Math.abs(ratio - parseFloat(r)) < 0.001) {
        classes.push(cls);
        return;
      }
    }
  }
  const neg = px < 0 ? '-' : '';
  const abs = Math.abs(px);
  classes.push(`${neg}tracking-[${abs}px]`);
}

/**
 * line-height の computed / authored 値を Tailwind leading-* utility にマップする。
 *
 * 方針: 「author が明示的に意図した line-height」だけ出力する。
 * - unitless 数値（1.1, 1.5 等）は author が書いた値なので常に出力
 * - px 値は「font-size と等しい」または「既知比率に一致する」場合のみ出力
 * - それ以外の px 値（親から継承された body デフォルト等）は出力しない
 */
function mapLineHeight(
  value: string,
  fontSize: string | undefined,
  classes: string[],
) {
  const KNOWN_RATIOS: Record<string, string> = {
    '1': 'leading-none',
    '1.25': 'leading-tight',
    '1.375': 'leading-snug',
    '1.5': 'leading-normal',
    '1.625': 'leading-relaxed',
    '2': 'leading-loose',
  };

  // 単位なし数値（unitless line-height）→ author 明示と判断し常に出力
  const unitless = value.match(/^[\d.]+$/);
  if (unitless) {
    const key = parseFloat(value).toString();
    if (key in KNOWN_RATIOS) {
      classes.push(KNOWN_RATIOS[key]);
    } else {
      classes.push(`leading-[${value}]`);
    }
    return;
  }

  // px 値: font-size との比率で既知値にマッチする場合のみ出力。
  // （マッチしない px 値は body からの継承等のノイズ扱いでスキップ）
  const lhPx = parsePx(value);
  const fsPx = parsePx(fontSize);
  if (lhPx !== null && fsPx !== null) {
    const ratio = lhPx / fsPx;
    for (const [r, cls] of Object.entries(KNOWN_RATIOS)) {
      if (Math.abs(ratio - parseFloat(r)) < 0.01) {
        classes.push(cls);
        return;
      }
    }
  }
  // マッチしない px 値は出力しない
}

/**
 * aspect-ratio の computed value を Tailwind aspect-* utility にマップする。
 * ブラウザが返す形式: `"auto"`, `"1 / 1"`, `"4 / 5"`, `"16 / 9"`, `"2"` (= "2 / 1"), 等。
 * - `auto` → 出力なし
 * - `1 / 1` → `aspect-square`
 * - `16 / 9` → `aspect-video`
 * - それ以外 → arbitrary value `aspect-[4/5]`
 */
function mapAspectRatio(value: string | undefined, classes: string[]): void {
  if (!value) return;
  const normalized = value.trim();
  if (normalized === 'auto' || normalized === '') return;
  // 空白を除去して正規化（"4 / 5" → "4/5"）
  const compact = normalized.replace(/\s+/g, '');
  if (compact === '1/1' || compact === '1') {
    classes.push('aspect-square');
    return;
  }
  if (compact === '16/9') {
    classes.push('aspect-video');
    return;
  }
  classes.push(`aspect-[${compact}]`);
}

/**
 * grid-column / grid-row の computed value を col-span-* / row-span-* 等にマップする。
 * ブラウザが返す値の例:
 *   - "auto" / "auto / auto"                     → 出力なし
 *   - "span 2 / span 2"                          → `${prefix}-span-2`
 *   - "span 2"                                   → `${prefix}-span-2`
 *   - "1 / span 2"                               → `${prefix}-start-1 ${prefix}-span-2`
 *   - "1 / 3"                                    → `${prefix}-start-1 ${prefix}-end-3`
 * これ以外の複雑な値は arbitrary value としてフォールバック出力する。
 */
function mapGridItem(
  value: string | undefined,
  prefix: 'col' | 'row',
  classes: string[],
) {
  if (!value) return;
  const normalized = value.trim();
  if (normalized === 'auto' || normalized === 'auto / auto') return;

  // "span N / span N" → col-span-N
  const symmetricSpan = normalized.match(/^span\s+(\d+)\s*\/\s*span\s+\1$/);
  if (symmetricSpan) {
    classes.push(`${prefix}-span-${symmetricSpan[1]}`);
    return;
  }

  // "span N" (ショートハンド、稀) → col-span-N
  const shortSpan = normalized.match(/^span\s+(\d+)$/);
  if (shortSpan) {
    classes.push(`${prefix}-span-${shortSpan[1]}`);
    return;
  }

  // 数値 grid line を出力する。負数は Tailwind 標準に該当 utility がないので
  // arbitrary value 形式（col-start-[-1] 等）で出す。正数は utility 形式。
  const emitLine = (num: number, side: 'start' | 'end', out: string[]) => {
    if (num < 0) {
      out.push(`${prefix}-${side}-[${num}]`);
    } else {
      out.push(`${prefix}-${side}-${num}`);
    }
  };

  // "N / M" または "N / span M"
  const parts = normalized.split('/').map((p) => p.trim());
  if (parts.length === 2) {
    const [start, end] = parts;
    const out: string[] = [];
    if (start !== 'auto') {
      if (/^-?\d+$/.test(start)) {
        emitLine(parseInt(start, 10), 'start', out);
      } else {
        // 不明な start → 全体を arbitrary
        classes.push(`${prefix}-[${normalized.replace(/\s+/g, '_')}]`);
        return;
      }
    }
    if (end !== 'auto') {
      const spanMatch = end.match(/^span\s+(\d+)$/);
      if (spanMatch) {
        out.push(`${prefix}-span-${spanMatch[1]}`);
      } else if (/^-?\d+$/.test(end)) {
        emitLine(parseInt(end, 10), 'end', out);
      } else {
        classes.push(`${prefix}-[${normalized.replace(/\s+/g, '_')}]`);
        return;
      }
    }
    classes.push(...out);
    return;
  }

  // 上記いずれにもマッチしないケースは arbitrary value でフォールバック
  classes.push(`${prefix}-[${normalized.replace(/\s+/g, '_')}]`);
}

/**
 * ExtractedChildをOutputChildに変換する
 */
function convertChild(child: ExtractedChild): OutputChild {
  if (child.type === 'text') {
    return child;
  }
  return convertToOutput(child);
}

/**
 * Tailwindクラスからプロパティプレフィックスを抽出する。
 * "bg-white" → "bg", "text-sm" → "text", "p-4" → "p",
 * "rounded-lg" → "rounded", "font-bold" → "font"
 */
function extractClassPrefix(cls: string): string {
  const arbMatch = cls.match(/^(-?[a-z]+(?:-[a-z]+)*?)-\[/);
  if (arbMatch) return arbMatch[1];
  const dashIdx = cls.indexOf('-');
  if (dashIdx === -1) return cls;
  return cls.substring(0, dashIdx);
}

/**
 * ベースクラスと疑似クラスのクラスをプロパティグループ単位でインターリーブする。
 * 例: bg-white hover:bg-blue-500 active:bg-blue-700 text-black hover:text-white
 */
function interleaveWithPseudo(
  baseClasses: string[],
  pseudoClassMap: Map<PseudoClass, string[]>,
): string[] {
  if (pseudoClassMap.size === 0) return baseClasses;

  // 各ベースクラスのプレフィックスの最後の出現位置を記録
  const lastPrefixIndex = new Map<string, number>();
  for (let i = 0; i < baseClasses.length; i++) {
    lastPrefixIndex.set(extractClassPrefix(baseClasses[i]), i);
  }

  // 各ベースクラスの後に挿入する疑似クラスを事前計算
  // 同じプレフィックスの最後のベースクラスの後に疑似クラスを配置
  const insertAfter = new Map<number, string[]>();
  for (const pc of PSEUDO_CLASS_LIST) {
    const pseudoClasses = pseudoClassMap.get(pc);
    if (!pseudoClasses) continue;

    for (const pseudoClass of pseudoClasses) {
      const unprefixed = pseudoClass.replace(/^[a-z][-a-z]*:/, '');
      const pseudoPrefix = extractClassPrefix(unprefixed);
      const lastIdx = lastPrefixIndex.get(pseudoPrefix);

      if (lastIdx !== undefined) {
        const existing = insertAfter.get(lastIdx) ?? [];
        existing.push(pseudoClass);
        insertAfter.set(lastIdx, existing);
      } else {
        // マッチするベースクラスがない場合は末尾に追加
        const existing = insertAfter.get(-1) ?? [];
        existing.push(pseudoClass);
        insertAfter.set(-1, existing);
      }
    }
  }

  // ベースク���スを順に出力し、対応する疑似クラスを挿入
  const result: string[] = [];
  for (let i = 0; i < baseClasses.length; i++) {
    result.push(baseClasses[i]);
    const toInsert = insertAfter.get(i);
    if (toInsert) {
      result.push(...toInsert);
    }
  }

  // マッチしなかった疑似クラスを末尾に追加
  const remaining = insertAfter.get(-1);
  if (remaining) {
    result.push(...remaining);
  }

  return result;
}

// ─── Tree-level post processing ───

/** この要素に anchor される可能性がある子孫の position 値 */
const ANCHOR_TARGET_CLASSES = new Set(['absolute', 'fixed']);

/** 子孫方向への走査で positioning context の境界となる position 値 */
const POSITIONING_CONTEXT_CLASSES = new Set([
  'relative',
  'absolute',
  'fixed',
  'sticky',
]);

/** position offset を示すクラスプレフィックス */
const OFFSET_CLASS_REGEX =
  /^-?(top|right|bottom|left|inset|inset-x|inset-y)(-|$)/;

/** 意味のないラッパー候補となるタグ（その他のタグは構造的意図があるので剥がさない） */
const COLLAPSIBLE_WRAPPER_TAGS = new Set(['div', 'span']);

function hasOffsetClass(classList: string[]): boolean {
  return classList.some((c) => OFFSET_CLASS_REGEX.test(c));
}

/**
 * 明示的な非ゼロ z-index class が付いているかを判定する。
 * z-index は positioned element (relative/absolute/fixed/sticky) でないと
 * 適用されないので、非ゼロ z-index があれば relative は剥がせない。
 * z-0 はデフォルト層を明示しているだけのことが多いので非ゼロ扱いしない。
 */
function hasNonZeroZIndex(classList: string[]): boolean {
  for (const c of classList) {
    if (c === 'z-0') continue;
    // 標準値 (z-10, z-20, z-30, z-40, z-50)
    if (/^z-\d+$/.test(c)) return true;
    // Arbitrary value: z-[2], z-[-1], z-[999]
    const arb = c.match(/^z-\[(.+)\]$/);
    if (arb) {
      const val = arb[1];
      if (val !== '0') return true;
    }
  }
  return false;
}

/**
 * この要素に直接 anchor される（= 最近接の positioned 祖先になる）absolute/fixed 子孫が
 * あるかを判定する。途中で別の positioning context (relative/absolute/fixed/sticky) に
 * 当たったら、その枝はそこより深い absolute が別の要素に anchor されるのでスキップする。
 * CSS 仕様: absolute は最近接の positioned 祖先に対してのみ位置決めされる。
 */
function hasAnchoredAbsoluteDescendant(node: OutputNode): boolean {
  for (const child of node.children) {
    if (child.type !== 'element') continue;

    // child 自体が absolute/fixed → この要素に anchor される
    if (child.classList.some((c) => ANCHOR_TARGET_CLASSES.has(c))) {
      return true;
    }

    // child が別の positioning context を生成している → その枝は探索中断
    if (child.classList.some((c) => POSITIONING_CONTEXT_CLASSES.has(c))) {
      continue;
    }

    // child は中立なラッパー → さらに深く探す
    if (hasAnchoredAbsoluteDescendant(child)) return true;
  }
  return false;
}

/**
 * 視覚的効果のない `relative` と `z-0` を剥がす。
 * - 本要素に top/right/bottom/left オフセットがない
 * - 子孫に position: absolute/fixed がない
 * 両方を満たす場合は `relative` と `z-0` を剥がす。
 * `sticky` は常に維持する（offsets と組み合わせて意味を持つため）。
 */
function stripUselessRelative(node: OutputNode): OutputNode {
  // bottom-up で先に子を処理
  const newChildren: OutputChild[] = node.children.map((child) =>
    child.type === 'element' ? stripUselessRelative(child) : child,
  );
  const processed: OutputNode = { ...node, children: newChildren };

  const hasRelative = processed.classList.includes('relative');
  if (!hasRelative) return processed;

  const hasOffsets = hasOffsetClass(processed.classList);
  const hasPositionedChild = hasAnchoredAbsoluteDescendant(processed);
  const hasMeaningfulZ = hasNonZeroZIndex(processed.classList);
  if (hasOffsets || hasPositionedChild || hasMeaningfulZ) {
    return processed;
  }

  // relative も z-0 も視覚的に効いていないので剥がす
  const filtered = processed.classList.filter(
    (c) => c !== 'relative' && c !== 'z-0',
  );
  return { ...processed, classList: filtered };
}

/**
 * クラスが空要素に対して視覚的・レイアウト的な効果を持つかどうか判定する。
 * flex/items-center/text-* 等は子要素・テキストがあって初めて効果が出るので、
 * 空要素に付いていても無意味と見なす。
 */
function isEffectiveOnEmpty(cls: string): boolean {
  // Positioning: absolute/fixed/sticky は配置を生む
  if (cls === 'absolute' || cls === 'fixed' || cls === 'sticky') return true;
  // Sizing
  if (/^(w|h|min-w|min-h|max-w|max-h|size|aspect)-/.test(cls)) return true;
  // Padding (p-, px-, py-, pt-, pr-, pb-, pl-)
  if (/^p[trblxy]?-/.test(cls)) return true;
  // Margin (including negative)
  if (/^-?m[trblxy]?-/.test(cls)) return true;
  // Position offsets (top-, -top-, inset-, etc.)
  if (/^-?(top|right|bottom|left|inset|inset-x|inset-y)-/.test(cls)) {
    return true;
  }
  // Background (bg-*, except bg-none / bg-transparent — still treat as visual
  // for safety since gradients use bg-* too)
  if (cls.startsWith('bg-')) return true;
  // Border width / color（border-none, border-0 は非表示のため除外）
  if (cls === 'border-none' || cls === 'border-0') return false;
  if (cls === 'border' || cls.startsWith('border-')) return true;
  // Ring / outline
  if (cls.startsWith('ring') || cls.startsWith('outline-')) return true;
  // Shadow
  if (cls.startsWith('shadow') || cls.startsWith('drop-shadow')) return true;
  // Transform — creates containing block
  if (/^-?(scale|rotate|translate|skew)-/.test(cls)) return true;
  if (cls === 'transform') return true;
  // Opacity < 100 still renders a (transparent-ish) box, but on empty
  // element that's still invisible → treat as non-effective
  return false;
}

/** flex を container として設定する class */
const FLEX_CONTAINER_CLASSES = new Set(['flex', 'inline-flex']);

/** flex direction クラス（自身で flex direction を指定） */
const FLEX_DIRECTION_CLASSES = new Set([
  'flex-col',
  'flex-row',
  'flex-col-reverse',
  'flex-row-reverse',
]);

/**
 * flex container に付与されていると「単一子でも意味が残る」class。
 * これらが付いている場合は flex を剥がさない。
 */
const FLEX_COMPANION_PATTERNS = [
  /^items-/,
  /^justify-/,
  /^content-/,
  /^place-/,
  /^gap-/,
  /^flex-wrap/,
  /^flex-nowrap/,
];

function hasFlexCompanion(classList: string[]): boolean {
  return classList.some((c) => FLEX_COMPANION_PATTERNS.some((p) => p.test(c)));
}

/**
 * 単一 element 子を持つ flex container から、視覚効果のない `flex` / `flex-col` 等を剥がす。
 * 条件:
 *   - classList に flex / inline-flex がある
 *   - 子がちょうど 1 つ、かつ element（text の場合 text flow が変わる恐れがあるので対象外）
 *   - items-*, justify-*, gap-*, flex-wrap 等の同伴クラスが無い
 */
function stripRedundantFlex(node: OutputNode): OutputNode {
  const cls = node.classList;
  const hasFlex = cls.some((c) => FLEX_CONTAINER_CLASSES.has(c));
  if (!hasFlex) return node;
  if (node.children.length !== 1) return node;
  if (node.children[0].type !== 'element') return node;
  if (hasFlexCompanion(cls)) return node;

  const filtered = cls.filter(
    (c) => !FLEX_CONTAINER_CLASSES.has(c) && !FLEX_DIRECTION_CLASSES.has(c),
  );
  return { ...node, classList: filtered };
}

/**
 * 空要素かつ視覚効果のないラッパーかどうか判定する。
 * 削除候補は div/span のみ（semantic タグは構造的意図を保持）。
 */
function isRemovableEmptyElement(node: OutputNode): boolean {
  if (node.children.length > 0) return false;
  if (!COLLAPSIBLE_WRAPPER_TAGS.has(node.tagName)) return false;
  if (Object.keys(node.attributes).length > 0) return false;
  if (Object.keys(node.style).length > 0) return false;
  // 視覚効果を持つクラスが 1 つでもあれば残す
  return !node.classList.some(isEffectiveOnEmpty);
}

/**
 * 装飾を持たないラッパー要素かどうか判定する。
 * 畳み込み候補は div/span のみ（nav/section 等のセマンティックタグは構造的意図を尊重）。
 */
function isEmptyWrapper(node: OutputNode): boolean {
  return (
    COLLAPSIBLE_WRAPPER_TAGS.has(node.tagName) &&
    node.classList.length === 0 &&
    Object.keys(node.style).length === 0 &&
    Object.keys(node.attributes).length === 0
  );
}

/**
 * 装飾を持たないラッパー要素を畳み込む。ついでに視覚効果ゼロの空要素を除去する。
 * 各子要素について:
 *   - empty wrapper ならその children を親に inline
 *   - 削除可能な空要素なら丸ごと削除
 * 自分自身が empty wrapper かつ element 子が 1 つだけなら、その element で置き換える。
 */
function collapseWrappers(node: OutputNode): OutputNode {
  // 1. 子を先に再帰処理
  const processedChildren: OutputChild[] = node.children.map((child) =>
    child.type === 'element' ? collapseWrappers(child) : child,
  );

  // 2. 各子について、empty wrapper ならその children を親に inline、
  //    視覚効果のない空要素は丸ごとドロップ
  const filteredChildren: OutputChild[] = [];
  for (const child of processedChildren) {
    if (child.type !== 'element') {
      filteredChildren.push(child);
      continue;
    }
    if (isRemovableEmptyElement(child)) {
      // 視覚効果のない空要素 → 削除
      continue;
    }
    if (isEmptyWrapper(child)) {
      filteredChildren.push(...child.children);
      continue;
    }
    filteredChildren.push(child);
  }

  let current: OutputNode = { ...node, children: filteredChildren };

  // 3. 単一子の場合、自分自身の冗長な flex を剥がす（効果を生まないため）
  current = stripRedundantFlex(current);

  // 4. 自分自身が empty wrapper で element 子が 1 つならその element に置き換える
  while (
    isEmptyWrapper(current) &&
    current.children.length === 1 &&
    current.children[0].type === 'element'
  ) {
    current = current.children[0] as OutputNode;
  }

  return current;
}

/**
 * OutputNode ツリー全体に視覚的に無意味なノイズ削減を適用する。
 * Pass 1: `relative` / `z-0` の無効化剥がし
 * Pass 2: 装飾なしラッパー要素の畳み込み
 */
export function optimizeOutputTree(node: OutputNode): OutputNode {
  const stripped = stripUselessRelative(node);
  return collapseWrappers(stripped);
}

/**
 * ExtractedNodeをOutputNodeに変換する（再帰）
 */
export function convertToOutput(node: ExtractedNode): OutputNode {
  const { classes: baseClasses, inlineStyles } = mapStylesToTailwind(
    node.styles,
    node.tagName,
    node.parentStyles,
    node.sizeInfo,
  );

  // 疑似クラスの差分クラスを生成
  const pseudoClassMap = new Map<PseudoClass, string[]>();
  if (node.pseudoStyles && !SVG_ELEMENTS.has(node.tagName)) {
    for (const pc of PSEUDO_CLASS_LIST) {
      const pseudoStyle = node.pseudoStyles[pc];
      if (!pseudoStyle) continue;

      const { classes: pseudoClasses } = mapStylesToTailwind(
        pseudoStyle as NormalizedStyles,
        node.tagName,
      );
      if (pseudoClasses.length > 0) {
        pseudoClassMap.set(
          pc,
          pseudoClasses.map((cls) => `${pc}:${cls}`),
        );
      }
    }
  }

  const classList = interleaveWithPseudo(baseClasses, pseudoClassMap);

  return {
    type: 'element',
    tagName: node.tagName,
    attributes: node.attributes,
    classList,
    style: inlineStyles,
    children: node.children.map(convertChild),
  };
}
