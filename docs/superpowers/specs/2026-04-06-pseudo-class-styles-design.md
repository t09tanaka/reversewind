# 疑似クラススタイルのコピー対応

## 概要

右クリックでコピーする際、`:hover`, `:active`, `:focus`, `:focus-visible`, `:focus-within` の疑似クラススタイルも差分として検出し、Tailwind の `hover:`, `active:`, `focus:`, `focus-visible:`, `focus-within:` プレフィックス付きクラスとして出力する。

## 対応する疑似クラス

| CSS疑似クラス     | Tailwindプレフィックス |
| ----------------- | ---------------------- |
| `:hover`          | `hover:`               |
| `:active`         | `active:`              |
| `:focus`          | `focus:`               |
| `:focus-visible`  | `focus-visible:`       |
| `:focus-within`   | `focus-within:`        |

## アーキテクチャ

### 変更ファイル

1. **`src/shared/types.ts`** — `PseudoClass` 型と `ExtractedNode.pseudoStyles` フィールドを追加
2. **`src/content/style-extractor.ts`** — CSSOMルール走査で疑似クラススタイルを抽出する関数を追加
3. **`src/content/dom-extractor.ts`** — 抽出時に疑似クラススタイルも収集
4. **`src/content/tailwind-mapper.ts`** — 疑似クラス差分をプレフィックス付きクラスに変換、プロパティグループ単位でソート
5. **テスト** — 疑似クラス関連のテストを追加

新規ファイルは作成しない。

### データフロー

```
要素を右クリック
  ↓
extractSubtree() で通常スタイル + 疑似クラススタイルを抽出
  ↓
各疑似クラスについてCSSOMルールを走査:
  - document.styleSheetsの全ルールを確認
  - セレクタが :hover 等を含み、要素にマッチするか判定
  - マッチしたルールのプロパティを収集
  ↓
通常スタイルとの差分を計算（差分のみ保持）
  ↓
tailwind-mapper で差分を hover:bg-blue-500 等のプレフィックス付きクラスに変換
  ↓
クラスをプロパティグループ順にソート（base → hover → active → focus → ...）
  ↓
HTMLに出力
```

## 型定義の変更

```typescript
// shared/types.ts
type PseudoClass = 'hover' | 'active' | 'focus' | 'focus-visible' | 'focus-within';

interface ExtractedNode {
  // 既存フィールド...
  styles: NormalizedStyles;
  pseudoStyles?: Partial<Record<PseudoClass, Partial<NormalizedStyles>>>;
}
```

## CSSOMルール走査（style-extractor.ts）

### アルゴリズム

1. `document.styleSheets` の全 `CSSStyleSheet` をイテレート
2. 各 `CSSStyleRule` のセレクタ文字列から疑似クラス（`:hover` 等）を検出
3. 疑似クラスを除去したベースセレクタで `element.matches()` を実行
4. マッチしたルールのプロパティを `NormalizedStyles` の対応するキーに収集
5. 複数ルールがマッチした場合は後勝ち（カスケーディングの近似）
6. クロスオリジンの `SecurityError` はサイレントスキップ

### セレクタのマッチング

```
.btn:hover           → ベース ".btn" で matches() → 対象要素の :hover スタイル
.btn:hover .icon     → ベース ".btn .icon" で matches() → 対象要素が .icon なら適用
.card:hover .btn     → 対象が .btn の場合 → これは .card の :hover であり .btn 自身の疑似クラスではない → 除外
```

判定ルール: 疑似クラスが付いているセレクタ部分が、ベースセレクタの最後の要素セレクタ（対象要素自身）に付いている場合のみ適用。祖先要素の疑似クラスに依存するルールは除外する。

## Tailwindマッピングの変更

### 変換ロジック

1. `convertToOutput()` で通常スタイルのマッピング後、各疑似クラスの差分スタイルに対して `mapStylesToTailwind()` を呼び出し
2. 結果のクラスにプレフィックスを付与（例: `bg-blue-500` → `hover:bg-blue-500`）
3. fallback inline style にもプレフィックスは不可のため、疑似クラスのfallback styleは出力しない（Tailwind変換可能なもののみ）

### クラスのソート順

同じプロパティグループごとに base → hover → active → focus → focus-visible → focus-within の順で並べる:

```html
<button class="bg-white hover:bg-blue-500 active:bg-blue-700 text-black hover:text-white p-4">
```

実装方法: `mapStylesToTailwind()` の各プロパティマッピングで、baseクラスとpseudoクラスをペアにして順序付きリストに追加する。

## エッジケースと注意点

- **セレクタの複雑さ**: 祖先の疑似クラスに依存するルール（`.card:hover .btn`）は対象要素自身の疑似クラスではないので除外
- **クロスオリジンスタイルシート**: `SecurityError` をキャッチしてサイレントスキップ
- **パフォーマンス**: CSSOM走査はサブツリーの全要素分を1回の走査でまとめて処理し、要素ごとの繰り返し走査を避ける
- **疑似クラスのinline style fallback**: Tailwindプレフィックスはinline styleに適用できないため、疑似クラスのスタイルはTailwindクラスに変換可能なもののみ出力
- **SVG要素**: 既存と同様、SVG要素は疑似クラススタイルの抽出対象外（Tailwind変換をスキップ）
- **継承プロパティ**: 疑似クラスでも通常時と同じ継承フィルタリングを適用
