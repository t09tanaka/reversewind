# Reversewind 仕様書 v0.1

## 1. 概要

**Reversewind** は、任意の Web ページ上の要素を右クリックし、対象要素の見た目を解析して、**HTML + Tailwind CSS** 形式のコードとしてクリップボードにコピーする Chrome 拡張である。

本仕様は、以下の到達点を対象とする。

* 単一要素だけでなく、**子要素を含むサブツリーの再帰変換**
* `flex` / `grid` / spacing / color / typography / border / radius / shadow / positioning 等の主要スタイル変換
* Tailwind へ変換できない値については **arbitrary values** を優先使用
* なお変換不能なスタイルは **inline style へフォールバック** する

本仕様は、以前定義した「レベル2」までを対象とし、疑似要素、疑似クラス、レスポンシブ、メディアクエリ、CSS変数の完全再現は対象外とする。

---

## 2. 目的

本拡張の目的は、既存 UI の一部を観察し、実装の叩き台として再利用可能なコードを素早く得ることにある。

主な利用想定は以下。

* 既存ページの UI 部品を Tailwind ベースで再現したい
* デザイン確認用のスニペットを素早く取得したい
* DOM/CSS を人手で読み解く手間を減らしたい

本拡張は**完全な逆コンパイラ**ではなく、**再利用可能な近似コードの自動生成ツール**として位置付ける。

---

## 3. スコープ

## 3.1 対象範囲

本バージョンで対象とする機能は以下。

1. Chrome 右クリックメニューに **「Copy as Tailwind」** を追加する
2. 右クリックされた要素を特定する
3. 対象要素とその子要素を走査する
4. 各要素の computed style を取得する
5. Tailwind class に変換可能なプロパティを class 化する
6. class 化できないスタイルを inline style として残す
7. 生成した HTML スニペットをクリップボードへコピーする
8. 成功/失敗をページ上で通知する

## 3.2 対象外

以下は本バージョンでは対象外。

* `:hover`, `:focus`, `:active`, `:disabled` などの状態変化の再現
* `::before`, `::after`, `::marker` などの疑似要素
* media query / breakpoint ごとの出力
* Tailwind コンポーネントへの意味的リファクタリング
* CSS animation / transition の再現
* transform の高度な分解
* CSS variables の完全解決
* 外部フォントの自動 import
* Shadow DOM 内部の完全サポート
* クロスオリジン iframe 内要素の取得
* React JSX / Vue / Svelte 形式への変換
* ストア公開に必要な課金・分析・設定同期

---

## 4. 想定ユーザー

* Web エンジニア
* Tailwind 利用者
* UI 実装の試作を高速化したい人
* デザインをコード側から観察したい人

---

## 5. 用語定義

**対象要素**
ユーザーが右クリックした時点でカーソル直下に存在した DOM 要素。

**サブツリー**
対象要素を root とし、その子孫要素すべてを含む DOM 部分木。

**computed style**
`window.getComputedStyle(element)` により取得できる最終適用後スタイル。

**Tailwind class 化**
computed style の値を Tailwind utility class に変換すること。

**フォールバック style**
Tailwind utility に落とし込めないスタイルを `style=""` 属性で残すこと。

---

## 6. 成果物

本拡張の主要成果物は、クリップボードにコピーされる以下形式の文字列である。

```html
<div class="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-md" style="backdrop-filter: blur(10px);">
  <span class="text-sm font-medium text-gray-900">Example</span>
</div>
```

出力は原則として **プレーン HTML** とする。
コードブロック形式や JSON 形式ではなく、直接貼り付け可能なマークアップ文字列を返す。

---

## 7. 利用フロー

1. ユーザーが Web ページ上の任意要素を右クリックする
2. コンテキストメニューに **Copy as Tailwind** を表示する
3. ユーザーがメニューをクリックする
4. 拡張は直前に右クリックされた要素を取得する
5. 対象要素とその子要素を解析する
6. HTML + Tailwind class + fallback style を生成する
7. 生成結果をクリップボードへコピーする
8. ページ上にトーストで成功/失敗を表示する

---

## 8. 機能要件

## 8.1 右クリック対象取得

### FR-001

content script は `contextmenu` イベントを監視し、最新の対象要素参照を保持しなければならない。

### FR-002

保持対象は `event.target` を基準とする。
テキストノードが対象の場合、親要素へ正規化しなければならない。

### FR-003

拡張メニュー実行時、最新の対象要素が存在しない場合はエラーとする。

---

## 8.2 コンテキストメニュー

### FR-004

拡張は Chrome のコンテキストメニューへ **Copy as Tailwind** を登録しなければならない。

### FR-005

メニュー押下時、対象タブの content script へ変換要求を送信しなければならない。

---

## 8.3 DOM 抽出

### FR-006

対象要素の tag 名、子要素構造、テキストノードを保持しなければならない。

### FR-007

サブツリーを深さ優先または幅優先で再帰走査しなければならない。

### FR-008

以下の属性は原則除去しなければならない。

* 元の `class`
* 元の `style`
* JavaScript イベント属性 (`onclick` 等)
* ページ固有で再利用性の低い tracking 系属性

### FR-009

以下の安全属性は保持対象とする。

* `href`
* `src`
* `alt`
* `title`
* `role`
* `type`
* `name`
* `value`
* `placeholder`
* `aria-*`
* `target`
* `rel`

### FR-010

`id` は原則として出力しない。
ただし将来的にオプションで保持可能な設計にしてよい。

---

## 8.4 スタイル抽出

### FR-011

各要素について `getComputedStyle()` を取得しなければならない。

### FR-012

最低限以下のプロパティ群を解析対象とする。

### レイアウト

* `display`
* `position`
* `top`
* `right`
* `bottom`
* `left`
* `z-index`
* `overflow`
* `box-sizing`

### サイズ

* `width`
* `height`
* `min-width`
* `min-height`
* `max-width`
* `max-height`

### 余白

* `margin-*`
* `padding-*`
* `gap`
* `row-gap`
* `column-gap`

### Flex / Grid

* `flex-direction`
* `flex-wrap`
* `justify-content`
* `align-items`
* `align-content`
* `align-self`
* `flex-grow`
* `flex-shrink`
* `grid-template-columns`
* `grid-template-rows`
* `grid-column`
* `grid-row`

### 背景 / 境界

* `background-color`
* `background-image`（単純な線形 gradient は対象外でも可）
* `border-*`
* `border-radius`
* `opacity`
* `box-shadow`

### テキスト

* `color`
* `font-size`
* `font-weight`
* `font-family`
* `line-height`
* `letter-spacing`
* `text-align`
* `text-transform`
* `text-decoration`
* `white-space`

---

## 8.5 Tailwind 変換

### FR-013

変換器は style プロパティごとに Tailwind class を生成しなければならない。

### FR-014

既存 Tailwind スケールへ素直に落ちる値は、**標準 utility** を優先しなければならない。

例:

* `display: flex` → `flex`
* `padding-left/right: 16px` → `px-4`
* `font-weight: 500` → `font-medium`

### FR-015

既存 Tailwind スケールに一致しないが utility 化可能な値は、**arbitrary values** を使用しなければならない。

例:

* `border-radius: 10px` → `rounded-[10px]`
* `width: 123px` → `w-[123px]`
* `color: rgb(31,41,55)` → `text-[#1f2937]`

### FR-016

Tailwind で表現しづらい、または変換器で未対応のプロパティは `style=""` に残さなければならない。

例:

* `backdrop-filter`
* 複雑な `filter`
* 一部の `background-image`

### FR-017

同じ意味の class が重複する場合は後勝ちにせず、**1つに正規化**しなければならない。

---

## 8.6 HTML 出力

### FR-018

出力 HTML は対象サブツリーの構造を可能な限り維持しなければならない。

### FR-019

各要素には以下を出力する。

* タグ名
* Tailwind class
* fallback style
* 安全属性
* テキストノード

### FR-020

class が空、style が空の場合は属性を出力しない。

### FR-021

不要な改行や空白を避け、可読性のあるインデント付き HTML としなければならない。

---

## 8.7 クリップボードコピー

### FR-022

変換成功時、HTML 文字列をクリップボードへコピーしなければならない。

### FR-023

コピー後はページ上に success 通知を表示しなければならない。

### FR-024

失敗時は error 通知を表示し、失敗理由をログに残さなければならない。

---

## 9. 変換ポリシー

## 9.1 基本方針

Reversewind は **完全一致より実用性を優先**する。
そのため、出力ポリシーは以下順で評価する。

1. Tailwind 標準 utility
2. Tailwind arbitrary values
3. inline style fallback

これにより、見た目の再現率とコード再利用性のバランスを取る。

---

## 9.2 Tailwind class への代表マッピング

### Display

* `block` → `block`
* `inline-block` → `inline-block`
* `inline` → `inline`
* `flex` → `flex`
* `inline-flex` → `inline-flex`
* `grid` → `grid`
* `none` → `hidden`

### Position

* `static` → `static`
* `relative` → `relative`
* `absolute` → `absolute`
* `fixed` → `fixed`
* `sticky` → `sticky`

### Spacing

* 4px → `1`
* 8px → `2`
* 12px → `3`
* 16px → `4`
* 20px → `5`
* 24px → `6`
* 不一致値 → `[npx]`

### Border Radius

* 4px → `rounded`
* 6px → `rounded-md`
* 8px → `rounded-lg`
* 12px → `rounded-xl`
* 16px → `rounded-2xl`
* その他 → `rounded-[npx]`

### Font Size

* 12px → `text-xs`
* 14px → `text-sm`
* 16px → `text-base`
* 18px → `text-lg`
* 20px → `text-xl`
* その他 → `text-[npx]`

### Font Weight

* 400 → `font-normal`
* 500 → `font-medium`
* 600 → `font-semibold`
* 700 → `font-bold`

### Text Align

* `left` → `text-left`
* `center` → `text-center`
* `right` → `text-right`

### Shadow

既知パターンに近いものは `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg` 等へ寄せる。
一致しないものは `shadow-[...]` または inline style とする。

---

## 9.3 色変換

色は以下の優先順で処理する。

1. Tailwind デフォルトカラーに近似一致する場合はその class を利用
2. 一致しない場合は hex 化して arbitrary value を利用
3. alpha を含む複雑値は `rgba(...)` または hex8 で arbitrary value
4. 不可なら inline style

例:

* `#ffffff` → `bg-white`
* `rgb(17, 24, 39)` → `text-gray-900` または `text-[#111827]`
* `rgba(255,255,255,0.7)` → `bg-[rgba(255,255,255,0.7)]`

初期実装では**厳密な Tailwind カラーネーム寄せは必須ではない**。
実装コストを考え、まずは `[#hex]` 出力中心でよい。

---

## 9.4 Width / Height

* Tailwind 既定値に一致する場合のみ既定 utility を使用してよい
* それ以外は `w-[npx]`, `h-[npx]` を用いる
* `auto` は省略可能
* `100%` は `w-full`, `h-full`
* `100vw`, `100vh` は `w-screen`, `h-screen`

---

## 9.5 Flex / Grid

### Flex

* `display:flex` → `flex`
* `flex-direction: row` → 省略可
* `flex-direction: column` → `flex-col`
* `justify-content` → `justify-*`
* `align-items` → `items-*`
* `flex-wrap: wrap` → `flex-wrap`
* `gap` → `gap-*` または `gap-[npx]`

### Grid

* `display:grid` → `grid`
* `grid-template-columns: repeat(2, minmax(0, 1fr))` → `grid-cols-2`
* 既知パターン以外 → `grid-cols-[...]`
* `grid-column`, `grid-row` は対応可能範囲のみ class 化し、複雑値は fallback

---

## 10. フォールバック仕様

変換不能スタイルは、要素単位で `style=""` に残す。

例:

```html
<div class="rounded-xl bg-white p-4" style="backdrop-filter: blur(12px);">
```

フォールバックは**最後の逃げ道**であり、style 属性に詰め込みすぎないこと。
Tailwind 化できるものは必ず Tailwind に寄せる。

---

## 11. 非機能要件

## 11.1 パフォーマンス

* 通常的な UI コンポーネント規模では 1 秒以内のコピー完了を目標とする
* 推奨サブツリー上限は **300 要素** とする
* 300 要素を超える場合はエラーまたは縮退動作とする

縮退案:

* 「対象が大きすぎます」と通知して中止する

---

## 11.2 安全性

* 元ページの DOM を変更してはならない
* 送信型通信は行わない
* 解析結果はローカル処理のみとする
* ページ内 script 実行につながる属性を出力してはならない

---

## 11.3 可観測性

開発時は以下ログを保持する。

* 対象要素 tag
* 解析要素数
* 生成 class 数
* fallback style 数
* 失敗理由

本番では verbose logging は無効化する。

---

## 12. エラー処理

以下の場合は失敗とする。

### ER-001

対象要素が取得できない

### ER-002

content script との通信に失敗

### ER-003

クリップボード書き込み失敗

### ER-004

解析対象要素数が上限を超過

### ER-005

対象がクロスオリジン iframe 内でアクセス不可

失敗時はトーストで簡潔に通知する。

例:

* `Reversewind: target not found`
* `Reversewind: copy failed`
* `Reversewind: subtree too large`

---

## 13. 拡張構成

## 13.1 主要ファイル

```text
reversewind/
  manifest.json
  src/
    background/
      service-worker.ts
    content/
      content-script.ts
      selection-store.ts
      dom-extractor.ts
      style-extractor.ts
      tailwind-mapper.ts
      html-generator.ts
      clipboard.ts
      toast.ts
    shared/
      types.ts
      constants.ts
```

---

## 13.2 各モジュール責務

### service-worker

* context menu 登録
* content script へのメッセージ送信

### content-script

* 右クリック対象要素の保持
* 変換パイプライン起動
* ページ上トースト表示

### dom-extractor

* 対象 DOM サブツリー抽出
* 安全属性の保持
* 不要属性の除去

### style-extractor

* computed style 取得
* 正規化済み style object 生成

### tailwind-mapper

* style object を Tailwind class 配列へ変換
* fallback style 生成

### html-generator

* 出力 HTML 文字列組み立て
* 整形インデント付与

### clipboard

* 文字列コピー処理

---

## 14. データ構造

## 14.1 抽出ノード

```ts
type ExtractedNode = {
  tagName: string
  attributes: Record<string, string>
  textContent?: string
  children: ExtractedNode[]
  styles: NormalizedStyles
}
```

## 14.2 正規化スタイル

```ts
type NormalizedStyles = {
  display?: string
  position?: string
  width?: string
  height?: string
  margin?: { top?: string; right?: string; bottom?: string; left?: string }
  padding?: { top?: string; right?: string; bottom?: string; left?: string }
  color?: string
  backgroundColor?: string
  borderRadius?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  textAlign?: string
  boxShadow?: string
  gap?: string
  justifyContent?: string
  alignItems?: string
  gridTemplateColumns?: string
  fallback?: Record<string, string>
}
```

## 14.3 出力ノード

```ts
type OutputNode = {
  tagName: string
  attributes: Record<string, string>
  classList: string[]
  style: Record<string, string>
  children: OutputNode[]
  textContent?: string
}
```

---

## 15. UI仕様

本バージョンでは popup UI は必須としない。
ユーザー接点は以下のみ。

* 右クリックメニュー
* コピー成功/失敗トースト

### トースト文言案

成功:

* `Reversewind: copied as Tailwind`

失敗:

* `Reversewind: target not found`
* `Reversewind: copy failed`
* `Reversewind: subtree too large`

---

## 16. Manifest 要件

* Manifest Version 3
* `contextMenus`
* `activeTab`
* `scripting`
* 必要に応じて `clipboardWrite`
* `host_permissions: ["<all_urls>"]`

content script は対象ページに注入される。

---

## 17. 受け入れ条件

以下を満たした場合、本バージョンは完成とみなす。

### AC-001

ページ上のボタン要素を右クリックし、Tailwind class 付き HTML がコピーされる

### AC-002

子要素を複数含むカード UI を右クリックし、テキスト・階層を維持した HTML がコピーされる

### AC-003

`flex`, `gap`, `padding`, `radius`, `font-size`, `font-weight`, `color`, `shadow` が Tailwind に変換される

### AC-004

変換不能プロパティが `style=""` として残る

### AC-005

元ページの class や inline style がそのまま出力されない

### AC-006

対象が大規模すぎる場合に失敗通知される

---

## 18. 既知の制約

* 完全一致は保証しない
* CSS cascade の意味を再構成するものではない
* 擬似状態は失われる
* 見た目再現率は DOM 構造とプロパティ対応範囲に依存する
* フォントや画像 URL は元ページ依存になる
* grid の複雑なテンプレートは荒くなる可能性が高い

---

## 19. 今後の拡張候補

この仕様には含めないが、将来的な拡張余地は以下。

* JSX 出力
* React コンポーネント化
* `hover:` `focus:` 変換
* breakpoint 推定
* `before` `after` 対応
* カラーを Tailwind ネームへ高精度近似
* 「可読性優先 / 再現性優先」モード切替
* 要素選択オーバーレイ UI

---

## 20. 実装優先順位

### P0

* 右クリック対象取得
* context menu
* 単一要素 + 子要素抽出
* HTML 出力
* クリップボードコピー
* success/error トースト

### P1

* spacing / flex / color / typography / border / radius / shadow 対応
* arbitrary values
* fallback style

### P2

* grid 対応強化
* 属性サニタイズ改善
* 出力整形改善
* 上限要素数の制御
