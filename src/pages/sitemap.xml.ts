// 変更履歴: 2026-11-11 公開ページをクロールへ案内するサイトマップを追加。試作・404・フォームAPIは除外。
import type {APIRoute} from 'astro';
import {servicePages} from '../data/services';
/** 公開サービスと案内ページだけを正規URLで列挙する。更新していない日付は生成しない。 */
export const GET: APIRoute = ({site}) => {
  const root = new URL(import.meta.env.BASE_URL, site ?? 'https://site-veil.com');
  const paths = ['', 'services/', ...servicePages.map(service => `services/${service.slug}/`), 'services/security/php/', 'pricing/', 'company/', 'philosophy/', 'check/', 'security/'];
  const entries = paths.map(path => `<url><loc>${new URL(path,root).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
