// 変更履歴: 2026-11-11 公開用に確定したコラムのみを読み込む。ローカル下書きには接続しない。
import published from './columns.json';
import {toPublicArticle,parseBody,categories} from '../../tools/column-admin/content.mjs';
export {parseBody,categories};
export const columns=published.map(toPublicArticle).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.slug.localeCompare(b.slug));
if(new Set(columns.map(article=>article.slug)).size!==columns.length)throw new Error('コラムのURL名が重複しています。');
/** 公開日を日本語・日本時間で表示する。 */
export const columnDate=(date:string)=>new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tokyo'}).format(new Date(date));
