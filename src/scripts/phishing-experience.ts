// 変更履歴: 2026-11-09 登録不要のフィッシング体験を追加。結果は画面内だけに表示する。
// 役割: 箇所の指摘・詐欺の判定・疑似リンク・やり直しを扱う。通信や保存は行わない。
const phishingResponses = {
  sender: { title: '番号だけでは、まだ分かりません。', explanation: '知らない番号は立ち止まるきっかけ。ただ、表示された番号だけでは本物かどうかを判断できません。', takeaway: '次は、本文やURLも確かめてみましょう。', tone: 'hint' },
  urgency: { title: '急がせる言葉に、気づきました。', explanation: '「本日中に」と焦らせ、確認する前に操作させる手口があります。期限のある連絡がすべて詐欺という意味ではありません。', takeaway: 'そのまま進まず、不在票や公式アプリで確認。', tone: 'found' },
  url: { title: '怪しいURLに、気づけました。', explanation: '「japanpost」と書かれていても、日本郵便の公式サイトとは別です。この見本の.testは説明用のドメインです。', takeaway: '見慣れた名前だけで信じず、普段の公式の入口から。', tone: 'found' },
  judge: { title: '正解。この例はフィッシングです。', explanation: '再配達の少額料金を口実に、偽の支払い画面へ誘導するケースです。会社名や金額の小ささで信用しないことが大切です。', takeaway: '届いたリンクを使わず、不在票や公式アプリで確認。', tone: 'found' },
  open: { title: 'これは、詐欺の誘導です。', explanation: 'この先にあるのは、カード情報を入力させる偽の支払い画面。少額の再配達料金は、その入口です。', takeaway: '開いても、入力せず閉じる。公式の入口で確かめる。', tone: 'trap' },
} as const;

type PhishingAction = keyof typeof phishingResponses;

// 一つの教材内で結果を入れ替え、キーボード利用者にも結果の見出しを届ける。
function initializePhishingExperience(root: HTMLElement) {
  const intro = root.querySelector<HTMLElement>('[data-phishing-intro]');
  const result = root.querySelector<HTMLElement>('[data-phishing-result]');
  const title = root.querySelector<HTMLElement>('[data-phishing-title]');
  const explanation = root.querySelector<HTMLElement>('[data-phishing-explanation]');
  const takeaway = root.querySelector<HTMLElement>('[data-phishing-takeaway]');
  const simulation = root.querySelector<HTMLElement>('[data-phishing-simulation]');
  const reset = root.querySelector<HTMLButtonElement>('[data-phishing-reset]');
  if (!intro || !result || !title || !explanation || !takeaway || !simulation || !reset) return;
  const controls = root.querySelectorAll<HTMLButtonElement>('[data-phishing-point], [data-phishing-action]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealAnimation: Animation | undefined;

  // 回答に応じて同じ領域を更新。危険なリンクの演出は一度の短い動きに限定する。
  function showResult(action: PhishingAction, control: HTMLButtonElement) {
    const response = phishingResponses[action];
    if (!result || !intro || !title || !explanation || !takeaway || !simulation || !reset) return;
    revealAnimation?.cancel();
    intro.hidden = true;
    result.hidden = false;
    result.dataset.tone = response.tone;
    title.textContent = response.title;
    explanation.textContent = response.explanation;
    takeaway.textContent = response.takeaway;
    simulation.hidden = action !== 'open';
    reset.hidden = false;
    controls.forEach(button => button.classList.toggle('is-selected', button === control));
    title.focus({ preventScroll: true });
    const resultBounds = title.getBoundingClientRect();
    if (resultBounds.top < 100 || resultBounds.bottom > window.innerHeight) title.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    if (action === 'open' && !reducedMotion.matches) revealAnimation = result.animate([{ opacity: 0.6, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' });
  }

  controls.forEach(control => {
    control.disabled = false;
    control.addEventListener('click', () => {
      const action = control.dataset.phishingPoint ?? control.dataset.phishingAction;
      if (action && Object.hasOwn(phishingResponses, action)) showResult(action as PhishingAction, control);
    });
  });
  // 再挑戦は表示と強調だけを初期化する。回答履歴は保存しない。
  reset.addEventListener('click', () => {
    revealAnimation?.cancel();
    intro.hidden = false;
    result.hidden = true;
    reset.hidden = true;
    simulation.hidden = true;
    controls.forEach(button => button.classList.remove('is-selected'));
    root.querySelector<HTMLButtonElement>('[data-phishing-point="sender"]')?.focus();
  });
}

document.querySelectorAll<HTMLElement>('[data-phishing-experience]').forEach(initializePhishingExperience);
