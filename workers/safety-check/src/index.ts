// 変更履歴: 2026-11-08 「かんたん安全チェック」のCloudflare Worker入口を追加。
// 役割: 公開サイトのトップページ1件とDNSのTXTだけを取得し、確認結果をJSONで返す。
// 方針: 1回の確認でトップページへのGETは最大2系統（https・http）、転送は5回まで。結果は10分間キャッシュする。
import { analyzeMail, analyzePage, countStatuses, isIpLiteral, joinTxtData, normalizeTarget, organizationalDomain } from './checks';
import type { PageSnapshot } from './checks';

export interface Env {
  /** カンマ区切りで、APIを呼べるサイトのオリジンを指定する。 */
  ALLOWED_ORIGINS?: string;
}

interface WorkerContext { waitUntil(promise: Promise<unknown>): void }

const USER_AGENT = 'WebNoTonari-SafetyCheck/1.0 (+https://lifecastingtimecapsule.github.io/web-no-tonari/check/)';
const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 600_000;
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 12 };
const recentRequests = new Map<string, number[]>();

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'https://example.com のような、公開されているサイトのURLを入力してください。',
  port: '標準のポート（80・443）で公開されているサイトのみ確認できます。',
  host: '公開されているドメイン名のサイトのみ確認できます。IPアドレスや社内向けの名前は確認できません。',
  rate: '短時間に確認が集中しています。10分ほど時間をおいてお試しください。',
  origin: 'このサイト以外からは利用できません。',
};

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? 'https://lifecastingtimecapsule.github.io').split(',').map((value) => value.trim());
  return allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

function json(body: unknown, status: number, extraHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders },
  });
}

function isRateLimited(clientKey: string, now = Date.now()): boolean {
  const recent = (recentRequests.get(clientKey) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);
  recent.push(now);
  recentRequests.set(clientKey, recent);
  if (recentRequests.size > 5000) recentRequests.clear();
  return recent.length > RATE_LIMIT.max;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

/** 転送を1回ずつ追い、各転送先も公開ドメインであることを確かめる。 */
async function fetchFollowing(startUrl: string, readBody: boolean): Promise<{ response: Response; finalUrl: string; body: string } | null> {
  let current = startUrl;
  for (let hop = 0; hop <= 5; hop += 1) {
    const response = await fetchWithTimeout(current, { redirect: 'manual', headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' } });
    const location = response.headers.get('Location');
    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, current);
      if (!['http:', 'https:'].includes(next.protocol) || isIpLiteral(next.hostname)) return null;
      await response.body?.cancel();
      current = next.toString();
      continue;
    }
    const body = readBody ? await readLimited(response) : '';
    if (!readBody) await response.body?.cancel();
    return { response, finalUrl: current, body };
  }
  return null;
}

async function readLimited(response: Response): Promise<string> {
  if (!response.body || !/html|xml|text/i.test(response.headers.get('Content-Type') ?? 'text/html')) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel();
  const merged = new Uint8Array(Math.min(size, MAX_HTML_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, merged.length - offset);
    merged.set(slice, offset);
    offset += slice.length;
    if (offset >= merged.length) break;
  }
  return new TextDecoder().decode(merged);
}

async function snapshotPage(host: string): Promise<PageSnapshot> {
  const [httpsResult, httpResult] = await Promise.allSettled([
    fetchFollowing(`https://${host}/`, true),
    fetchWithTimeout(`http://${host}/`, { redirect: 'manual', headers: { 'User-Agent': USER_AGENT } }),
  ]);
  const page = httpsResult.status === 'fulfilled' ? httpsResult.value : null;
  let httpRedirectsToHttps: boolean | null = null;
  if (httpResult.status === 'fulfilled') {
    const location = httpResult.value.headers.get('Location');
    httpRedirectsToHttps = Boolean(location && location.startsWith('https://'));
    await httpResult.value.body?.cancel();
  }
  const headers: Record<string, string> = {};
  page?.response.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
  return {
    httpsReachable: Boolean(page && page.response.status < 500),
    finalUrl: page?.finalUrl ?? null,
    httpRedirectsToHttps,
    headers,
    html: page?.body ?? '',
  };
}

/** Cloudflareの公開DNS（DNS over HTTPS）からTXTを取得する。失敗時はnullで「確認できず」を示す。 */
async function lookupTxt(name: string): Promise<string[] | null> {
  try {
    const response = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`, { headers: { Accept: 'application/dns-json' } });
    if (!response.ok) return null;
    const data = await response.json() as { Status: number; Answer?: { type: number; data: string }[] };
    if (data.Status !== 0 && data.Status !== 3) return null;
    return (data.Answer ?? []).filter((answer) => answer.type === 16).map((answer) => joinTxtData(answer.data));
  } catch {
    return null;
  }
}

async function runCheck(target: URL) {
  const host = target.hostname;
  const domain = organizationalDomain(host);
  const [page, spf, dmarc] = await Promise.all([snapshotPage(host), lookupTxt(domain), lookupTxt(`_dmarc.${domain}`)]);
  const items = [...analyzePage(page), ...analyzeMail({ domain, spf, dmarc })];
  return { target: target.toString(), domain, checkedAt: new Date().toISOString(), reachable: page.httpsReachable, items, counts: countStatuses(items) };
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname !== '/api/check') return json({ error: 'not_found' }, 404, cors);
    if (request.method !== 'GET') return json({ error: 'method' }, 405, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin', message: ERROR_MESSAGES.origin }, 403, cors);

    const normalized = normalizeTarget(url.searchParams.get('url') ?? '');
    if ('error' in normalized) return json({ error: normalized.error, message: ERROR_MESSAGES[normalized.error] }, 400, cors);

    const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
    const cacheKey = new Request(`https://safety-check.cache/${normalized.url.hostname}`);
    const cached = await cache?.match(cacheKey);
    if (cached) return json(await cached.json(), 200, { ...cors, 'X-Check-Cache': 'hit' });

    const clientKey = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (isRateLimited(clientKey)) return json({ error: 'rate', message: ERROR_MESSAGES.rate }, 429, cors);

    const result = await runCheck(normalized.url);
    if (cache) ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(result), { headers: { 'Cache-Control': 'max-age=600' } })));
    return json(result, 200, cors);
  },
};
