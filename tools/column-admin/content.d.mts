// 変更履歴: 2026-11-11 公開ページで同じプレーンテキスト形式を使うため型を定義。
export type Article={slug:string;title:string;summary:string;category:'security'|'system';body:string;sources:{title:string;url:string}[];publishedAt:string;updatedAt:string};
export const categories:Record<Article['category'],string>;
export function validateArticle(input:unknown):Omit<Article,'publishedAt'|'updatedAt'>;
export function toPublicArticle(input:unknown):Article;
export function parseBody(body:string):({type:'heading'|'paragraph';text:string}|{type:'list';items:string[]})[];
