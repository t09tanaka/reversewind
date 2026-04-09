# Changelog

## [0.3.1] - 2026-04-09

### Added
- author が書いた CSS プロパティを CSSOM から復元する authored longhand detection
- `col-span-*` / `row-span-*` / `col-start-*` / `col-end-*` の grid item マッピング（負 line は `col-end-[-1]` 形式）
- `mx-auto` / `my-auto` / `ml-auto` 等の margin-auto マッピング
- 負マージン対応（`-ml-2`、`-mx-3`、`-ml-[5px]`）と `parsePx` の負値パース
- 要素サイズに基づく `rounded-full` ヒューリスティクス判定（`border-radius >= min(width, height) / 2`）
- `aspect-ratio` 抽出とマッピング（`aspect-square` / `aspect-video` / `aspect-[4/5]`）
- grid コンテナに対する `align-items` / `justify-content` マッピング
- `font-style: italic` → `italic` 抽出
- viewport 単位（`100vh`, `100vw`, `100svh`, `100dvh` 等）の保持 → `h-screen` 等
- unitless `line-height`（1.1, 1.625 等）の保持と `leading-relaxed` 等の名前付きマッピング
- `max-w-*` の rem スケールマッピング（672px → `max-w-2xl` 等）
- `letter-spacing` の em ベース比率マッピング（`tracking-tight`, `tracking-wider` 等）
- `width` / `min-width` / `max-width` の個別 authored 検出（redundant な `w-[Npx]` 出力を抑制）
- logical longhand（`inset-inline-*`, `margin-block-*`, `inline-size` 等）の writingMode/direction 対応マッピング

### Fixed
- `mx-[640px]`: author が `mx-auto` で中央寄せした要素に computed の固定 margin が literal 出力される問題
- `right-[235.766px]`: authored していない offset が computed 値として出力される問題
- `w-[580px] h-[800px]`: `w-full h-full` で指定された画像が computed の固定サイズに化ける問題
- `col-end--1`: 負 grid line から生成される無効 Tailwind クラス
- `@supports` / `@container` 条件付きルールが常に authored 扱いされる問題

### Changed
- CSSOM 走査ロジックを `css-rule-collector.ts` に集約（size-detector から抽出）

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
