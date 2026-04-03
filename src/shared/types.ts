/** 抽出済みDOMノード */
export type ExtractedNode = {
  tagName: string;
  attributes: Record<string, string>;
  textContent?: string;
  children: ExtractedNode[];
  styles: NormalizedStyles;
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
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
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
  fallback?: Record<string, string>;
};

/** 出力用ノード */
export type OutputNode = {
  tagName: string;
  attributes: Record<string, string>;
  classList: string[];
  style: Record<string, string>;
  children: OutputNode[];
  textContent?: string;
};

/** メッセージ型 */
export type ReversewindMessage = {
  type: 'REVERSEWIND_CONVERT';
};

export type ReversewindResponse = {
  success: boolean;
  error?: string;
};
