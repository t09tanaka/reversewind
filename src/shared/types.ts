/** サイズ指定の判定結果 */
export type SizeInfo = {
  widthAuthored: boolean;
  heightAuthored: boolean;
};

/** 対応する疑似クラス */
export type PseudoClass =
  | 'hover'
  | 'active'
  | 'focus'
  | 'focus-visible'
  | 'focus-within';

/** 疑似クラスごとのスタイル差分 */
export type PseudoStyleMap = Partial<
  Record<PseudoClass, Partial<NormalizedStyles>>
>;

/** 抽出済みの子ノード（要素 or テキスト） */
export type ExtractedChild = ExtractedNode | { type: 'text'; content: string };

/** 抽出済みDOMノード */
export type ExtractedNode = {
  type: 'element';
  tagName: string;
  attributes: Record<string, string>;
  children: ExtractedChild[];
  styles: NormalizedStyles;
  parentStyles?: NormalizedStyles;
  sizeInfo: SizeInfo;
  pseudoStyles?: PseudoStyleMap;
};

/** 正規化済みスタイル */
export type NormalizedStyles = {
  display?: string;
  position?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  padding?: { top?: string; right?: string; bottom?: string; left?: string };
  color?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  borderRadius?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderColor?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textTransform?: string;
  textDecoration?: string;
  whiteSpace?: string;
  boxShadow?: string;
  opacity?: string;
  zIndex?: string;
  overflow?: string;
  boxSizing?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  alignSelf?: string;
  flexGrow?: string;
  flexShrink?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;
  aspectRatio?: string;
  scale?: string;
  transform?: string;
  transition?: string;
  cursor?: string;
  fallback?: Record<string, string>;
};

/** 出力用の子ノード */
export type OutputChild = OutputNode | { type: 'text'; content: string };

/** 出力用ノード */
export type OutputNode = {
  type: 'element';
  tagName: string;
  attributes: Record<string, string>;
  classList: string[];
  style: Record<string, string>;
  children: OutputChild[];
};

/** メッセージ型 */
export type ReversewindMessage = {
  type: 'REVERSEWIND_CONVERT';
};

export type ReversewindResponse = {
  success: boolean;
  error?: string;
};
