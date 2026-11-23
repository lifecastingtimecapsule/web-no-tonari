// 変更履歴: 2026-11-15 Turnstileが成功するまで対象サイトへ接続しない回帰検証を追加。
// 変更履歴: 2026-11-15 名前解決後の非公開IP、別ホスト転送、分散レート制限の回帰検証を追加。
// 変更履歴: 2026-11-08 安全チェックの入力制限と判定（3段階・確認できず）を固定するテストを追加。
import { describe, expect, it, vi, afterEach } from 'vitest';
import { analyzeDomainBreach, analyzeMail, analyzePage, joinTxtData, normalizeTarget, organizationalDomain } from '../workers/safety-check/src/checks';
import { decorate, scoreRisk } from '../workers/safety-check/src/messages';
import worker, { isPublicIpAddress } from '../workers/safety-check/src/index';

// 変更履歴: 2026-11-23 診断項目の追加に合わせ、検索向け設定・公開ファイル・WordPress・応答時間の観測値も持つ整ったページへ更新。
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
  html: '<html><head><title>例のサイト</title><meta name="description" content="説明"><link rel="canonical" href="https://example.co.jp/"><meta property="og:image" content="https://example.co.jp/og.png"></head><body><h1>見出し</h1><img src="https://example.co.jp/a.png"></body></html>',
  robotsTxt: true,
  sitemapXml: true,
  securityTxt: true,
  wordpress: { detected: false, userEnumeration: null },
  responseTimeMs: 120,
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

describe('isPublicIpAddress', () => {
  it.each(['10.0.0.1', '169.254.169.254', '127.0.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:a9fe:a9fe', '2001:db8::1'])('%s を非公開宛先として拒否する', (address) => {
    expect(isPublicIpAddress(address)).toBe(false);
  });
  it.each(['93.184.216.34', '2606:4700:4700::1111'])('%s は公開宛先として扱う', (address) => {
    expect(isPublicIpAddress(address)).toBe(true);
  });
});

describe('organizationalDomain', () => {
  it('wwwや日本の第2レベルを考慮する', () => {
    expect(organizationalDomain('www.shop.example.co.jp')).toBe('example.co.jp');
    expect(organizationalDomain('www.example.com')).toBe('example.com');
    expect(organizationalDomain('example.jp')).toBe('example.jp');
    expect(organizationalDomain('www.city.obu.aichi.jp')).toBe('city.obu.aichi.jp');
    expect(organizationalDomain('www.example.aichi.jp')).toBe('example.aichi.jp');
    expect(organizationalDomain('www.pref.aichi.jp')).toBe('pref.aichi.jp');
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

describe('analyzeDomainBreach', () => {
  it('漏えい元として公表されていれば要対応、無ければ問題なし、取得不可は確認できず', () => {
    expect(analyzeDomainBreach({ domain: 'example.jp', records: null })[0].status).toBe('unknown');
    expect(analyzeDomainBreach({ domain: 'example.jp', records: [] })[0].status).toBe('ok');
    const found = analyzeDomainBreach({ domain: 'example.jp', records: [{ name: 'Example', date: '2021-03-01', pwnCount: 1000 }] })[0];
    expect(found.status).toBe('action');
    expect(found.summary).toContain('1件');
    expect(found.detail).toContain('Example');
  });
});

describe('scoreRisk / decorate', () => {
  const item = (status: 'ok' | 'advice' | 'action' | 'unknown') => ({ id: 'x', title: 't', status, summary: 's', detail: '' });
  it('問題の重みで危険度を出し、確認できた項目数を返す', () => {
    expect(scoreRisk([]).level).toBe('unknown');
    expect(scoreRisk([item('ok'), item('ok')]).score).toBe(0);
    expect(scoreRisk([item('advice')]).level).toBe('watch');
    expect(scoreRisk([item('action')]).score).toBe(30);
    expect(scoreRisk([item('action'), item('action')]).level).toBe('danger');
    const mixed = scoreRisk([item('action'), item('unknown')]);
    expect(mixed.known).toBe(1);
    expect(mixed.total).toBe(2);
  });
  it('やさしい表現と過去事例を付与する', () => {
    const [first] = decorate([{ id: 'https', title: 'HTTPS', status: 'action', summary: 'x', detail: '' }]);
    expect(first.plain?.title).toContain('暗号化');
    expect(first.plain?.past).toBeTruthy();
  });
});

describe('worker', () => {


  afterEach(() => vi.unstubAllGlobals());
  const ctx = { waitUntil: () => undefined };
  const limiter = { limit: vi.fn(async () => ({ success: true })) };
  const env = { ALLOWED_ORIGINS: 'https://lifecastingtimecapsule.github.io', SAFETY_RATE_LIMITER: limiter, TURNSTILE_SECRET: 'test-secret', TURNSTILE_HOSTNAMES: 'site-veil.com' };
  const checkRequest = (target: string, token = 'valid-token') => new Request(`https://w.example/api/check?url=${target}`, { headers: { Origin: env.ALLOWED_ORIGINS, 'X-Turnstile-Token': token } });

  /** DNS照会に公開IPを返し、テストが対象サイトの応答だけに集中できるようにする。 */
  const publicDns = (input: string): Response | null => {
    if (!input.includes('dns-query')) return null;
    const type = new URL(input).searchParams.get('type');
    if (type === 'A') return Response.json({ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] });
    if (type === 'AAAA') return Response.json({ Status: 0, Answer: [] });
    const answer = input.includes('_dmarc') ? '"v=DMARC1; p=quarantine"' : '"v=spf1 -all"';
    return Response.json({ Status: 0, Answer: [{ type: 16, data: answer }] });
  };

  /** 成功したTurnstile検証を返し、その後の安全チェックだけを各テストで差し替えられるようにする。 */
  const turnstile = (input: string): Response | null => input.includes('challenges.cloudflare.com/turnstile/v0/siteverify')
    ? Response.json({ success: true, action: 'safety_check', hostname: 'site-veil.com' })
    : null;

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
      const turnstileResponse = turnstile(input);
      if (turnstileResponse) return turnstileResponse;
      if (input.startsWith('http://')) return new Response(null, { status: 301, headers: { Location: 'https://example.com/' } });
      const dnsResponse = publicDns(input);
      if (dnsResponse) return dnsResponse;
      if (input.includes('haveibeenpwned.com/api/v3/breaches')) return Response.json([]);
      if (input.includes('/robots.txt') || input.includes('/.well-known/security.txt')) return new Response('User-agent: *', { headers: { 'Content-Type': 'text/plain' } });
      if (input.includes('/sitemap.xml')) return new Response('<urlset/>', { headers: { 'Content-Type': 'application/xml' } });
      return new Response(securePage.html, { headers: { 'Content-Type': 'text/html', ...securePage.headers } });
    }));
    const response = await worker.fetch(checkRequest('www.example.com'), env, ctx);
    const body = await response.json() as { counts: Record<string, number> };
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(env.ALLOWED_ORIGINS);
    expect(body.counts).toMatchObject({ action: 0, advice: 0, unknown: 0 });
    // 変更履歴: 2026-11-23 公開ファイルの確認が加わったため、対象サイトへの通信を明示的に検証する。
    const siteCalls = requested.filter((url) => !url.includes('dns-query') && !url.includes('turnstile/v0/siteverify') && !url.includes('haveibeenpwned.com'));
    expect(siteCalls[0]).toBe('https://www.example.com/');
    expect(siteCalls).toContain('http://www.example.com/');
    expect(siteCalls).toEqual(expect.arrayContaining([
      'https://www.example.com/robots.txt',
      'https://www.example.com/sitemap.xml',
      'https://www.example.com/.well-known/security.txt',
    ]));
    expect(limiter.limit).toHaveBeenCalledWith({ key: 'safety:unknown' });
  });

  it('名前解決後がプライベートIPなら対象サイトへ接続しない', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      requested.push(input);
      const turnstileResponse = turnstile(input);
      if (turnstileResponse) return turnstileResponse;
      if (input.includes('dns-query')) return Response.json({ Status: 0, Answer: [{ type: 1, data: '169.254.169.254' }] });
      throw new Error('対象サイトへは接続しない');
    }));
    const response = await worker.fetch(checkRequest('metadata.example'), env, ctx);
    expect(response.status).toBe(400);
    expect(requested.every((url) => url.includes('cloudflare-dns.com/dns-query') || url.includes('turnstile/v0/siteverify'))).toBe(true);
  });

  it('別ホストへの転送を追跡しない', async () => {
    const requested: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      requested.push(input);
      const turnstileResponse = turnstile(input);
      if (turnstileResponse) return turnstileResponse;
      const dnsResponse = publicDns(input);
      if (dnsResponse) return dnsResponse;
      if (input.startsWith('http://')) return new Response(null, { status: 301, headers: { Location: 'https://example.com/' } });
      if (input === 'https://example.org/') throw new Error('別ホストを追跡しない');
      return new Response(null, { status: 302, headers: { Location: 'https://example.org/' } });
    }));
    const response = await worker.fetch(checkRequest('redirector.example.net'), env, ctx);
    expect(response.status).toBe(200);
    expect(requested).not.toContain('https://example.org/');
    expect((await response.json()).reachable).toBe(false);
  });

  it('分散レート制限が未設定または超過の場合は照会しない', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://w.example/api/check?url=example.com', { headers: { Origin: env.ALLOWED_ORIGINS } });
    expect((await worker.fetch(request.clone(), { ALLOWED_ORIGINS: env.ALLOWED_ORIGINS }, ctx)).status).toBe(503);
    const limitedEnv = { ...env, SAFETY_RATE_LIMITER: { limit: async () => ({ success: false }) } };
    expect((await worker.fetch(request.clone(), limitedEnv, ctx)).status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Turnstileが失敗した場合はDNSにも対象サイトにも接続しない', async () => {
    const transport=vi.fn(async(input:string)=>input.includes('turnstile/v0/siteverify')
      ? Response.json({success:false,action:'safety_check',hostname:'site-veil.com'})
      : Promise.reject(new Error('Turnstile以外へ接続しない')));
    vi.stubGlobal('fetch',transport);
    const response=await worker.fetch(checkRequest('example.com','bad-token'),env,ctx);
    expect(response.status).toBe(403);
    expect(transport).toHaveBeenCalledTimes(1);
  });
});
