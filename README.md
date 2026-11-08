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

`/seo-check/` はGoogle PageSpeed Insights APIの実測だけを表示します。キーなし利用は429を確認済みです。安定運用にはGoogle CloudでPageSpeed Insights APIを有効にし、公開元のHTTPリファラー制限・API制限・割当量を設定したキーを、GitHubリポジトリ変数 `PUBLIC_PAGESPEED_API_KEY` に登録して再公開します。この値は配信JavaScriptから見えるため、無制限のキーや他用途の秘密キーを使わないでください。

目的別ガイドは一般的な案内で、顧客サイトの内容を読み取ったAI診断ではありません。問い合わせの送信先は、メール新設後に接続します。
