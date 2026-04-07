# Reversewind

Web ページの要素を右クリックして HTML + Tailwind CSS コードとしてコピーする Chrome 拡張。

## プロジェクト構成

```
reversewind/
  manifest.json          # Chrome Extension Manifest V3
  src/
    background/          # Service Worker（コンテキストメニュー管理）
    content/             # Content Script（DOM解析・変換パイプライン）
    shared/              # 共有型定義・定数
  dist/                  # ビルド出力（gitignore対象）
  preview/               # コンポーネントプレビュー用（gitignore対象）
  tests/                 # テスト
  docs/                  # 仕様書
```

## 技術スタック

- TypeScript (strict mode)
- Chrome Extension Manifest V3
- Webpack (バンドラ)
- Vitest (テスト)
- ESLint + Prettier (コード品質)

## ビルド・開発

```bash
npm install          # 依存インストール
npm run build        # プロダクションビルド → dist/
npm run dev          # 開発ウォッチモード
npm run lint         # ESLint実行
npm run lint:fix     # ESLint自動修正
npm run format       # Prettier実行
npm run format:check # Prettierチェック
npm run test         # Vitestテスト実行
npm run typecheck    # TypeScript型チェック
npm run preview      # プレビューサーバー起動（localhost:3333）
```

## コンポーネントプレビュー

コピーしたHTML+Tailwindコードの見た目を確認するためのプレビュー環境。

1. `preview/index.html` の `<body>` 内にコピーしたHTMLを貼り付ける
2. `npm run preview` でローカルサーバーを起動（http://localhost:3333）
3. ブラウザで確認

- `preview/` ディレクトリは `.gitignore` 対象のため、自由に編集可能
- Tailwind CSS CDN を読み込み済みなので、Tailwindクラスがそのまま動作する

## コーディング規約

- Tailwind のマッピングロジックは `tailwind-mapper.ts` に集約する
- DOM操作は `dom-extractor.ts` に集約する
- 元ページのDOMを変更してはならない
- `style=""` フォールバックは最終手段。Tailwind化できるものは必ずTailwindに寄せる
- 安全属性リスト（href, src, alt, aria-* 等）以外の属性は出力しない
- サブツリー上限300要素を超えた場合はエラーとする

## 仕様書

詳細仕様は `docs/SPEC.md` を参照。
