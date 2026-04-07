# Chrome Extension Release

Chrome拡張のリリース準備スキル。品質チェック、バージョン更新、CHANGELOG生成、GitHub Release作成、Chrome Web Store用zipの作成までを一気に行う。

## トリガー

「リリースして」「リリース準備して」「バージョン上げて」「v0.4.0にしたい」「新しいバージョンを出したい」

## ワークフロー

### Step 1: 品質チェック

以下を順に実行し、すべて成功することを確認する。失敗したらその場で停止してユーザーに報告。

```bash
npm run build
npm run typecheck
npm run lint
npm run test
```

### Step 2: バージョンの決定

前回のリリースタグ以降のコミット履歴を分析し、semver に基づいてバージョンを提案する。

```bash
git describe --tags --abbrev=0   # 直近のタグ
git log <last-tag>..HEAD --oneline  # 変更履歴
```

提案フォーマット:
```
現在のバージョン: 0.3.0
前回リリース以降の主な変更:
- feat: ○○機能を追加
- fix: △△のバグを修正

提案バージョン: 0.4.0（新機能追加のため minor）
このバージョンで進めてよいですか？
```

ユーザーが別のバージョンを指定した場合はそちらを使う。確認を得てから次へ。

### Step 3: バージョン更新

以下の **2ファイル** のバージョンを更新する（`npm version` は使わない）:

1. `package.json` の `"version"` フィールド
2. `manifest.json` の `"version"` フィールド

### Step 4: CHANGELOG.md 更新

コミット履歴から [Keep a Changelog](https://keepachangelog.com/) 形式でエントリを生成し、CHANGELOG.md の先頭に追加する。既存ファイルがなければ新規作成。

カテゴリ: Added / Fixed / Changed / Removed

言語はプロジェクトに合わせる（このプロジェクトは日本語）。

### Step 5: コミット・タグ・プッシュ

```bash
git add package.json manifest.json CHANGELOG.md
git commit -m "chore: release v<VERSION>"
git tag v<VERSION>
git push origin main --tags
```

### Step 6: GitHub Release

コミット履歴からリリースノートを英語で作成し、`gh release create` で公開する。

```bash
gh release create v<VERSION> --title "v<VERSION>" --notes "<release notes>"
```

### Step 7: Chrome Web Store 用 zip

dist/ ディレクトリをzip化する。ファイル名は `reversewind-v<VERSION>.zip`。

```bash
cd dist && zip -r ../reversewind-v<VERSION>.zip .
```

### Step 8: 完了報告

```
リリース完了！

- バージョン: 0.3.0 → 0.4.0
- CHANGELOG: 更新済み
- GitHub Release: <URL>
- Chrome Web Store 用 zip: reversewind-v0.4.0.zip (<SIZE>)
```

## 注意事項

- working directory がクリーンでない場合は先にユーザーに確認する
- 同じバージョンのタグが既に存在する場合はエラーとして報告する
- `npm version` コマンドは使わない（git tag を自動作成してしまうため）
- zip は .gitignore 対象（*.zip）なのでコミットに含まれない
