// 変更履歴: 2026-11-11 公開ページの検索クロールとサイトマップの場所を明示。試作は検索対象から除外。
import type {APIRoute} from 'astro';
/** クローラーに公開範囲とサイトマップを案内する。アクセス制御の代用にはしない。 */
export const GET: APIRoute = ({site}) => {
  const root = new URL(import.meta.env.BASE_URL, site ?? 'https://site-veil.com');
  return new Response(`User-agent: *\nAllow: ${root.pathname}\nDisallow: ${root.pathname}preview/\nSitemap: ${new URL('sitemap.xml',root).href}\n`, {headers:{'Content-Type':'text/plain; charset=utf-8'}});
};
