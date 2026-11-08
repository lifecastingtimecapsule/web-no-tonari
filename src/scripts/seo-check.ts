// 変更履歴: 2026-11-08 実際のGoogle解析と目的別ガイドを区別し、相談まで自社内でつなぐ処理を追加。
// 役割: URL検証、有限時間のAPI呼び出し、実測のみの表示、相談内容の引き継ぎを担当する。
const seoForm = document.querySelector<HTMLFormElement>('[data-seo-page-form]')!;
const seoUrl = document.querySelector<HTMLInputElement>('#check-url')!;
const seoGoal = document.querySelector<HTMLSelectElement>('#check-goal')!;
const seoRunStatus = document.querySelector<HTMLElement>('[data-seo-run-status]')!;
const seoRunButton = document.querySelector<HTMLButtonElement>('[data-seo-run]')!;
const seoResult = document.querySelector<HTMLElement>('[data-seo-result]')!;
const seoScore = document.querySelector<HTMLElement>('[data-seo-score]')!;
const seoFindings = document.querySelector<HTMLElement>('[data-seo-findings]')!;
const goalGuides: Record<string, { title: string; items: [string, string][] }> = {
  contact: { title: '問い合わせを増やしたいサイトで、確かめたいこと', items: [['何を頼めるか、最初の画面で分かるか', 'サービスの対象、提供内容、実例を具体的に。検索から来た人が、自分向けか判断できるようにします。'], ['費用と依頼範囲を比較できるか', '基本料金に含むもの、含まないもの、依頼後の流れを相談ボタンの近くに置きます。'], ['相談先と運営者が分かるか', '担当者や事業者情報、連絡先、情報の扱いを示し、短い入力で相談できるか確認します。']] },
  store: { title: '来店・予約につなげたいサイトで、確かめたいこと', items: [['地域名とお店の内容が伝わるか', 'ページタイトルや本文に、お店の名前、地域、提供するサービスを自然な言葉で記載します。'], ['営業時間・場所・料金が最新か', '地図、アクセス、定休日、予約条件を迷わず見つけられる位置に。スマホでの見やすさも確認します。'], ['予約までの操作が短いか', '予約方法と空き状況の確認先を明示し、電話・予約フォームを実際に使って確かめます。']] },
  ec: { title: '商品購入につなげたいサイトで、確かめたいこと', items: [['商品名と特徴が具体的か', '検索する人が使う言葉で商品を説明し、素材・サイズ・使い方が比較できるようにします。'], ['送料と発送条件が先に分かるか', '税込価格、送料、発送時期、返品条件を購入前に確認できる位置に置きます。'], ['スマホで選び、カートへ進めるか', '色やサイズの選択、在庫、カート内の合計表示を確認します。購入者を想定して最後まで操作します。']] },
};

/** 目的別の一般ガイドを、安全なテキストノードで描画する。 */
function renderGoalGuide(): void {
  const guide = goalGuides[seoGoal.value] ?? goalGuides.contact;
  document.querySelector('[data-seo-guide-title]')!.textContent = guide.title;
  const guideContainer = document.querySelector('[data-seo-guide]')!;
  guideContainer.replaceChildren();
  for (const [title, body] of guide.items) {
    const article = document.createElement('article');
    const heading = document.createElement('h4'); heading.textContent = title;
    const paragraph = document.createElement('p'); paragraph.textContent = body;
    article.append(heading, paragraph); guideContainer.append(article);
  }
  const consult = document.querySelector<HTMLAnchorElement>('[data-seo-page-consult]')!;
  const home = import.meta.env.BASE_URL.replace(/\/$/, '') + '/';
  const target = new URL(home, location.origin);
  target.searchParams.set('siteUrl', seoUrl.value);
  target.searchParams.set('service', `SEO改善（目的：${seoGoal.selectedOptions[0].text}）`);
  target.hash = 'contact'; consult.href = target.toString();
}

/** Googleの実測を取得する。取得不能・期限切れ時は点数や検出結果を創作しない。 */
async function runSeoCheck(event?: Event): Promise<void> {
  event?.preventDefault();
  let targetUrl: URL;
  try {
    const entered = seoUrl.value.trim();
    if (!entered || /\s/.test(entered)) throw new Error();
    targetUrl = new URL(/^https?:\/\//i.test(entered) ? entered : `https://${entered}`);
    if (!['https:', 'http:'].includes(targetUrl.protocol) || !targetUrl.hostname.includes('.') || targetUrl.username || targetUrl.password) throw new Error();
  } catch {
    seoRunStatus.textContent = 'https://example.com のような公開URLを入力してください。';
    seoUrl.setAttribute('aria-invalid', 'true'); seoUrl.focus(); return;
  }
  seoUrl.value = targetUrl.toString(); seoUrl.removeAttribute('aria-invalid');
  seoRunButton.disabled = true; seoUrl.readOnly = true; seoRunButton.textContent = '確認しています…';
  seoRunStatus.textContent = 'Googleのモバイル解析を取得しています。最大45秒ほどかかる場合があります。';
  seoResult.hidden = false; seoFindings.replaceChildren();
  document.querySelector('[data-seo-target]')!.textContent = targetUrl.toString();
  const external = document.querySelector<HTMLAnchorElement>('[data-seo-external]')!;
  external.href = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(targetUrl.toString())}&form_factor=mobile`;
  seoScore.textContent = '解析結果を取得しています…';
  renderGoalGuide();
  const abortController = new AbortController();
  const timeout = window.setTimeout(() => abortController.abort(), 45000);
  try {
    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    endpoint.searchParams.set('url', targetUrl.toString()); endpoint.searchParams.set('strategy', 'mobile');
    endpoint.searchParams.set('category', 'seo'); endpoint.searchParams.set('locale', 'ja');
    if (import.meta.env.PUBLIC_PAGESPEED_API_KEY) endpoint.searchParams.set('key', import.meta.env.PUBLIC_PAGESPEED_API_KEY);
    const response = await fetch(endpoint, { signal: abortController.signal });
    if (!response.ok) throw new Error(response.status === 429 ? 'quota' : 'unavailable');
    const report = await response.json();
    const lighthouse = report.lighthouseResult;
    const score = lighthouse?.categories?.seo?.score;
    if (lighthouse?.runtimeError || typeof score !== 'number' || score < 0 || score > 1) throw new Error('unavailable');
    seoScore.textContent = `モバイルSEOの基本確認：${Math.round(score * 100)} / 100（Google Lighthouse）`;
    const references = lighthouse.categories.seo.auditRefs as { id: string }[];
    const failedAudits = references.map(reference => lighthouse.audits?.[reference.id]).filter(audit => audit && typeof audit.score === 'number' && audit.score < 1);
    for (const audit of failedAudits) {
      const item = document.createElement('li'); item.textContent = audit.title; seoFindings.append(item);
    }
    if (!failedAudits.length) {
      const item = document.createElement('li'); item.textContent = '自動確認の対象では改善項目が検出されませんでした。内容や問い合わせ導線は別に確認が必要です。'; seoFindings.append(item);
    }
    seoRunStatus.textContent = '解析を取得しました。結果と目的別の確認ガイドを見てみましょう。';
  } catch (error) {
    const quotaExceeded = error instanceof Error && error.message === 'quota';
    seoScore.textContent = quotaExceeded ? '現在Googleの解析利用上限に達しているため、点数を取得できませんでした。' : '解析結果を取得できませんでした。URL、公開状態、通信状態を確認して再度お試しください。';
    seoRunStatus.textContent = '自動診断は未完了です。目的別の一般ガイドは下で確認できます。Googleの画面で直接確認することもできます。';
  } finally {
    clearTimeout(timeout); seoRunButton.disabled = false; seoUrl.readOnly = false; seoRunButton.textContent = 'もう一度確認する';
  }
}
seoForm.addEventListener('submit', runSeoCheck);
seoUrl.addEventListener('input', () => { seoResult.hidden = true; seoRunStatus.textContent = 'URLを変更しました。もう一度確認してください。'; });
seoGoal.addEventListener('change', () => { if (!seoResult.hidden) renderGoalGuide(); });
const initialUrl = new URLSearchParams(location.search).get('url');
if (initialUrl) { seoUrl.value = initialUrl; void runSeoCheck(); }
