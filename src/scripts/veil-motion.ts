// 変更履歴: 2026-11-11 試作用の即時切替と、入力を奪わない装飾追従を追加。
/** 最新の選択だけを即時表示する。アニメーションの待ち行列・自動送りは作らない。 */
function setupVeilPreview(): void {
  const stage = document.querySelector<HTMLElement>('[data-veil-stage]');
  if (!stage) return;
  const choices = stage.querySelectorAll<HTMLButtonElement>('[data-veil-choice]');
  const scenes = stage.querySelectorAll<HTMLElement>('[data-veil-scene]');
  const topVeil = stage.querySelector<HTMLElement>('[data-veil-top]');
  const bottomVeil = stage.querySelector<HTMLElement>('[data-veil-bottom]');
  const motionButton = stage.querySelector<HTMLButtonElement>('[data-veil-motion]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let motionPaused = false;
  let pendingFrame = 0;
  let pointerOffsetX = 0;
  let pointerOffsetY = 0;

  /** 装飾の位置のみ更新し、文字・操作ボタンの位置は変えない。 */
  const paintVeil = (): void => {
    pendingFrame = 0;
    if (topVeil) topVeil.style.transform = `translate(${pointerOffsetX}px, ${pointerOffsetY}px)`;
    if (bottomVeil) bottomVeil.style.transform = `translate(${-pointerOffsetX}px, ${-pointerOffsetY}px)`;
  };
  /** 保留中の描画を破棄し、停止・画面離脱時には静止位置へ戻す。 */
  const resetVeil = (): void => {
    cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
    pointerOffsetX = 0;
    pointerOffsetY = 0;
    paintVeil();
  };
  choices.forEach(choice => choice.addEventListener('click', () => {
    const selectedScene = choice.dataset.veilChoice;
    choices.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === choice)));
    scenes.forEach(scene => { scene.hidden = scene.dataset.veilScene !== selectedScene; });
  }));
  stage.addEventListener('pointermove', event => {
    if (motionPaused || reducedMotion.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
    const bounds = stage.getBoundingClientRect();
    pointerOffsetX = ((event.clientX - bounds.left) / bounds.width - .5) * 44;
    pointerOffsetY = ((event.clientY - bounds.top) / bounds.height - .5) * 32;
    if (!pendingFrame) pendingFrame = requestAnimationFrame(paintVeil);
  }, { passive: true });
  stage.addEventListener('pointerleave', resetVeil, { passive: true });
  motionButton?.addEventListener('click', () => {
    motionPaused = !motionPaused;
    stage.toggleAttribute('data-veil-paused', motionPaused);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    motionButton.textContent = motionPaused ? '動きを再開する' : '動きを止める';
    resetVeil();
  });
  /** 利用者の設定変更を即時反映し、縮小モーション時には装飾を動かさない。 */
  const syncMotionPreference = (): void => {
    resetVeil();
    if (motionButton) motionButton.hidden = reducedMotion.matches || !finePointer.matches;
  };
  reducedMotion.addEventListener('change', syncMotionPreference);
  finePointer.addEventListener('change', syncMotionPreference);
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetVeil(); });
  syncMotionPreference();
}
setupVeilPreview();
