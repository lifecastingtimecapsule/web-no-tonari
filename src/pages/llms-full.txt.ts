// 変更履歴: 2026-11-26 AI検索向けに llms-full.txt を追加（公開コラム全文を1ファイルに集約）。
import type {APIRoute} from 'astro';
import {columns} from '../data/columns';

export const GET: APIRoute = () => {
  const lines: string[] = [];
  lines.push('# SITEVEIL — 小さな会社のセキュリティ検査・保守');
  lines.push('');
  lines.push('> 愛知県の小さな会社向けに、セキュリティ検査・保守・漏えいチェックを行うSITEVEILの公開情報です。');
  lines.push('');
  lines.push('## サービス');
  lines.push('- 無料のサイト安全チェック / メール漏えいチェック');
  lines.push('- 基本セキュリティ確認 ¥59,400（税込）');
  lines.push('- システム詳細検査 ¥198,000〜 / 総合検査・侵入テスト ¥330,000〜');
  lines.push('- 基本保守 月額¥9,240');
  lines.push('');
  lines.push('## 公開コラム');
  for (const article of columns) {
    lines.push('');
    lines.push(`### ${article.title}`);
    lines.push(`- URL: https://site-veil.com/columns/${article.slug}/`);
    lines.push(`- 公開日: ${article.publishedAt.slice(0, 10)}`);
    lines.push('');
    lines.push(article.summary);
    lines.push('');
    lines.push(article.body);
  }
  lines.push('');
  lines.push('## 連絡先');
  lines.push('- サイト: https://site-veil.com/');
  lines.push('- 会社概要: https://site-veil.com/company/');
  return new Response(lines.join('\n'), {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
};
