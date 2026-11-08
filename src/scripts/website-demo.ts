// 変更履歴: 2026-11-09 見出し・写真・条件・行動の解説切り替え、余白の可視化と文字拡大を追加。
// 役割: 設計した情報の順序を体験する。視線の計測や予約処理、外部送信は行わない。
// 変更履歴: 2026-11-09 スマホの近接解説から次の対象へ移動できる操作と、通常時の設計値である旨の表記を追加。
const designSteps = [
  { title: 'まず、ここに目がいきませんでしたか？', body: '大きな見出しで、何のお店か・どんな気分になれるかを先に伝えています。目を引く強さに差をつけるのが、情報の優先順位です。', value: '通常表示：見出し32〜48px ／ 本文16px' },
  { title: '写真で、言葉を具体的なイメージに。', body: '花の色や質感を写真で伝えます。文章を写真に重ねないので、読みやすさを保ったまま商品のイメージが分かります。写真から先に見る人もいます。', value: '意味のある写真に代替テキスト ／ 画像の表示領域を事前に確保' },
  { title: '価格と条件は、近くにまとめる。', body: '気になった後に必要になる価格・受け取り・予約期限を同じ場所へ。関連する情報を近づけ、別のまとまりとの間に余白を取ります。', value: '通常表示：本文16px・行間1.75 ／ まとまりの間は24px' },
  { title: '納得したら、次の一歩へ。', body: '主なボタンは一つに絞り、何が起こるかを具体的に書きます。価格や条件の後に置き、判断してから進めるようにしています。', value: 'ボタン高さ48px以上 ／ 文字と背景の対比を確保' },
];

/** 解説の選択と見本の強調を同期し、通常表示と比較表示を利用者の操作で切り替える。 */
function setupWebsiteDesignDemo(): void {
  const websiteDemo = document.querySelector<HTMLElement>('[data-website-demo]');
  if (!websiteDemo) return;
  const guideToggle = websiteDemo.querySelector<HTMLButtonElement>('[data-guide-toggle]')!;
  const spacingToggle = websiteDemo.querySelector<HTMLButtonElement>('[data-spacing-toggle]')!;
  const typeToggle = websiteDemo.querySelector<HTMLButtonElement>('[data-type-toggle]')!;
  const guidePanel = websiteDemo.querySelector<HTMLElement>('#design-guide-panel')!;
  const feedback = websiteDemo.querySelector<HTMLElement>('[data-website-feedback]')!;
  const previousStep = websiteDemo.querySelector<HTMLButtonElement>('[data-guide-prev]')!;
  const nextStep = websiteDemo.querySelector<HTMLButtonElement>('[data-guide-next]')!;
  let activeStep = 0;

  /** 選択した解説だけを強調し、番号・読み上げ・前後ボタンを同時に更新する。 */
  const showStep = (stepIndex: number): void => {
    activeStep = stepIndex;
    const selectedStep = designSteps[activeStep];
    websiteDemo.querySelector('[data-guide-title]')!.textContent = selectedStep.title;
    websiteDemo.querySelector('[data-guide-body]')!.textContent = selectedStep.body;
    websiteDemo.querySelector('[data-guide-value]')!.textContent = selectedStep.value;
    websiteDemo.querySelector('[data-guide-progress]')!.textContent = `${activeStep + 1} / ${designSteps.length}`;
    websiteDemo.querySelectorAll<HTMLElement>('[data-guide-zone]').forEach(zone => zone.toggleAttribute('data-selected', Number(zone.dataset.guideZone) === activeStep + 1));
    websiteDemo.querySelectorAll<HTMLButtonElement>('[data-guide-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.guideStep) === activeStep + 1)));
    previousStep.disabled = activeStep === 0;
    nextStep.textContent = activeStep === designSteps.length - 1 ? '最初に戻る' : '次のポイントへ';
  };

  /** スマホでは近接解説を使って対象へ移動し、固定ヘッダーの下で番号へフォーカスを戻す。 */
  const moveToStep = (stepIndex: number): void => {
    showStep(stepIndex);
    if (!matchMedia('(max-width: 680px)').matches) return;
    const targetZone = websiteDemo.querySelector<HTMLElement>(`[data-guide-zone="${stepIndex + 1}"]`)!;
    targetZone.querySelector<HTMLButtonElement>('[data-guide-step]')!.focus({ preventScroll: true });
    targetZone.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  guideToggle.disabled = false;
  spacingToggle.disabled = false;
  typeToggle.disabled = false;
  guideToggle.addEventListener('click', () => {
    const showGuide = guideToggle.getAttribute('aria-pressed') !== 'true';
    guideToggle.setAttribute('aria-pressed', String(showGuide));
    guideToggle.textContent = showGuide ? '解説を閉じる' : '解説を見る';
    websiteDemo.toggleAttribute('data-guided', showGuide);
    guidePanel.hidden = !showGuide;
    if (showGuide) showStep(activeStep);
  });
  websiteDemo.querySelectorAll<HTMLButtonElement>('[data-guide-step]').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.guideStep) - 1)));
  previousStep.addEventListener('click', () => moveToStep(Math.max(0, activeStep - 1)));
  nextStep.addEventListener('click', () => moveToStep((activeStep + 1) % designSteps.length));
  websiteDemo.querySelectorAll<HTMLButtonElement>('[data-guide-go]').forEach(button => button.addEventListener('click', () => moveToStep(Number(button.dataset.guideGo) - 1)));
  spacingToggle.addEventListener('click', () => {
    const showSpacing = spacingToggle.getAttribute('aria-pressed') !== 'true';
    spacingToggle.setAttribute('aria-pressed', String(showSpacing));
    websiteDemo.toggleAttribute('data-show-spacing', showSpacing);
    feedback.textContent = showSpacing ? '淡い緑の部分がまとまりの間の余白です。近い情報と離れた情報の関係を見比べてみてください。' : '余白の表示を閉じました。余白そのものは通常の見本にも使われています。';
  });
  typeToggle.addEventListener('click', () => {
    const useLargeType = typeToggle.getAttribute('aria-pressed') !== 'true';
    typeToggle.setAttribute('aria-pressed', String(useLargeType));
    typeToggle.textContent = useLargeType ? '文字を元に戻す' : '文字を大きくする';
    websiteDemo.toggleAttribute('data-large-type', useLargeType);
    feedback.textContent = useLargeType ? '本文を16pxから20pxへ。文字が大きくなっても、情報が重なったりボタンが隠れたりしない配置にしています。' : '本文を16pxへ戻しました。ご自身にとっての読みやすさを比べてみてください。';
  });
  websiteDemo.querySelector('[data-flower-reserve]')!.addEventListener('click', () => {
    if (websiteDemo.hasAttribute('data-guided')) showStep(3);
    feedback.textContent = 'ここは予約ボタンの操作見本です。実際のサイトでは受け取り日時の選択へ進みます。このサンプルでは予約・購入・送信は行われません。';
  });
}
setupWebsiteDesignDemo();
