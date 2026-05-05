# Journal — プライベートジャーナルアプリケーション

このリポジトリは、Cloudflare Workers（Hono）と htmx によるサーバーレンダリング型のプライベート・ジャーナル（メモ）アプリケーションです。Markdown を本文の一次ソースとし、メタデータは D1 に格納します。AI は補助的な候補メタデータ（要約・タグ）を非同期生成し、人が承認したもののみが正規データになります。

本 README は GitHub での公開を前提に、開発者向けセットアップ、設計上の重要事項、運用時の注意点を簡潔にまとめたものです。

## 主要な特徴

- プライベート用途を想定したシンプルなジャーナル
- エントリは複数/日を想定（UUIDv7 を利用）
- Markdown 本文は R2 に保存（R2 が本文のソース）
- メタデータ（タイトル / 日付 / タグ / 要約 等）は D1 に保存
- AI による要約・タグ提案はキュー経由で非同期実行（候補は人が承認）
- UI はサーバーサイドレンダリング + htmx で部分更新
- エクスポートは YAML フロントマター付き Markdown（ポータビリティ重視）

## ローカル開発（要点）

前提ツール
- Node.js（推奨: 最新の LTS）
- npm
- Wrangler（Cloudflare Workers 開発用）

セットアップ

1. リポジトリをクローン
2. 依存関係をインストール

```bash
npm install
```

開発サーバー

```bash
npm run dev
```

利用可能なスクリプト（package.json より）
- dev: 開発モード（wrangler、tailwind、CodeMirror エディタ bundle の並列起動）
- dev:editor: CodeMirror エディタ用クライアントスクリプトの watch build
- dev:assets: CSS / editor bundle の hash 付き public アセットと manifest を watch 生成
- build:css: Tailwind を使った CSS ビルド
- build:editor: CodeMirror エディタ用クライアントスクリプトの bundle
- assets:clobber: hash 付き public アセットを削除
- build:assets: hash 付き public アセットと manifest を生成
- deploy: CSS / エディタ script / assets manifest をビルドしてから wrangler deploy
- check: TypeScript 型チェック
- lint / format: biome を用いた静的検査と整形
- test / test:watch / test:coverage: vitest を用いたテスト
- generate:prompts: `prompts/*.txt` から AI プロンプト定義を生成

環境変数とバインディング
- wrangler.jsonc に Workers, D1, R2, AI, Queue のバインディングが定義されています。
- ローカル開発では適切な環境（wrangler secrets / .devvars 等）を用意してください。

## データモデル（概要）

主なテーブル（D1）
- entries: id, journal_date, title, status, body_key, summary, ai_summary, ai_summary_model, ai_summary_generated_at, created_at, updated_at, deleted_at
- tags: 正規化された承認タグ
- entry_tags: entries ⇄ tags の junction
- entry_ai_tag_candidates: AI 候補タグ（採用前の提案を保持）
- api_tokens: プログラム用 API トークン（hash のみ保存）

詳細は docs/ と migrations/0001_init.sql を参照してください。

## 認証メモ

- ブラウザ UI は Cloudflare Access を前提にしています。
- プログラム利用向けには、アバターメニュー内の `APIトークン管理` からユーザー単位の API トークンを発行・削除できます。
- API トークンの平文は作成直後に一度だけ表示され、DB には hash のみ保存されます。
- `/api/*` は `Authorization: Bearer <token>` で認証します。
- API の詳細は [docs/api.md](./docs/api.md) を参照してください。

## AI ワークフロー

- 保存時に本文の処理は必須ではなく、保存後にキューへメッセージを発行して非同期で AI 処理を行います。
- AI 要約は Workers AI の要約モデルを使い、生成日時・モデル名を記録します。
- UI では AI 候補は承認操作を通じて明示的に採用/破棄できるようにします。
- AI プロンプトは `prompts/*.txt` に置き、`npm run generate:prompts` で生成物へ反映します。

## エクスポート

- エントリは YAML フロントマター付き Markdown ファイルへエクスポート可能です（YYYY/MM/DD/... 構成を推奨）。
- エクスポート時に未承認の AI タグは別フィールド（例: ai_tag_candidates）として出力してください。

## テストと CI

- ユニットテスト / 結合テストには vitest を使用します。
- lint/format チェックは biome ベースで行います。
- 重要な変更はテストを追加してからマージしてください。
- GitHub Actions の CI は `.github/workflows/ci.yml` で `build:css`, `build:editor`, `build:assets`, `check`, `lint`, `test` を実行します。

## 貢献ガイドライン

- 設計上のルールやデータの扱い（AGENTS.md）を尊重すること
- 変更は小さく、レビューしやすく保つこと
- AI 出力は候補扱いとし、ユーザーの承認フローを破壊しないこと

## ライセンス

特に指定がない場合はリポジトリに同梱の LICENSE を参照してください。

---

参考ファイル
- AGENTS.md（アーキテクチャ規約）
- docs/（開発計画・実装方針）
- migrations/0001_init.sql（初期スキーマ）
