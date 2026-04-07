# Copy Page 機能設計

## 概要

ページ全体をHTML + Tailwind CSSとしてコピーする機能。既存の「Copy component」（右クリック要素のコピー）に加え、`<body>` 直下の可視要素全体をコピーする「Copy page」メニューを追加する。

## コンテキストメニュー

| メニュー | 対象 | メッセージ |
|---|---|---|
| `Reversewind: Copy component` | 右クリック要素（既存、タイトル変更） | `REVERSEWIND_CONVERT` |
| `Reversewind: Copy page` | ページ全体 | `REVERSEWIND_CONVERT_PAGE` |

既存メニューの `Reversewind: Copy` は `Reversewind: Copy component` にリネームする。

## 処理フロー

1. Service Worker が `REVERSEWIND_CONVERT_PAGE` メッセージを送信
2. Content Script が受信し、以下を実行:
   a. `<body>` の computed style からベーススタイルを抽出（背景色、テキスト色、フォント等）
   b. `<body>` 直下の可視要素を列挙（`script`, `noscript`, `style` を除外）
   c. 各要素に対して既存の `extractSubtree` を実行
   d. 各サブツリーを `convertToOutput` → `generateHtml` で変換
   e. ベーススタイルのラッパーdivでまとめてクリップボードにコピー

## ベーススタイルのラッパー

`<html>` と `<body>` の computed style から以下を抽出し、ラッパーdivに付与:

- `background-color`（`<body>` から）
- `color`（`<body>` から、`<html>` で設定されたものは継承済み）
- `font-family`（Tailwind標準の `font-sans`/`font-serif`/`font-mono` にマッチする場合のみ出力）

### 出力例

```html
<!-- Reversewind: base styles from html/body -->
<div class="bg-white text-[#0a0a0a] font-sans">
  <!-- body直下の各要素が順に並ぶ -->
  <header>...</header>
  <main>...</main>
  <footer>...</footer>
</div>
```

## 要素数上限

- コンポーネントコピー: 300（既存、変更なし）
- ページ全体コピー: 3000（新規定数 `MAX_PAGE_ELEMENTS`）
- 上限超過時はエラートーストを表示

## 除外要素

`<body>` 直下の以下の要素は除外する:

- `<script>`
- `<noscript>`
- `<style>`
- `display: none` の要素

## 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `src/shared/constants.ts` | `MENU_TITLE` → `MENU_TITLE_COMPONENT` にリネーム、`MENU_ID_PAGE`/`MENU_TITLE_PAGE`/`MAX_PAGE_ELEMENTS` 追加、トーストメッセージ追加 |
| `src/shared/types.ts` | `ReversewindMessage` に `REVERSEWIND_CONVERT_PAGE` タイプ追加 |
| `src/background/service-worker.ts` | 2つのコンテキストメニュー登録、メッセージ振り分け |
| `src/content/content-script.ts` | `REVERSEWIND_CONVERT_PAGE` ハンドラ追加（ベーススタイル抽出 + 全可視要素の変換） |

## テスト

- ベーススタイル抽出ロジックのユニットテスト（ブラウザ依存部分はモック）
- 既存テストが壊れないことの確認
