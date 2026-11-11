// 変更履歴: 2026-11-11 再レビューで業務システム開発へ案内を統一。専門語と寄り道を減らし、問い合わせへ直接つなぐ。
// 変更履歴: 2026-11-11 コピー式の送信処理を削除。Resendへの直接送信はcontact-form.tsへ集約。
// 変更履歴: 2026-11-09 任意URLの常時表示に合わせ、不要な折りたたみ開閉処理を除去。検証と引き継ぎは維持。
// 変更履歴: 2026-11-09 サービス横送りを専用スクリプトへ移し、ホーム専用処理の重複読み込みを防止。
// 変更履歴: 2026-11-09 手動カルーセルを復元。安全チェック等の最新機能を維持し、サービス演出の対象も現行一覧へ戻す。
// 変更履歴: 2026-11-08 ナビを共通スクリプトへ移動し、空白相談の検証と動きの設定変更への追従を修正。
// 変更履歴: 2026-11-08 必須の依頼者情報を検証・コピーへ含め、相談文の入力・引継ぎ・画面幅に合わせた自動伸縮を追加。
// 変更履歴: 2026-11-04 ナビ、困りごと選択、対話線、デモフォームの動作を追加。
// 変更履歴: 2026-11-05 3Dヒーローを初期化し、ページ離脱時に描画資源を破棄する処理を追加。
// 変更履歴: 2026-11-08 抽象3Dの初期化を外し、実画面コラージュに軽いポインター追従を追加。
// 変更履歴: 2026-11-08 メニュー閉鎖中のEscapeでフォーム等からフォーカスを奪わないよう条件を修正。
// 変更履歴: 2026-11-08 固有プロジェクトのコラージュを外し、ヒーローを静的なサービス案内へ変更。
// 変更履歴: 2026-11-08 任意のサイトURL欄も、入力された場合だけURL形式を確認するよう追加。
// 変更履歴: 2026-11-08 相談導線と画面の重なりを段階的に見せる導入、サービス・診断のスクロール演出を追加。
// 変更履歴: 2026-11-08 SEOチェックで不正URLを外部へ開かないよう、ブラウザのURL形式検証を追加。
// 変更履歴: 2026-11-08 URL入力をヒーロー右側の確認画面へ同期する処理を追加。後から追加した抽象3Dの初期化は方針見直しで削除。
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
// 変更履歴: 2026-11-08 SEO確認後の相談表示と、URL・サービス名の相談欄への引き継ぎを追加。
// 変更履歴: 2026-11-08 赤い大見出しとヒーローのスクロール演出、最小入力の相談コピー操作を追加。
// 変更履歴: 2026-11-08 問い合わせの静止・簡素化依頼に合わせ、赤い文字帯のスクロール処理を撤去。
// 変更履歴: 2026-11-08 サービス一覧の左右ボタン・表示範囲・縮小モーション対応の手動横送りを追加。

type Concern = {
  id: string;
  service: string;
  title: string;
  body: string;
};

const concerns: Concern[] = [
  {
    id: 'maintain',
    service: 'ホームページ保守・更新',
    title: '日々の小さな更新から、安心して任せられる状態へ。',
    body: 'まず現在の環境と更新方法を確認します。必要な保守範囲を整理し、無理なく続けられる運用を一緒につくります。',
  },
  {
    id: 'renew',
    service: 'ホームページリニューアル',
    title: '見た目だけでなく、役割からつくり直す。',
    body: '誰に何を伝え、どんな相談につなげるかを整理します。いまある内容を活かしながら、必要な範囲から更新します。',
  },
  {
    id: 'ai',
    service: '業務システムの開発',
    title: 'AIを入れることではなく、仕事が少し楽になることから。',
    body: '文章作成、問い合わせ整理、情報検索など、現場で繰り返している作業を確認し、小さく試せる方法を提案します。',
  },
  {
    id: 'security',
    service: 'セキュリティ診断',
    title: '見えない不安を、確認できる項目へ変える。',
    body: 'サイト、更新環境、権限、バックアップなどを確認し、すぐ対応することと、今後整えることを分けてご案内します。',
  },
];

/** 選ばれた困りごとを対応方針へ接続し、押下状態と読み上げ内容を同期する。 */
function setupConcernTool(): void {
  const tool = document.querySelector<HTMLElement>('[data-concern-tool]');
  if (!tool) return;

  const service = tool.querySelector<HTMLElement>('[data-concern-service]');
  const title = tool.querySelector<HTMLElement>('[data-concern-title]');
  const body = tool.querySelector<HTMLElement>('[data-concern-body]');
  if (!service || !title || !body) return;
  const result = tool.querySelector<HTMLElement>('.concern-tool__result');
  if (!result) return;

  /** 選択中の案内を更新し、演出中の設定変更でも内容と選択状態を一致させる。 */
  const updateResult = (selected: Concern): void => {
    service.textContent = selected.service;
    title.textContent = selected.title;
    body.textContent = selected.body;
  };
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    if (!event.matches) return;
    gsap.killTweensOf(result);
    gsap.set(result, { opacity: 1, y: 0 });
    const selected = concerns.find(item => item.id === tool.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.dataset.concern);
    if (selected) updateResult(selected);
  });

  tool.querySelectorAll<HTMLButtonElement>('[data-concern]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = concerns.find((item) => item.id === button.dataset.concern);
      if (!selected) return;

      tool.querySelectorAll<HTMLButtonElement>('[data-concern]').forEach((choice) => {
        choice.setAttribute('aria-pressed', String(choice === button));
      });

      gsap.killTweensOf(result);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        gsap.set(result, { opacity: 1, y: 0 });
        updateResult(selected);
        return;
      }

      gsap.to(result, {
        opacity: 0,
        y: 8,
        duration: 0.16,
        onComplete: () => {
          updateResult(selected);
          gsap.to(result, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' });
        },
      });
    });
  });
}

/** 対話線とヒーローの一度だけの動きを、通常スクロールと縮小モーション設定に合わせる。 */
function setupMotion(): void {
  gsap.registerPlugin(ScrollTrigger);
  // 設定変更時にGSAPの動き・非表示状態を巻き戻し、本文を静止表示へ戻す。
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const heroPath = document.querySelector<SVGPathElement>('[data-hero-path]');
    const railFill = document.querySelector<HTMLElement>('[data-rail-fill]');

    /** ヒーローのコピーと対応画面を順に組み上げ、相談への視線を自然に集める。 */
    const hero = document.querySelector<HTMLElement>('[data-hero-motion]');
    if (hero) {
      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const heroTitle = hero.querySelector<HTMLElement>('[data-hero-title]');
      const heroLead = hero.querySelector<HTMLElement>('[data-hero-lead]');
      const heroConsult = hero.querySelector<HTMLElement>('[data-hero-consult]');
      const heroNote = hero.querySelector<HTMLElement>('[data-hero-note]');
      const heroBrowser = hero.querySelector<HTMLElement>('[data-hero-browser]');
      const heroMobile = hero.querySelector<HTMLElement>('[data-hero-mobile]');
      const heroHealth = hero.querySelector<HTMLElement>('[data-hero-health]');

      if (heroTitle) heroTimeline.from(heroTitle, { opacity: 0, y: 18, duration: 0.48 }, 0.04);
      if (heroLead) heroTimeline.from(heroLead, { opacity: 0, y: 12, duration: 0.36 }, 0.2);
      if (heroConsult) heroTimeline.from(heroConsult, { opacity: 0, y: 10, duration: 0.32 }, 0.28);
      if (heroNote) heroTimeline.from(heroNote, { opacity: 0, duration: 0.28 }, 0.4);
      if (heroBrowser) heroTimeline.from(heroBrowser, { clipPath: 'inset(0 0 14% 0 round 14px)', filter: 'blur(8px)', opacity: 0, scale: 0.96, y: 24, duration: 0.64 }, 0.12);
      if (heroMobile) heroTimeline.from(heroMobile, { opacity: 0, x: 20, y: 46, rotation: 10, duration: 0.52 }, 0.44);
      if (heroHealth) heroTimeline.from(heroHealth, { opacity: 0, x: 16, duration: 0.34 }, 0.55);
    }

    if (heroPath) {
      const length = heroPath.getTotalLength();
      gsap.set(heroPath, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(heroPath, { strokeDashoffset: 0, duration: 1.8, ease: 'expo.out', delay: 0.25 });
    }

    if (railFill) {
      gsap.fromTo(
        railFill,
        { scaleY: 0, transformOrigin: 'top' },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.concerns',
            endTrigger: '.security',
            start: 'top 72%',
            end: 'bottom 58%',
            scrub: 0.6,
          },
        },
      );
    }

    /** サービスは一覧として順に、診断は確認の入口として線から現れる。 */
    const serviceList = document.querySelector<HTMLElement>('[data-service-list]');
    if (serviceList) {
      gsap.from(serviceList.querySelectorAll('.service-row'), {
        opacity: 0,
        y: 18,
        duration: 0.42,
        stagger: 0.07,
        ease: 'power2.out',
        scrollTrigger: { trigger: serviceList, start: 'top 82%', toggleActions: 'play none none reverse' },
      });
    }

    const security = document.querySelector<HTMLElement>('[data-security-motion]');
    if (security) {
      const securityLine = security.querySelector<HTMLElement>('.security__line');
      const securityDiagnostic = security.querySelector<HTMLElement>('.security__diagnostic');
      if (securityLine) {
        gsap.from(securityLine, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: security, start: 'top 76%', toggleActions: 'play none none reverse' },
        });
      }
      if (securityDiagnostic) {
        gsap.from(securityDiagnostic, {
          opacity: 0,
          x: -16,
          duration: 0.42,
          ease: 'power2.out',
          scrollTrigger: { trigger: securityDiagnostic, start: 'top 88%', toggleActions: 'play none none reverse' },
        });
      }
    }
  });
}

/** 相談文を内容に合う高さへ伸縮し、URLからの引継ぎや画面幅の変化にも対応する。 */
function setupMessageAutosize(): void {
  const messageField = document.querySelector<HTMLTextAreaElement>('#message');
  if (!messageField) return;

  /** 高さを一度解放して内容量を測り、削除時にも小さな入力面へ戻せるようにする。 */
  const resizeMessage = (): void => {
    messageField.style.height = 'auto';
    const fieldStyle = getComputedStyle(messageField);
    const borderHeight = parseFloat(fieldStyle.borderTopWidth) + parseFloat(fieldStyle.borderBottomWidth);
    messageField.style.height = `${messageField.scrollHeight + borderHeight}px`;
  };
  messageField.style.overflowY = 'hidden';
  messageField.addEventListener('input', resizeMessage);
  let messageWidth = 0;
  new ResizeObserver(entries => {
    const nextWidth = entries[0].contentRect.width;
    if (nextWidth === messageWidth) return;
    messageWidth = nextWidth;
    resizeMessage();
  }).observe(messageField);
  document.fonts.ready.then(resizeMessage);
  resizeMessage();
}

/** 公開URLを軽く検証し、かんたん安全チェックのページへ引き渡す。 */
function setupSafetyCheck(): void {
  const form = document.querySelector<HTMLFormElement>('[data-safety-check-form]');
  const input = document.querySelector<HTMLInputElement>('#safety-check-url');
  const status = document.querySelector<HTMLElement>('[data-safety-check-status]');
  const previewUrl = document.querySelector<HTMLElement>('[data-check-preview-url]');
  const previewState = document.querySelector<HTMLElement>('[data-check-preview-state]');
  if (!form || !input || !status) return;

  /** URL欄の入力を右側の確認画面にも反映し、画面同士の役割を一つに保つ。 */
  const syncPreview = (): void => {
    const enteredUrl = input.value.trim();
    if (previewUrl) previewUrl.textContent = enteredUrl || 'yourbusiness.com';
    if (previewState) previewState.textContent = enteredUrl ? '確認の準備' : '入力待ち';
  };
  const showError = (): void => {
    input.setAttribute('aria-invalid', 'true');
    status.textContent = 'example.com のような、確認したいサイトのURLを入力してください。';
    input.focus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const enteredUrl = input.value.trim();
    if (!enteredUrl || /\s/.test(enteredUrl)) { showError(); return; }
    try {
      const targetUrl = new URL(/^https?:\/\//i.test(enteredUrl) ? enteredUrl : `https://${enteredUrl}`);
      if (!['http:', 'https:'].includes(targetUrl.protocol) || !targetUrl.hostname.includes('.')) throw new Error('invalid-url');
      const checkUrl = new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/check/`, location.origin);
      checkUrl.searchParams.set('url', targetUrl.hostname);
      if (previewState) previewState.textContent = '確認へ進む';
      input.removeAttribute('aria-invalid');
      window.location.assign(checkUrl.toString());
    } catch {
      showError();
    }
  });

  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    status.textContent = '';
    syncPreview();
  });
}

setupConcernTool();
setupMotion();
setupSafetyCheck();




/** ヒーロー画面だけをスクロールに連動させ、問い合わせ欄は静止表示を維持する。 */
function setupExpressiveMotion(): void {
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const visual = document.querySelector<HTMLElement>('.opening__visual');
    if (visual) gsap.to(visual, { y: -50, rotation: -3, ease: 'none', scrollTrigger: { trigger: '.opening', start: 'top top', end: 'bottom top', scrub: .8 } });
  });
}
setupExpressiveMotion();

/** サービス別ページから選んだ相談内容を、既存入力を上書きせず引き継ぐ。 */
const requestedService = new URLSearchParams(window.location.search).get('service');
const consultationMessage = document.querySelector<HTMLTextAreaElement>('#message');
if (requestedService && consultationMessage && !consultationMessage.value.trim()) {
  const requestedNote = new URLSearchParams(window.location.search).get('note')?.slice(0, 500);
  consultationMessage.value = `${requestedService.slice(0, 100).replace(/^AIアプリ開発$/, '業務システム開発')}について問い合わせたいです。\n${requestedNote ? `${requestedNote}\n` : ''}困っていること：`;
}
const requestedSiteUrl = new URLSearchParams(window.location.search).get('siteUrl');
const consultationSiteUrl = document.querySelector<HTMLInputElement>('#site-url');
if (requestedSiteUrl && consultationSiteUrl && !consultationSiteUrl.value.trim()) {
  try {
    const validSiteUrl = new URL(requestedSiteUrl);
    if (['https:', 'http:'].includes(validSiteUrl.protocol)) consultationSiteUrl.value = validSiteUrl.toString();
  } catch { /* 形式不正のクエリはフォームへ引き継がない。 */ }
}
setupMessageAutosize();
