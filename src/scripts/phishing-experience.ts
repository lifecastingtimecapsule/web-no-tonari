// 変更履歴: 2026-11-09 解説の直下から次問へ進め、回答操作は再挑戦時に戻す。
// 変更履歴: 2026-11-09 登録不要のフィッシング体験を追加。結果は画面内だけに表示する。
// 役割: 箇所の指摘・詐欺の判定・疑似リンク・やり直しを扱う。通信や保存は行わない。
import { phishingScenarios, type PhishingAction } from '../data/phishing-scenarios';

// 一つの教材内で結果を入れ替え、キーボード利用者にも結果の見出しを届ける。
function initializePhishingExperience(root: HTMLElement) {
  const scenario = phishingScenarios.find(item => item.id === root.dataset.phishingScenario);
  if (!scenario) return;
  const phishingResponses = scenario.responses;
  const intro = root.querySelector<HTMLElement>('[data-phishing-intro]');
  const result = root.querySelector<HTMLElement>('[data-phishing-result]');
  const title = root.querySelector<HTMLElement>('[data-phishing-title]');
  const explanation = root.querySelector<HTMLElement>('[data-phishing-explanation]');
  const takeaway = root.querySelector<HTMLElement>('[data-phishing-takeaway]');
  const simulation = root.querySelector<HTMLElement>('[data-phishing-simulation]');
  const actions = root.querySelector<HTMLElement>('[data-phishing-actions]');
  const reset = root.querySelector<HTMLButtonElement>('[data-phishing-reset]');
  if (!intro || !result || !title || !explanation || !takeaway || !simulation || !reset || !actions) return;
  const controls = root.querySelectorAll<HTMLButtonElement>('[data-phishing-point], [data-phishing-action]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealAnimation: Animation | undefined;

  // 回答に応じて同じ領域を更新。解説は一度の短い動きで表示し、直下の次問操作へつなぐ。
  function showResult(action: PhishingAction, control: HTMLButtonElement) {
    const response = phishingResponses[action];
    if (!result || !intro || !title || !explanation || !takeaway || !simulation || !reset || !actions) return;
    revealAnimation?.cancel();
    intro.hidden = true;
    actions.hidden = true;
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
    if (!reducedMotion.matches) revealAnimation = result.animate([{ opacity: 0.6, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 340, easing: 'cubic-bezier(.16,1,.3,1)' });
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
    actions.hidden = false;
    result.hidden = true;
    reset.hidden = true;
    simulation.hidden = true;
    controls.forEach(button => button.classList.remove('is-selected'));
    root.querySelector<HTMLButtonElement>('[data-phishing-point="sender"]')?.focus();
  });
}

document.querySelectorAll<HTMLElement>('[data-phishing-experience]').forEach(initializePhishingExperience);

// 変更履歴: 2026-11-09 三問を一つずつ表示。移動先の見出しへフォーカスし、各問の回答はその場で保持する。
// 役割: 前後移動と最初の問題への循環を行う。URL・保存領域へ回答情報を書き込まない。
document.querySelectorAll<HTMLElement>('[data-phishing-quiz]').forEach(quiz => {
  const panels = Array.from(quiz.querySelectorAll<HTMLElement>('[data-phishing-panel]'));
  const navigation = quiz.querySelector<HTMLElement>('[data-phishing-navigation]');
  const previous = quiz.querySelector<HTMLButtonElement>('[data-phishing-previous]');
  const next = quiz.querySelectorAll<HTMLButtonElement>('[data-phishing-next]');
  const progress = quiz.querySelector<HTMLElement>('[data-phishing-progress]');
  if (!panels.length || !navigation || !previous || !next.length || !progress) return;
  let activeQuestion = 0;
  // 一問だけを表示し、問題番号と操作名を同時に更新する。
  function selectQuestion(position: number, moveFocus = true) {
    activeQuestion = position;
    panels.forEach((panel, index) => { panel.hidden = index !== activeQuestion; });
    previous!.disabled = activeQuestion === 0;
    progress!.textContent = `問題 ${activeQuestion + 1} / ${panels.length}`;
    if (moveFocus) {
      const panel = panels[activeQuestion];
      const intro = panel.querySelector<HTMLElement>('[data-phishing-intro]');
      const heading = panel.querySelector<HTMLElement>(intro?.hidden ? '[data-phishing-title]' : '[data-phishing-question]');
      heading?.focus({ preventScroll: true });
      navigation!.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  selectQuestion(0, false);
  navigation.hidden = false;
  previous.addEventListener('click', () => selectQuestion(Math.max(0, activeQuestion - 1)));
  next.forEach(button => button.addEventListener('click', () => selectQuestion((activeQuestion + 1) % panels.length)));
});
