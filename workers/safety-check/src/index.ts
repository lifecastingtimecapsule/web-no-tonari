// 変更履歴: 2026-11-15 Turnstileの成功・action・本番hostnameを確認してから外部サイトへ接続するよう変更。
// 変更履歴: 2026-11-15 名前解決後の非公開IPを遮断し、転送を同一ホスト2回まで、呼び出し制限をCloudflare共有カウンタに変更。
// 変更履歴: 2026-11-08 「かんたん安全チェック」のCloudflare Worker入口を追加。
// 役割: 公開サイトのトップページ1件とDNSのTXTだけを取得し、確認結果をJSONで返す。
// 方針: 1回の確認でトップページへのGETは最大2系統（https・http）、転送は同一ホスト2回まで。結果は10分間キャッシュする。
import { analyzeMail, analyzePage, countStatuses, isIpLiteral, joinTxtData, normalizeTarget, organizationalDomain } from './checks';
import type { PageSnapshot } from './checks';
import {verifyTurnstile,type TurnstileEnv} from '../../shared/turnstile';

export interface Env extends TurnstileEnv {
  /** カンマ区切りで、APIを呼べるサイトのオリジンを指定する。 */
  ALLOWED_ORIGINS?: string;
  /** 複数インスタンス間で共有する無料照会の回数制限。 */
  SAFETY_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

interface WorkerContext { waitUntil(promise: Promise<unknown>): void }

const USER_AGENT = 'WebNoTonari-SafetyCheck/1.0 (+https://lifecastingtimecapsule.github.io/web-no-tonari/check/)';
const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 600_000;
const MAX_REDIRECTS = 2;

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'https://example.com のような、公開されているサイトのURLを入力してください。',
  port: '標準のポート（80・443）で公開されているサイトのみ確認できます。',
  host: '公開されているドメイン名のサイトのみ確認できます。IPアドレスや社内向けの名前は確認できません。',
  rate: '短時間に確認が集中しています。10分ほど時間をおいてお試しください。',
  origin: 'このサイト以外からは利用できません。',
  unavailable: 'チェック機能を利用できません。時間をおいてお試しください。',
};

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? 'https://lifecastingtimecapsule.github.io').split(',').map((value) => value.trim());
  return allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'X-Turnstile-Token', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

function json(body: unknown, status: number, extraHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders },
  });
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

/** IPv4/IPv6の代表的な非公開・特殊用途範囲を除外し、外部公開先だけを許可する。 */
export function isPublicIpAddress(address: string): boolean {
  const value = address.trim().toLowerCase();
  const ipv4 = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)?.slice(1).map(Number);
  if (ipv4 && ipv4.every((part) => part >= 0 && part <= 255)) {
    const [a, b, c] = ipv4;
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      || (a === 192 && b === 0 && (c === 0 || c === 2)) || (a === 198 && (b === 18 || b === 19 || b === 51))
      || (a === 203 && b === 0 && c === 113));
  }
  if (!value.includes(':') || !/^[0-9a-f:.]+$/.test(value)) return false;
  if (value === '::' || value === '::1' || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')
    || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('ff') || value.startsWith('100:') || value.startsWith('64:ff9b:')
    || value.startsWith('2001:db8:') || value.startsWith('2002:')) return false;
  const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mapped) return isPublicIpAddress(mapped);
  const mappedHex = value.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16); const low = Number.parseInt(mappedHex[2], 16);
    return isPublicIpAddress(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  return true;
}

/** Cloudflareの公開DNSでA/AAAAを解決し、非公開IPや解決不能の宛先をフェッチ前に止める。 */
async function assertPublicHost(host: string): Promise<void> {
  const responses = await Promise.all(['A', 'AAAA'].map(async (type) => {
    const response = await fetchWithTimeout(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { Accept: 'application/dns-json' } });
    if (!response.ok) throw new Error('dns');
    return response.json() as Promise<{ Status: number; Answer?: { type: number; data: string }[] }>;
  }));
  const addresses = responses.flatMap((data) => {
    if (![0, 3].includes(data.Status)) throw new Error('dns');
    return (data.Answer ?? []).filter((answer) => answer.type === 1 || answer.type === 28).map((answer) => answer.data);
  });
  if (!addresses.length || addresses.some((address) => !isPublicIpAddress(address))) throw new Error('unsafe_host');
}

/** 転送を1回ずつ追い、別ホストや過剰な転送は取得しない。 */
async function fetchFollowing(startUrl: string, readBody: boolean): Promise<{ response: Response; finalUrl: string; body: string } | null> {
  let current = startUrl;
  const allowedHost = new URL(startUrl).hostname;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchWithTimeout(current, { redirect: 'manual', headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' } });
    const location = response.headers.get('Location');
    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, current);
      if (!['http:', 'https:'].includes(next.protocol) || isIpLiteral(next.hostname) || next.hostname !== allowedHost) return null;
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

async function snapshotPage(host: string): Promise<PageSnapshot & { diagnostics: Record<string, string | number | null> }> {
  const [httpsResult, httpResult] = await Promise.allSettled([
    fetchFollowing(`https://${host}/`, true),
    fetchWithTimeout(`http://${host}/`, { redirect: 'manual', headers: { 'User-Agent': USER_AGENT } }),
  ]);
  const page = httpsResult.status === 'fulfilled' ? httpsResult.value : null;
  let httpRedirectsToHttps: boolean | null = null;
  // 判定の根拠を結果に残し、誤判定の調査をできるようにする（画面には表示しない）。
  const diagnostics: Record<string, string | number | null> = {
    httpsStatus: page?.response.status ?? null,
    httpStatus: httpResult.status === 'fulfilled' ? httpResult.value.status : null,
    httpLocation: httpResult.status === 'fulfilled' ? httpResult.value.headers.get('Location') : null,
    httpUrl: httpResult.status === 'fulfilled' ? httpResult.value.url : null,
  };
  if (httpResult.status === 'fulfilled') {
    const location = httpResult.value.headers.get('Location');
    httpRedirectsToHttps = Boolean(location && location.startsWith('https://'));
    await httpResult.value.body?.cancel();
  }
  const headers: Record<string, string> = {};
  page?.response.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
  return {
    httpsReachable: Boolean(page),
    status: page?.response.status ?? null,
    finalUrl: page?.finalUrl ?? null,
    httpRedirectsToHttps,
    headers,
    html: page?.body ?? '',
    diagnostics,
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
  await assertPublicHost(host);
  const domain = organizationalDomain(host);
  const [page, spf, dmarc] = await Promise.all([snapshotPage(host), lookupTxt(domain), lookupTxt(`_dmarc.${domain}`)]);
  const items = [...analyzePage(page), ...analyzeMail({ domain, spf, dmarc })];
  return { target: target.toString(), domain, checkedAt: new Date().toISOString(), reachable: page.httpsReachable, items, counts: countStatuses(items), diagnostics: page.diagnostics };
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

    if (!env.SAFETY_RATE_LIMITER) return json({ error: 'unavailable', message: ERROR_MESSAGES.unavailable }, 503, cors);
    const clientKey = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!(await env.SAFETY_RATE_LIMITER.limit({ key: `safety:${clientKey}` })).success) return json({ error: 'rate', message: ERROR_MESSAGES.rate }, 429, cors);

    const turnstile=await verifyTurnstile({request,env,token:request.headers.get('X-Turnstile-Token'),expectedAction:'safety_check'});
    if(turnstile==='unavailable')return json({error:'unavailable',message:ERROR_MESSAGES.unavailable},503,cors);
    if(turnstile!=='valid')return json({error:'challenge',message:'操作を確認できませんでした。画面を更新して、もう一度お試しください。'},403,cors);

    const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
    const cacheKey = new Request(`https://safety-check.cache/v6/${normalized.url.hostname}`);
    const cached = await cache?.match(cacheKey);
    if (cached) return json(await cached.json(), 200, { ...cors, 'X-Check-Cache': 'hit' });

    let result;
    try { result = await runCheck(normalized.url); }
    catch { return json({ error: 'host', message: ERROR_MESSAGES.host }, 400, cors); }
    if (cache) ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(result), { headers: { 'Cache-Control': 'max-age=600' } })));
    return json(result, 200, cors);
  },
};
