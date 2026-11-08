// 変更履歴: 2026-11-08 安全チェックAPIの呼び出し、3段階の結果表示、相談欄への引き継ぎを追加。
// 役割: 入力URLの軽い検証、有限時間の呼び出し、取得結果だけの描画（結果を創作しない）を担当する。

type Status = 'ok' | 'advice' | 'action' | 'unknown';
interface Item { id: string; title: string; status: Status; summary: string; detail: string }
interface Result { target: string; checkedAt: string; items: Item[]; counts: Record<Status, number> }

const STATUS_LABEL: Record<Status, string> = { ok: '問題なし', advice: '確認をおすすめ', action: '要対応', unknown: '確認できず' };
const STATUS_ICON: Record<Status, string> = { ok: '✓', advice: '!', action: '×', unknown: '–' };

const form = document.querySelector<HTMLFormElement>('[data-check-form]')!;
const input = document.querySelector<HTMLInputElement>('#check-url')!;
const button = document.querySelector<HTMLButtonElement>('[data-check-run]')!;
const status = document.querySelector<HTMLElement>('[data-check-status]')!;
const resultSection = document.querySelector<HTMLElement>('[data-check-result]')!;
const consult = document.querySelector<HTMLAnchorElement>('[data-check-consult]')!;
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

function render(result: Result): void {
  document.querySelector('[data-check-target]')!.textContent = `確認したサイト：${result.target}`;
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
  const list = document.querySelector('[data-check-items]')!;
  list.replaceChildren();
  // 要対応→確認をおすすめ→問題なしの順に並べ、先に見るべき項目を上へ置く。
  const order: Status[] = ['action', 'advice', 'unknown', 'ok'];
  for (const entry of [...result.items].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))) {
    const row = document.createElement('li');
    row.className = 'check-item';
    const body = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = entry.title;
    const text = document.createElement('p');
    text.textContent = entry.summary;
    body.append(title, text);
    if (entry.detail) {
      const detail = document.createElement('p');
      detail.textContent = entry.detail;
      body.append(detail);
    }
    row.append(badge(entry.status), body);
    list.append(row);
  }
  const checkedAt = new Date(result.checkedAt);
  document.querySelector('[data-check-time]')!.textContent = `${checkedAt.toLocaleString('ja-JP')} 時点の結果です。サイトの状態を保証するものではありません。`;

  const needsWork = result.items.filter((item) => item.status === 'action' || item.status === 'advice');
  const note = needsWork.length
    ? `安全チェックで気になった項目：${needsWork.map((item) => `${item.title}（${STATUS_LABEL[item.status]}）`).join('、')}`
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
    const response = await fetch(`${api}/api/check?url=${encodeURIComponent(entered)}`, { signal: AbortSignal.timeout(30000) });
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
