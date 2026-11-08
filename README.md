# ウェブのとなり

ウェブ保守、リニューアル、AI活用、セキュリティ確認を案内する静的サイトです。

## 確認方法

```bash
npm install
npm run dev
```

GitHub Pages は `main` ブランチへの更新を自動公開します。

## SEO確認の接続

変更履歴: 2026-11-08 サービス4ページとSEO専用ページを追加したため、外部接続の条件を記録。

`/check/`（かんたん安全チェック）は、Cloudflare Worker `workers/safety-check` を呼び出します。確認するのは入力サイトのトップページ1件の応答（HTTPS・転送・セキュリティヘッダー・バージョン表示・http://の読み込み）と、ドメインの公開DNS（SPF・DMARC）だけです。攻撃や探索にあたる通信は行いません。

公開手順:
1. Cloudflareで「Workersの編集」権限のAPIトークンを作り、GitHubリポジトリのSecretsに `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を登録する。mainへ反映すると `.github/workflows/deploy-safety-check.yml` がWorkerを公開する（手元から公開する場合は `cd workers/safety-check && npx wrangler deploy`）。
2. 公開中のWorkerは `https://web-no-tonari-safety-check.amaretto.workers.dev`。`src/pages/check.astro` の既定値になっており、別のURLへ切り替える場合だけGitHubリポジトリ変数 `PUBLIC_SAFETY_CHECK_API` で上書きする。
3. 独自ドメインへ移ったら、`workers/safety-check/wrangler.toml` の `ALLOWED_ORIGINS` に新しいオリジンを追加する。

目的別ガイドは一般的な案内で、顧客サイトの内容を読み取ったAI診断ではありません。問い合わせの送信先は、メール新設後に接続します。
