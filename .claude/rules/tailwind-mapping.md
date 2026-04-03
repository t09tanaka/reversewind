---
description: Tailwind変換ロジックに関するルール
globs: ["src/content/tailwind-mapper.ts", "tests/**/*tailwind*"]
---

# Tailwind マッピングルール

## 変換優先順位

1. Tailwind 標準 utility（例: `px-4`, `font-medium`）
2. Tailwind arbitrary values（例: `rounded-[10px]`, `w-[123px]`）
3. inline style フォールバック（例: `style="backdrop-filter: blur(10px)"`)

## 注意点

- 同じ意味のclassが重複しないよう正規化する
- デフォルト値（display: block等）は省略してよい
- 色変換は初期実装では `[#hex]` 形式でよい。Tailwindカラーネーム寄せは後続対応
- spacing値はTailwindスケール（4px=1, 8px=2, ...）に合致する場合のみ標準utilityを使用
