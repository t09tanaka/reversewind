# Changelog

## [0.3.0] - 2026-04-07

### Added
- ページ全体コピー機能（背景を右クリックで自動判定）
- oklch/oklab色対応（Canvas getImageDataによるhex変換）
- グラデーション背景のTailwindクラス出力（bg-gradient-to-br from-[#hex] to-[#hex]）
- 片側ボーダー対応（border-t/r/b/l）
- 辺ごとのボーダー色対応（border-l-[#color]等）
- グリッド均等分割の正規化（167px 167px → grid-cols-2）
- コンポーネントプレビュー環境（npm run preview）

## [0.2.0] - 2026-04-06

### Added
- CSS scale プロパティ対応
- transform/transition対応
- 疑似クラス（hover/focus等）のスタイル出力
- バブルアップ機能（子要素クリックで親コンポーネントを自動選択）
