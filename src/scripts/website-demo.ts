// 変更履歴: 2026-11-09 店舗の解説操作を、3問の選択と作り手の考えを読む操作へ置換。
// 役割: 回答を端末内の表示だけに反映する。採点・保存・外部送信はしない。

/** 選んだ案を示し、その場で解説を開く。JavaScriptなしでもdetailsから記事を読める。 */
function setupWebsiteDesignDemo(): void {
  const websiteDemo = document.querySelector<HTMLElement>('[data-website-demo]');
  if (!websiteDemo) return;
  websiteDemo.querySelectorAll<HTMLElement>('[data-design-question]').forEach(question => {
    const answer = question.querySelector<HTMLDetailsElement>('.design-answer')!;
    const feedback = question.querySelector<HTMLElement>('[data-choice-feedback]')!;
    const choices = question.querySelectorAll<HTMLButtonElement>('[data-design-choice]');
    choices.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        choices.forEach(choice => {
          const isSelected = choice === button;
          choice.setAttribute('aria-pressed', String(isSelected));
          choice.textContent = `${choice.dataset.designChoice}${isSelected ? 'を選択中' : 'を選ぶ'}`;
          choice.setAttribute('aria-label', `${question.querySelector('h3')!.textContent}：${choice.textContent}`);
        });
        answer.open = true;
        feedback.textContent = `${button.dataset.designChoice}を選びました。すぐ下に、弊社がこの目的で選ぶ案と理由を表示しました。`;
        // 縦積みの比較で解説が画面外になる場合だけ、固定ヘッダーの下へ読み始めを移す。
        const answerPosition = answer.getBoundingClientRect();
        if (answerPosition.top > window.innerHeight - 120 || answerPosition.top < 100) {
          answer.querySelector('summary')!.focus({ preventScroll: true });
          answer.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
      });
    });
  });
}
setupWebsiteDesignDemo();

// 変更履歴: 2026-11-09 配色セット・差し色の面積・端末プレビューを追加。
/** 内容を固定したまま色と面積を変え、選択と解説を同時に更新する。 */
function setupPaletteDemo(): void {
  const paletteDemo = document.querySelector<HTMLElement>('[data-palette-demo]');
  const palettePreview = paletteDemo?.querySelector<HTMLElement>('#palette-preview');
  const paletteFeedback = paletteDemo?.querySelector<HTMLElement>('[data-palette-feedback]');
  if (!paletteDemo || !palettePreview || !paletteFeedback) return;
  const paletteButtons = paletteDemo.querySelectorAll<HTMLButtonElement>('[data-palette-choice]');
  const accentButtons = paletteDemo.querySelectorAll<HTMLButtonElement>('[data-accent-choice]');
  // 画像や文章を差し替えず、何を変えたかを読み上げでも知らせる。
  function updatePaletteFeedback(): void {
    const selectedPalette = paletteDemo!.querySelector<HTMLButtonElement>('[data-palette-choice][aria-pressed="true"]');
    paletteFeedback!.textContent = `${selectedPalette?.dataset.paletteDescription ?? ''} ${palettePreview!.dataset.accentArea === 'large' ? '差し色を説明の背景にも使っています。' : '差し色はボタンだけに使っています。'}`;
  }
  paletteButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      palettePreview.dataset.palette = button.dataset.paletteChoice;
      paletteButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      updatePaletteFeedback();
    });
  });
  accentButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      palettePreview.dataset.accentArea = button.dataset.accentChoice;
      accentButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      updatePaletteFeedback();
    });
  });
}

/** 指定した実幅で配置を変え、閲覧画面に収まらない場合だけ見本全体を縮小表示する。 */
function setupResponsiveDemo(): void {
  const responsiveDemo = document.querySelector<HTMLElement>('[data-responsive-demo]');
  const responsiveStage = responsiveDemo?.querySelector<HTMLElement>('[data-responsive-stage]');
  const responsiveFrame = responsiveDemo?.querySelector<HTMLElement>('[data-responsive-frame]');
  const deviceFeedback = responsiveDemo?.querySelector<HTMLElement>('[data-device-feedback]');
  if (!responsiveDemo || !responsiveStage || !responsiveFrame || !deviceFeedback) return;
  const deviceButtons = responsiveDemo.querySelectorAll<HTMLButtonElement>('[data-device-choice]');
  const deviceWidths = { desktop: 960, tablet: 640, phone: 360 };
  const deviceLabels = { desktop: 'PC', tablet: 'タブレット', phone: 'スマホ' };
  let selectedDevice: keyof typeof deviceWidths = 'desktop';
  let pendingResize = 0;
  let lastStageWidth = 0;
  responsiveStage.dataset.ready = 'true';
  // 実際の見本幅と表示倍率を区別し、縮小表示をスマホ対応と誤認させない。
  function fitResponsivePreview(): void {
    const previewWidth = deviceWidths[selectedDevice];
    const stageWidth = responsiveStage!.clientWidth;
    const previewScale = Math.min(1, Math.max(1, stageWidth - 32) / previewWidth);
    responsiveFrame!.style.width = `${previewWidth}px`;
    responsiveFrame!.style.transform = `translateX(-50%) scale(${previewScale})`;
    responsiveStage!.style.height = `${Math.ceil(responsiveFrame!.offsetHeight * previewScale) + 32}px`;
    deviceFeedback!.textContent = `${deviceLabels[selectedDevice]}・幅${previewWidth}pxの配置。${previewScale < .99 ? '見本全体は、この画面に収まるよう縮小して表示しています。' : '見本を等倍で表示しています。'}`;
  }
  function scheduleResponsiveFit(): void {
    cancelAnimationFrame(pendingResize);
    pendingResize = requestAnimationFrame(fitResponsivePreview);
  }
  deviceButtons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const device = button.dataset.deviceChoice;
      if (device !== 'desktop' && device !== 'tablet' && device !== 'phone') return;
      selectedDevice = device;
      deviceButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      fitResponsivePreview();
    });
  });
  const previewObserver = new ResizeObserver(entries => {
    const frameChanged = entries.some(entry => entry.target === responsiveFrame);
    const stageWidth = responsiveStage.clientWidth;
    if (frameChanged || stageWidth !== lastStageWidth) {
      lastStageWidth = stageWidth;
      scheduleResponsiveFit();
    }
  });
  previewObserver.observe(responsiveStage);
  previewObserver.observe(responsiveFrame);
  document.fonts.ready.then(scheduleResponsiveFit);
  fitResponsivePreview();
}
setupPaletteDemo();
setupResponsiveDemo();
