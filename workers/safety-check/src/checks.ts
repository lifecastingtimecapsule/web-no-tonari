// 変更履歴: 2026-11-08 SEO確認を置き換える「かんたん安全チェック」の判定ロジックを追加。
// 役割: 公開情報（応答ヘッダー・HTML・DNSのTXT）だけから、確認項目と3段階の状態を組み立てる。
// 方針: 攻撃・探索にあたる通信は行わない。判定できないものは「確認できず」とし、結果を創作しない。

export type CheckStatus = 'ok' | 'advice' | 'action' | 'unknown';

export interface CheckItem {
  id: string;
  title: string;
  status: CheckStatus;
  summary: string;
  detail: string;
}

export interface PageSnapshot {
  /** https://で接続できたか */
  httpsReachable: boolean;
  /** 最後に到達したURL（転送後） */
  finalUrl: string | null;
  /** http://で接続したとき、https://へ転送されたか（null = 確認できず） */
  httpRedirectsToHttps: boolean | null;
  headers: Record<string, string>;
  html: string;
}

export interface MailSnapshot {
  domain: string;
  spf: string[] | null;
  dmarc: string[] | null;
}

const PRIVATE_SUFFIXES = ['localhost', '.local', '.internal', '.localhost', '.lan', '.home.arpa', '.invalid', '.test', '.example'];
const JP_SECOND_LEVELS = new Set(['co', 'or', 'ne', 'ac', 'ad', 'ed', 'go', 'gr', 'lg']);

/** 入力値を確認対象の公開URLへ正規化する。不正・非公開の宛先は理由コードを返す。 */
export function normalizeTarget(raw: string): { url: URL } | { error: string } {
  const entered = raw.trim();
  if (!entered || entered.length > 2048 || /\s/.test(entered)) return { error: 'invalid' };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(entered) ? entered : `https://${entered}`);
  } catch {
    return { error: 'invalid' };
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return { error: 'invalid' };
  if (url.port && !['80', '443'].includes(url.port)) return { error: 'port' };
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') || isIpLiteral(host)) return { error: 'host' };
  if (PRIVATE_SUFFIXES.some((suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix))) return { error: 'host' };
  if (!/^[a-z0-9.-]+$/.test(host)) return { error: 'host' };
  // 確認は常にトップページを対象にし、他人のサイトの任意パスを叩く用途にしない。
  return { url: new URL(`https://${host}/`) };
}

export function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[') || host.includes(':');
}

/** メール認証の確認先となる組織ドメインを、wwwや一般的な日本の第2レベルを考慮して推定する。 */
export function organizationalDomain(hostname: string): string {
  const labels = hostname.toLowerCase().replace(/\.$/, '').split('.');
  if (labels.length <= 2) return labels.join('.');
  const keep = labels[labels.length - 1] === 'jp' && JP_SECOND_LEVELS.has(labels[labels.length - 2]) ? 3 : 2;
  return labels.slice(-keep).join('.');
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Boolean(headers[name.toLowerCase()]?.trim());
}

/** 応答ヘッダーとHTMLから、通信と表示まわりの確認項目を作る。 */
export function analyzePage(page: PageSnapshot): CheckItem[] {
  const items: CheckItem[] = [];

  if (!page.httpsReachable) {
    items.push({
      id: 'https', title: 'HTTPS（鍵マーク）での接続', status: 'action',
      summary: 'https:// で正常に接続できませんでした。',
      detail: '証明書の期限切れや設定漏れの可能性があります。訪問者のブラウザに警告が出ていないか、すぐに確認してください。',
    });
    return items;
  }

  const finalIsHttps = page.finalUrl?.startsWith('https://') ?? false;
  items.push(finalIsHttps
    ? { id: 'https', title: 'HTTPS（鍵マーク）での接続', status: 'ok', summary: 'https:// で正常に接続できます。', detail: '通信は暗号化されています。証明書の更新が自動になっているかは、管理画面でも確認しておくと安心です。' }
    : { id: 'https', title: 'HTTPS（鍵マーク）での接続', status: 'action', summary: 'https:// から http:// へ戻されています。', detail: '暗号化されない画面へ転送されています。サーバーやCMSの転送設定を見直してください。' });

  if (page.httpRedirectsToHttps === null) {
    items.push({ id: 'redirect', title: 'http:// からの自動転送', status: 'unknown', summary: 'http:// での応答を確認できませんでした。', detail: '時間をおいて再度お試しください。' });
  } else {
    items.push(page.httpRedirectsToHttps
      ? { id: 'redirect', title: 'http:// からの自動転送', status: 'ok', summary: 'http:// で開いても、https:// へ自動で切り替わります。', detail: '古いリンクから来た訪問者も、暗号化された画面で閲覧できます。' }
      : { id: 'redirect', title: 'http:// からの自動転送', status: 'advice', summary: 'http:// のままでも表示できる状態です。', detail: 'https:// へ自動で転送する設定にすると、暗号化されない閲覧を防げます。' });
  }

  const headers = page.headers;
  items.push(hasHeader(headers, 'strict-transport-security')
    ? { id: 'hsts', title: '暗号化の固定（HSTS）', status: 'ok', summary: '常にhttps://で開くよう、ブラウザへ指示しています。', detail: '' }
    : { id: 'hsts', title: '暗号化の固定（HSTS）', status: 'advice', summary: 'ブラウザへの「常にhttps://で開く」指示がありません。', detail: 'Strict-Transport-Security の設定を検討してください。設定前に、すべてのページがhttps://で表示できることを確認します。' });

  const csp = headers['content-security-policy'] ?? '';
  const protections: [string, boolean][] = [
    ['読み込み元の制限（Content-Security-Policy）', Boolean(csp.trim())],
    ['他サイトへの埋め込み防止（X-Frame-Options / frame-ancestors）', hasHeader(headers, 'x-frame-options') || /frame-ancestors/i.test(csp)],
    ['ファイル種別の誤認防止（X-Content-Type-Options）', /nosniff/i.test(headers['x-content-type-options'] ?? '')],
    ['参照元情報の制限（Referrer-Policy）', hasHeader(headers, 'referrer-policy')],
  ];
  const missing = protections.filter(([, present]) => !present).map(([label]) => label);
  items.push({
    id: 'headers', title: 'ブラウザ向けの保護設定',
    status: missing.length <= 1 ? 'ok' : 'advice',
    summary: missing.length === 0 ? '主な保護設定が4つとも有効です。' : `4つの主な保護設定のうち、${4 - missing.length}つが有効です。`,
    detail: missing.length ? `未設定：${missing.join('、')}。サーバーやCMSのセキュリティ設定で追加できる場合があります。` : '',
  });

  const exposures: string[] = [];
  const generator = page.html.match(/<meta[^>]+name=["']generator["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? page.html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']generator["']/i)?.[1];
  if (generator && /\d/.test(generator)) exposures.push(`ページ内の表示（${generator.slice(0, 60)}）`);
  for (const name of ['x-powered-by', 'server', 'x-aspnet-version']) {
    const value = headers[name];
    if (value && /\d+\.\d+/.test(value)) exposures.push(`応答ヘッダー（${name}: ${value.slice(0, 60)}）`);
  }
  items.push(exposures.length
    ? { id: 'exposure', title: '使っているソフトの版の表示', status: 'advice', summary: 'CMSやサーバーのバージョンが外から見える状態です。', detail: `${exposures.join('、')}。古い版の弱点を探す目印になるため、非表示にするとともに、更新が止まっていないか確認してください。` }
    : { id: 'exposure', title: '使っているソフトの版の表示', status: 'ok', summary: 'トップページからは、ソフトのバージョンが読み取れませんでした。', detail: '表示されていないことと、更新されていることは別です。CMSやプラグインの更新状況は管理画面で確認します。' });

  if (finalIsHttps) {
    const scriptHits = page.html.match(/<(script|iframe)[^>]+src=["']http:\/\/[^"']+["']/gi)?.length ?? 0;
    const styleHits = page.html.match(/<link[^>]+href=["']http:\/\/[^"']+["'][^>]*>/gi)?.filter((tag) => /stylesheet/i.test(tag)).length ?? 0;
    const mediaHits = page.html.match(/<(img|source|video|audio)[^>]+src=["']http:\/\/[^"']+["']/gi)?.length ?? 0;
    if (scriptHits + styleHits > 0) {
      items.push({ id: 'mixed', title: '暗号化されない読み込み', status: 'action', summary: `プログラムやデザインの読み込みに、http:// が ${scriptHits + styleHits} か所あります。`, detail: 'ブラウザがブロックし、表示が崩れたり機能が動かなかったりします。読み込み先を https:// に変更してください。' });
    } else if (mediaHits > 0) {
      items.push({ id: 'mixed', title: '暗号化されない読み込み', status: 'advice', summary: `画像などの読み込みに、http:// が ${mediaHits} か所あります。`, detail: '鍵マークに注意表示が出る場合があります。画像のURLを https:// に揃えてください。' });
    } else {
      items.push({ id: 'mixed', title: '暗号化されない読み込み', status: 'ok', summary: 'トップページで、http:// の読み込みは見つかりませんでした。', detail: '確認したのはトップページの最初の読み込みのみです。' });
    }
  }

  return items;
}

/** DNSのTXTから、なりすましメール対策（SPF・DMARC）の項目を作る。 */
export function analyzeMail(mail: MailSnapshot): CheckItem[] {
  const items: CheckItem[] = [];
  const spf = mail.spf?.find((record) => /^v=spf1\b/i.test(record));
  if (mail.spf === null) {
    items.push({ id: 'spf', title: 'なりすましメール対策（SPF）', status: 'unknown', summary: 'DNSを確認できませんでした。', detail: '時間をおいて再度お試しください。' });
  } else if (!spf) {
    items.push({ id: 'spf', title: 'なりすましメール対策（SPF）', status: 'advice', summary: `${mail.domain} に、送信元を示すSPFの設定がありません。`, detail: '会社のドメインを名乗った偽メールが届きやすくなります。メールを送らないドメインでも、「送信しない」と示すSPFを設定できます。' });
  } else if (/[+]all\b/i.test(spf)) {
    items.push({ id: 'spf', title: 'なりすましメール対策（SPF）', status: 'action', summary: 'SPFが「誰でも送信してよい」設定になっています。', detail: '末尾の +all は、なりすましを許してしまいます。~all または -all への変更を検討してください。' });
  } else {
    items.push({ id: 'spf', title: 'なりすましメール対策（SPF）', status: 'ok', summary: `${mail.domain} にSPFが設定されています。`, detail: '' });
  }

  const dmarc = mail.dmarc?.find((record) => /^v=DMARC1\b/i.test(record));
  const policy = dmarc?.match(/\bp=(\w+)/i)?.[1]?.toLowerCase();
  if (mail.dmarc === null) {
    items.push({ id: 'dmarc', title: 'なりすましメール対策（DMARC）', status: 'unknown', summary: 'DNSを確認できませんでした。', detail: '時間をおいて再度お試しください。' });
  } else if (!dmarc) {
    items.push({ id: 'dmarc', title: 'なりすましメール対策（DMARC）', status: 'advice', summary: `${mail.domain} に、DMARCの設定がありません。`, detail: '偽メールを受信側で止めるための仕組みです。まず監視だけの設定（p=none）から始め、届き方を確認して段階的に強めます。' });
  } else if (policy === 'none') {
    items.push({ id: 'dmarc', title: 'なりすましメール対策（DMARC）', status: 'advice', summary: 'DMARCは「監視のみ（p=none）」の設定です。', detail: '偽メールはまだ止まりません。正規のメールが問題なく届くことを確認したら、quarantine や reject への強化を検討します。' });
  } else {
    items.push({ id: 'dmarc', title: 'なりすましメール対策（DMARC）', status: 'ok', summary: `DMARCが設定され、偽メールを止める方針（p=${policy ?? '不明'}）になっています。`, detail: '' });
  }
  return items;
}

/** TXTレコードの値を、引用符で分割された形式から結合済みの文字列へ戻す。 */
export function joinTxtData(data: string): string {
  const parts = data.match(/"((?:[^"\\]|\\.)*)"/g);
  return parts ? parts.map((part) => part.slice(1, -1)).join('') : data;
}

export function countStatuses(items: CheckItem[]): Record<CheckStatus, number> {
  const counts: Record<CheckStatus, number> = { ok: 0, advice: 0, action: 0, unknown: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}
