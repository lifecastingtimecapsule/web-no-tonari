// 変更履歴: 2026-11-11 公開SEO点検により、実内容に合う検索向け情報へ更新。
// 変更履歴: 2026-11-11 公開ページの検索クロールとサイトマップの場所を明示。試作は検索対象から除外。
import type {APIRoute} from 'astro';
/** サイトマップとクロール許可を案内する。検索除外ページもクロール可能にし、HTMLのnoindexを読ませる。 */
export const GET: APIRoute = ({site}) => {
  const root = new URL(import.meta.env.BASE_URL, site ?? 'https://site-veil.com');
  return new Response(`User-agent: *\nAllow: ${root.pathname}\nSitemap: ${new URL('sitemap.xml',root).href}\n`, {headers:{'Content-Type':'text/plain; charset=utf-8'}});
};
