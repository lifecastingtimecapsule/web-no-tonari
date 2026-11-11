// 変更履歴: 2026-11-11 Nodeの単体テストでWorkers固有の基底クラスを分離。実ランタイムはWranglerで別途検証する。
import {defineConfig} from 'vitest/config';
export default defineConfig({resolve:{alias:{'cloudflare:workers':new URL('./tests/cloudflare-runtime.ts',import.meta.url).pathname}}});
