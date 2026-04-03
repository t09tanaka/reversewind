---
description: Chrome拡張開発時のルール
globs: ["src/**/*.ts", "manifest.json"]
---

# Chrome Extension 開発ルール

## Manifest V3

- Service Workerはバックグラウンドで動作し、DOM APIにアクセスできない
- Content ScriptはページのDOMにアクセスできるが、Chrome APIは制限される
- Service Worker ↔ Content Script間の通信は `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` を使用する

## セキュリティ

- `eval()` や `new Function()` を使用しない
- ユーザーデータを外部に送信しない
- 元ページのDOMを変更しない（トースト表示用のShadow DOMは許可）
- onclick等のイベント属性を出力HTMLに含めない

## Content Script

- `contextmenu` イベントで対象要素を保持する際、WeakRefやnull許容で参照を管理する
- getComputedStyle()の結果は読み取り専用。必要な値だけを抽出してオブジェクトにコピーする
