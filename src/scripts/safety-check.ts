// 変更履歴: 2026-11-15 実行ごとにTurnstileの単回トークンを取得し、API送信後に破棄するよう変更。
// 変更履歴: 2026-11-08 安全チェックAPIの呼び出し、3段階の結果表示、相談欄への引き継ぎを追加。
// 役割: 入力URLの軽い検証、有限時間の呼び出し、取得結果だけの描画（結果を創作しない）を担当する。

import {createTurnstileController} from './turnstile';

type Status = 'ok' | 'advice' | 'action' | 'unknown';
type RiskLevel = 'good' | 'watch' | 'caution' | 'danger' | 'unknown';
interface Plain { title: string; summary: string; danger?: string; past?: string }
interface Item { id: string; title: string; status: Status; summary: string; detail: string; plain?: Plain }
interface Risk { score: number; level: RiskLevel; label: string; headline: string; note: string; known: number; total: number }
interface Result { target: string; checkedAt: string; items: Item[]; counts: Record<Status, number>; risk?: Risk }

// 変更履歴: 2026-11-23 一般向けに「危険」「注意」の言葉へ変更。
const STATUS_LABEL: Record<Status, string> = { ok: '問題なし', advice: '注意', action: '危険', unknown: '確認できず' };
const STATUS_ICON: Record<Status, string> = { ok: '✓', advice: '!', action: '!', unknown: '–' };
const FALLBACK_RISK: Risk = { score: 0, level: 'unknown', label: '判定できませんでした', headline: '自動では判定できませんでした', note: '公開情報から判定できませんでした。', known: 0, total: 0 };

const form = document.querySelector<HTMLFormElement>('[data-check-form]')!;
const input = document.querySelector<HTMLInputElement>('#check-url')!;
const button = document.querySelector<HTMLButtonElement>('[data-check-run]')!;
const status = document.querySelector<HTMLElement>('[data-check-status]')!;
const resultSection = document.querySelector<HTMLElement>('[data-check-result]')!;
const consult = document.querySelector<HTMLAnchorElement>('[data-check-consult]')!;
const challenge = document.querySelector<HTMLElement>('[data-turnstile]')!;
const turnstile=createTurnstileController(challenge,'safety_check');
const api = form.dataset.api?.replace(/\/$/, '') ?? '';
const home = import.meta.env.BASE_URL.replace(/\/$/, '') + '/';

function badge(state: Status): HTMLElement {
  const element = document.createElement('span');
  element.className = `status-badge status-badge--${state}`;
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = STATUS_ICON[state];
  element.append(icon, STATUS_LABEL[state]);
  return element;
}

function text(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
}

function render(result: Result): void {
  text('[data-check-target]', `確認したサイト：${result.target}`);

  // 危険度バナー（0〜100の目安。確率ではない）
  const risk = result.risk ?? { ...FALLBACK_RISK, total: result.items.length };
  const verdict = document.querySelector<HTMLElement>('[data-check-verdict]')!;
  verdict.dataset.level = risk.level;
  verdict.hidden = false;
  text('[data-verdict-label]', `危険度：${risk.label}`);
  text('[data-verdict-score]', String(risk.score));
  const meter = document.querySelector<HTMLElement>('[data-verdict-meter]')!;
  meter.setAttribute('aria-valuenow', String(risk.score));
  meter.setAttribute('aria-valuetext', `危険度スコア ${risk.score} / 100（${risk.label}）`);
  const fill = meter.querySelector<HTMLElement>('.check-meter__fill');
  if (fill) fill.style.inlineSize = `${risk.score}%`;
  text('[data-verdict-headline]', risk.headline);
  const unknownNote = risk.total > risk.known ? ` 確認できたのは${risk.total}項目中${risk.known}項目です。` : '';
  text('[data-verdict-note]', `${risk.note}${unknownNote}`);

  // 内訳チップ
  const summary = document.querySelector('[data-check-summary]')!;
  summary.replaceChildren();
  for (const state of ['action', 'advice', 'ok', 'unknown'] as Status[]) {
    if (!result.counts[state]) continue;
    const item = document.createElement('li');
    const chip = badge(state);
    chip.append(` ${result.counts[state]}件`);
    item.append(chip);
    summary.append(item);
  }

  // 危険な順に並べ、やさしい言葉＋過去事例＋技術詳細（折りたたみ）で表示
  const list = document.querySelector('[data-check-items]')!;
  list.replaceChildren();
  const order: Status[] = ['action', 'advice', 'unknown', 'ok'];
  for (const entry of [...result.items].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))) {
    const row = document.createElement('li');
    row.className = 'check-item';
    row.append(badge(entry.status));
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = entry.plain?.title ?? entry.title;
    const lead = document.createElement('p');
    lead.className = 'check-plain';
    lead.textContent = entry.plain?.summary ?? entry.summary;
    body.append(title, lead);
    if (entry.plain?.danger) {
      const danger = document.createElement('p');
      danger.className = 'check-danger';
      danger.textContent = entry.plain.danger;
      body.append(danger);
    }
    if (entry.plain?.past) {
      const past = document.createElement('p');
      past.className = 'check-past';
      past.textContent = `過去に起きたこと：${entry.plain.past}`;
      body.append(past);
    }
    if (entry.detail) {
      const details = document.createElement('details');
      const summaryEl = document.createElement('summary');
      summaryEl.textContent = '技術的な詳細';
      const detail = document.createElement('p');
      detail.textContent = entry.detail;
      details.append(summaryEl, detail);
      body.append(details);
    }
    row.append(body);
    list.append(row);
  }

  const checkedAt = new Date(result.checkedAt);
  text('[data-check-time]', `${checkedAt.toLocaleString('ja-JP')} 時点の結果です。サイトの状態を保証するものではありません。`);

  const needsWork = result.items.filter((item) => item.status === 'action' || item.status === 'advice');
  const names = needsWork.map((item) => `${item.plain?.title ?? item.title}（${STATUS_LABEL[item.status]}）`).join('、');
  const note = needsWork.length
    ? `安全チェックで気になった項目：${names}`
    : '安全チェックでは大きな問題は見つかりませんでした。中身の確認も相談したいです。';
  const target = new URL(home, location.origin);
  target.searchParams.set('service', '安全チェックの結果');
  target.searchParams.set('siteUrl', result.target);
  target.searchParams.set('note', note.slice(0, 500));
  target.hash = 'contact';
  consult.href = target.toString();

  resultSection.hidden = false;
  resultSection.focus({ preventScroll: true });
  resultSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

async function runCheck(event?: Event): Promise<void> {
  event?.preventDefault();
  if (!api) return;
  const entered = input.value.trim();
  if (!entered || /\s/.test(entered)) {
    input.setAttribute('aria-invalid', 'true');
    status.textContent = 'example.com のような、確認したいサイトのURLを入力してください。';
    input.focus();
    return;
  }
  input.removeAttribute('aria-invalid');
  button.disabled = true;
  button.textContent = '確認しています…';
  status.textContent = '確認しています。10秒ほどかかる場合があります。';
  try {
    const turnstileToken=await turnstile.token();
    const response = await fetch(`${api}/api/check?url=${encodeURIComponent(entered)}`, { headers:{'X-Turnstile-Token':turnstileToken},signal: AbortSignal.timeout(30000) });
    const data = await response.json() as Result & { message?: string };
    if (!response.ok) {
      status.textContent = data.message ?? '確認できませんでした。時間をおいてお試しください。';
      if (response.status === 400) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
      return;
    }
    status.textContent = '確認が終わりました。結果を表示しています。';
    render(data);
    const url = new URL(location.href);
    url.searchParams.set('url', entered);
    history.replaceState(null, '', url);
  } catch {
    status.textContent = '確認できませんでした。通信状況を確かめて、時間をおいてお試しください。';
  } finally {
    turnstile.reset();
    button.disabled = false;
    button.textContent = 'チェックする';
  }
}

form.addEventListener('submit', runCheck);
input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); });

/** トップページのURL入力から来た場合は、そのまま確認を始める。 */
const requested = new URLSearchParams(location.search).get('url');
if (requested) {
  input.value = requested.slice(0, 2048);
  if (api) void runCheck();
}
