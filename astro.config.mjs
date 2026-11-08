// 変更履歴: 2026-11-04 ローカルプレビュー用の最小Astro構成を追加。
// 変更履歴: 2026-11-08 GitHub PagesのプロジェクトURLで静的アセットを正しく参照するbaseを追加。
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: '/web-no-tonari',
  server: {
    host: '127.0.0.1',
  },
});
