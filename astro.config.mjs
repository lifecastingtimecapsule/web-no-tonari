// 変更履歴: 2026-11-04 ローカルプレビュー用の最小Astro構成を追加。
// 変更履歴: 2026-11-08 GitHub PagesのプロジェクトURLで静的アセットを正しく参照するbaseを追加。
// 変更履歴: 2026-11-08 canonical・OGの公開元を全ページで統一するsite設定を追加。
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://lifecastingtimecapsule.github.io',
  base: '/web-no-tonari',
  server: {
    host: '127.0.0.1',
  },
});
