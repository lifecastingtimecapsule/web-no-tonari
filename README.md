# SITEVEIL

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

## Cloudflareでの配信（2026-11-08〜）

サイト本体は `https://web-no-tonari.amaretto.workers.dev/` でも配信する（Cloudflare Workersの静的アセット）。mainへ反映すると `.github/workflows/deploy-cloudflare-site.yml` が `SITE_URL`・`BASE_PATH=/` でビルドし、`deploy/site/wrangler.toml` の設定で公開する。セキュリティヘッダーは `public/_headers` で付与する（GitHub Pagesでは使われない）。

- CSPで `'unsafe-inline'` を使わないため、`astro.config.mjs` でスクリプト・CSSのインライン化を止めている。インラインの `<script>`・`<style>`・`style` 属性を追加しないこと。
- 外部へ接続先を増やす場合（APIやフォント等）は、`public/_headers` のCSPにも追加する。
- 独自ドメインへ移るときは、ワークフローの `SITE_URL`、安全チェックの `ALLOWED_ORIGINS`、CSPを更新する。
- GitHub Pages版（`/web-no-tonari/`）は移行確認が済むまで併存させる。


## SITEVEILへの名称変更（2026-11-10）
変更履歴：Web制作・保守・セキュリティを一つのブランドへ統合。独自のアウトラインロゴと/security/の案内を追加。ドメイン未購入のため配信URLは従来のまま。受付メール未接続の表示も維持。詳細はdocs/design/2026-11-10-siteveil-brand.md。

## 独自ドメインと問い合わせメール（2026-11-11）
変更履歴：ユーザーがsite-veil.comを取得したため、Cloudflare版の正規ドメインとして接続。問い合わせ先はinfo@site-veil.com、ライフキャスティングの既存Gmailへ受信転送する。フォームは相談文の作成・コピーとメールアプリへの引き継ぎで、直接送信APIではない。詳細はdocs/design/2026-11-11-site-veil-domain-email.md。

## 2026-11-11 問い合わせとトップの更新
変更履歴：ナビとヒーローを正式トップへ統一。ロゴから/#after-heroへ戻る。問い合わせはResend経由の直接送信に変更し、従来のコピー案内を廃止。RESEND_API_KEYはCloudflareのWorker Secretにのみ登録。送信元contact@site-veil.com、送信先info@site-veil.com（siteveiljapna@gmail.comへ転送）。詳細はdocs/design/2026-11-11-simple-site-contact.md。
