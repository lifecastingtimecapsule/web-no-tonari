// 変更履歴: 2026-11-04 ローカルプレビュー用の最小Astro構成を追加。
// 変更履歴: 2026-11-08 GitHub PagesのプロジェクトURLで静的アセットを正しく参照するbaseを追加。
// 変更履歴: 2026-11-08 canonical・OGの公開元を全ページで統一するsite設定を追加。
// 変更履歴: 2026-11-08 Cloudflare Workersへ移すため、公開先（SITE_URL・BASE_PATH）を環境変数で切り替え可能にした。既定はGitHub Pages。
// 変更履歴: 2026-11-08 Content-Security-Policyで 'unsafe-inline' を使わずに済むよう、スクリプトとCSSのインライン化を止めた。
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://lifecastingtimecapsule.github.io',
  base: process.env.BASE_PATH || '/web-no-tonari',
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  server: {
    host: '127.0.0.1',
  },
});
