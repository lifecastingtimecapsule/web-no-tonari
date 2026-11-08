// 変更履歴: 2026-11-08 安全チェックの入力制限と判定（3段階・確認できず）を固定するテストを追加。
import { describe, expect, it, vi, afterEach } from 'vitest';
import { analyzeMail, analyzePage, joinTxtData, normalizeTarget, organizationalDomain } from '../workers/safety-check/src/checks';
import worker from '../workers/safety-check/src/index';

const securePage = {
  httpsReachable: true,
  finalUrl: 'https://example.co.jp/',
  httpRedirectsToHttps: true,
  headers: {
    'strict-transport-security': 'max-age=31536000',
    'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  },
  html: '<html><head><title>t</title></head><body><img src="https://example.co.jp/a.png"></body></html>',
};

describe('normalizeTarget', () => {
  it('スキームなしの入力をトップページのhttps URLへ揃える', () => {
    const result = normalizeTarget(' Example.com/wp-admin?x=1 ');
    expect('url' in result && result.url.toString()).toBe('https://example.com/');
  });
  it.each(['http://127.0.0.1/', 'localhost', 'http://[::1]/', 'intranet', 'https://a.local', 'https://user:pass@example.com', 'ftp://example.com', 'https://example.com:8080'])('%s は確認しない', (input) => {
    expect('error' in normalizeTarget(input)).toBe(true);
  });
});

describe('organizationalDomain', () => {
  it('wwwや日本の第2レベルを考慮する', () => {
    expect(organizationalDomain('www.shop.example.co.jp')).toBe('example.co.jp');
    expect(organizationalDomain('www.example.com')).toBe('example.com');
    expect(organizationalDomain('example.jp')).toBe('example.jp');
  });
});

describe('analyzePage', () => {
  it('整ったサイトは要対応を出さない', () => {
    const items = analyzePage(securePage);
    expect(items.every((item) => item.status === 'ok')).toBe(true);
  });
  it('HTTPSに接続できない場合は要対応だけを返す', () => {
    const items = analyzePage({ ...securePage, httpsReachable: false, finalUrl: null });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('action');
  });
  it.each([404, 429, 503])('応答コード%sでは、エラーページの内容で判定しない', (code) => {
    const items = analyzePage({ ...securePage, status: code, headers: {}, html: '' });
    expect(items.map((item) => `${item.id}:${item.status}`)).toEqual(['https:ok', 'page:unknown']);
  });
  it('バージョン露出・混在スクリプト・転送なしを検出する', () => {
    const items = analyzePage({
      ...securePage,
      httpRedirectsToHttps: false,
      headers: { 'x-powered-by': 'PHP/7.4.3' },
      html: '<meta name="generator" content="WordPress 5.8.1"><script src="http://cdn.example.com/a.js"></script>',
    });
    const byId = Object.fromEntries(items.map((item) => [item.id, item.status]));
    expect(byId).toMatchObject({ redirect: 'advice', hsts: 'advice', headers: 'advice', exposure: 'advice', mixed: 'action' });
  });
});

describe('analyzeMail', () => {
  it('SPF・DMARCの有無と強さを判定する', () => {
    const byId = (spf: string[] | null, dmarc: string[] | null) => Object.fromEntries(analyzeMail({ domain: 'example.jp', spf, dmarc }).map((item) => [item.id, item.status]));
    expect(byId(['v=spf1 include:_spf.google.com ~all'], ['v=DMARC1; p=reject'])).toEqual({ spf: 'ok', dmarc: 'ok' });
    expect(byId([], ['v=DMARC1; p=none'])).toEqual({ spf: 'advice', dmarc: 'advice' });
    expect(byId(['v=spf1 +all'], [])).toEqual({ spf: 'action', dmarc: 'advice' });
    expect(byId(null, null)).toEqual({ spf: 'unknown', dmarc: 'unknown' });
  });
  it('分割されたTXTを結合する', () => {
    expect(joinTxtData('"v=spf1 include:a" " ~all"')).toBe('v=spf1 include:a ~all');
  });
});

describe('worker', () => {
  afterEach(() => vi.unstubAllGlobals());
  const ctx = { waitUntil: () => undefined };
  const env = { ALLOWED_ORIGINS: 'https://lifecastingtimecapsule.github.io' };

  it('許可していないオリジンからの確認を断る', async () => {
    const response = await worker.fetch(new Request('https://w.example/api/check?url=example.com', { headers: { Origin: 'https://evil.example' } }), env, ctx);
    expect(response.status).toBe(403);
  });

  it('非公開の宛先は外部へ通信せずに断る', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await worker.fetch(new Request('https://w.example/api/check?url=127.0.0.1', { headers: { Origin: env.ALLOWED_ORIGINS } }), env, ctx);
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('トップページとDNSだけを取得して結果を返す', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      requested.push(input);
      if (input.startsWith('http://')) return new Response(null, { status: 301, headers: { Location: 'https://example.com/' } });
      if (input.includes('dns-query')) {
        const answer = input.includes('_dmarc') ? '"v=DMARC1; p=quarantine"' : '"v=spf1 -all"';
        return Response.json({ Status: 0, Answer: [{ type: 16, data: answer }] });
      }
      return new Response(securePage.html, { headers: { 'Content-Type': 'text/html', ...securePage.headers } });
    }));
    const response = await worker.fetch(new Request('https://w.example/api/check?url=www.example.com', { headers: { Origin: env.ALLOWED_ORIGINS } }), env, ctx);
    const body = await response.json() as { counts: Record<string, number> };
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGINS);
    expect(body.counts).toMatchObject({ action: 0, unknown: 0 });
    expect(requested.filter((url) => !url.includes('dns-query'))).toEqual(['https://www.example.com/', 'http://www.example.com/']);
  });
});
